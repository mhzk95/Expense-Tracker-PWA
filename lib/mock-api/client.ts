import { SyncQueueItem } from "@/lib/db/indexeddb";

// Simulates network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface MockApiResponse {
  success: boolean;
  serverVersion?: number;
  conflict?: boolean;
  remoteData?: any;
  error?: string;
}

export const mockApiClient = {
  async processMutation(item: SyncQueueItem): Promise<MockApiResponse> {
    // Simulate latency
    await delay(800 + Math.random() * 500);

    // Simulate random offline/network failure
    if (!navigator.onLine) {
      throw new Error("Network unavailable");
    }

    // Simulate 5% random server error (only for non-conflicts)
    if (Math.random() < 0.05) {
      return { success: false, error: "500 Internal Server Error" };
    }

    const { mutationType, payload } = item;

    // Simulate conflict: If the item has `simulateConflict` in the payload for testing
    if (payload?.simulateConflict) {
      return {
        success: false,
        conflict: true,
        serverVersion: (payload.localVersion || 1) + 1,
        remoteData: {
          ...payload,
          amount: (payload.amount || 0) + 50,
          note: "Updated remotely",
        },
      };
    }

    // Simulate success
    return {
      success: true,
      serverVersion: (payload?.localVersion || 0) + 1,
    };
  }
};
