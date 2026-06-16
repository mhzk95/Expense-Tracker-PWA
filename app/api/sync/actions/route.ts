import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    // We allow local requests to bypass strict auth for testing, just like the upload route
    const host = request.headers.get("host") || "";
    const isLocalRequest = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("192.168.") || host.startsWith("10.");
    
    if (!userId && process.env.NODE_ENV !== "development" && !isLocalRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Default to a system user ID if local testing bypasses auth
    const activeUserId = userId || "local-test-user-id";

    const data = await request.json();
    const actions: any[] = data.actions || [];

    if (actions.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const cleanItem = (item: any) => {
      const { syncStatus, localVersion, remoteVersion, ...rest } = item;
      return rest;
    };

    const syncQueries = [];

    for (const action of actions) {
      const { entity, payload } = action;
      if (!payload || !payload.id) continue;

      const itemData = { ...cleanItem(payload), userId: activeUserId };

      // Convert date strings to Date objects if they exist
      if (itemData.date) itemData.date = new Date(itemData.date);
      if (itemData.startDate) itemData.startDate = new Date(itemData.startDate);
      if (itemData.dueDate) itemData.dueDate = new Date(itemData.dueDate);
      if (itemData.createdAt) itemData.createdAt = new Date(itemData.createdAt);
      if (itemData.updatedAt) itemData.updatedAt = new Date(itemData.updatedAt);

      // Handle specific entity quirks (like photoUrls for Journal)
      if (entity === "JOURNAL") {
        itemData.photoUrls = Array.isArray(itemData.photoUrls) 
          ? itemData.photoUrls.filter((url: any) => typeof url === 'string')
          : [];
        
        if (itemData.audioFileId && typeof itemData.audioFileId !== 'string') {
          itemData.audioFileId = null;
        }
      }

      // Map the entity string to the corresponding Prisma model
      // Because the payload contains the full object state (including isDeleted),
      // we can safely use upsert for all CREATE, UPDATE, and DELETE actions.
      switch (entity) {
        case "TRANSACTION":
          syncQueries.push(prisma.transaction.upsert({ where: { id: itemData.id }, create: itemData, update: itemData }));
          break;
        case "JOURNAL":
          syncQueries.push(prisma.journal.upsert({ where: { id: itemData.id }, create: itemData, update: itemData }));
          break;
        case "ACCOUNT":
          syncQueries.push(prisma.account.upsert({ where: { id: itemData.id }, create: itemData, update: itemData }));
          break;
        case "CATEGORY":
          syncQueries.push(prisma.category.upsert({ where: { id: itemData.id }, create: itemData, update: itemData }));
          break;
        case "VAULT":
          syncQueries.push(prisma.vault.upsert({ where: { id: itemData.id }, create: itemData, update: itemData }));
          break;
        case "RESEARCH_TOPIC":
          syncQueries.push(prisma.researchTopic.upsert({ where: { id: itemData.id }, create: itemData, update: itemData }));
          break;
        case "SAVED_ITEM":
          syncQueries.push(prisma.savedItem.upsert({ where: { id: itemData.id }, create: itemData, update: itemData }));
          break;
        case "REMINDER":
          syncQueries.push(prisma.reminder.upsert({ where: { id: itemData.id }, create: itemData, update: itemData }));
          break;
        case "BUDGET":
          syncQueries.push(prisma.budget.upsert({ where: { id: itemData.id }, create: itemData, update: itemData }));
          break;
        default:
          console.warn(`Unknown entity type in sync queue: ${entity}`);
      }
    }

    // Execute all action queries in a single batch transaction
    if (syncQueries.length > 0) {
      await prisma.$transaction(syncQueries);
    }

    return NextResponse.json({ 
      success: true, 
      processed: syncQueries.length,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error("Action Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
