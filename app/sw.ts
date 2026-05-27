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
