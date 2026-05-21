import { defaultCache } from "@serwist/next/worker";
import { installSerwist } from "@serwist/sw";

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
  runtimeCaching: defaultCache,
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
