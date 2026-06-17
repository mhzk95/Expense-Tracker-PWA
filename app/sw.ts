import { defaultCache } from "@serwist/next/worker";
import { installSerwist } from "@serwist/sw";
import { NetworkOnly } from "serwist";
import { BackgroundSyncPlugin } from "@serwist/background-sync";

const bgSyncPlugin = new BackgroundSyncPlugin("telegramSyncQueue", {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours
});

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: any;
  }
}

declare const self: any;

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: /^https:\/\/api\.telegram\.org\/bot.*/,
      handler: new NetworkOnly({
        plugins: [bgSyncPlugin],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        revision: "v1-offline",
        matcher({ request }: any) {
          return request.destination === "document";
        },
      },
    ],
  },
});

self.addEventListener('push', (event: any) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Expense Tracker & Second Brain';
  const options = {
    body: data.body || 'You have a pending notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: data.data || { url: '/reminders' },
    actions: data.actions || [
      { action: 'done', title: 'Mark Done' },
      { action: 'snooze', title: 'Snooze 1h' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  // Handle actions (communicate back to app if open)
  if (event.action === 'done' || event.action === 'snooze') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList: any) => {
        for (const client of clientList) {
          client.postMessage({ type: 'NOTIFICATION_ACTION', action: event.action, data: event.notification.data });
        }
      })
    );
    return;
  }

  // Open the app to the specific URL
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList: any) => {
      const urlToOpen = event.notification.data?.url || '/reminders';
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('fetch', (event: any) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/api/share-target') {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const title = formData.get('share_title') || '';
        const text = formData.get('share_text') || '';
        const shareUrl = formData.get('share_url') || '';
        const files = formData.getAll('share_files');
        
        // Save to IndexedDB
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open('ExpenseTrackerDB');
          req.onerror = () => reject(req.error);
          req.onsuccess = () => resolve(req.result);
        });
        
        const tx = db.transaction('syncMetadata', 'readwrite');
        const store = tx.objectStore('syncMetadata');
        await new Promise((resolve, reject) => {
          const req = store.put({ title, text, url: shareUrl, files, timestamp: Date.now() }, 'share_payload');
          req.onsuccess = resolve;
          req.onerror = reject;
        });
        
        return Response.redirect('/research?shared=true', 303);
      } catch (err) {
        console.error('Share Target Error:', err);
        return Response.redirect('/research?share_error=true', 303);
      }
    })());
  }
});
