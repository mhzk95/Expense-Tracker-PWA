import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    // Allow local testing bypass
    const host = request.headers.get("host") || "";
    const isLocalRequest = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("192.168.") || host.startsWith("10.");
    
    if (!userId && process.env.NODE_ENV !== "development" && !isLocalRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeUserId = userId || "local-test-user-id";
    const { searchParams } = new URL(request.url);
    
    const cursorStr = searchParams.get("cursor");
    const pullSince = cursorStr ? new Date(cursorStr) : new Date(0);
    
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 500;

    const entitiesParam = searchParams.get("entities");
    const requestedEntities = entitiesParam ? entitiesParam.split(",") : ["ALL"];

    const wants = (entity: string) => requestedEntities.includes("ALL") || requestedEntities.includes(entity);

    const queries: any[] = [];
    const keys: string[] = [];

    const addQuery = (key: string, model: any) => {
      if (wants(key)) {
        keys.push(key);
        queries.push(
          model.findMany({ 
            where: { userId: activeUserId, updatedAt: { gt: pullSince } },
            orderBy: { updatedAt: 'asc' },
            take: limit
          })
        );
      }
    };

    addQuery("accounts", prisma.account);
    addQuery("categories", prisma.category);
    addQuery("budgets", prisma.budget);
    addQuery("transactions", prisma.transaction);
    addQuery("journalEntries", prisma.journal);
    addQuery("vaultEntries", prisma.vault);
    addQuery("researchTopics", prisma.researchTopic);
    addQuery("savedItems", prisma.savedItem);
    addQuery("reminders", prisma.reminder);

    let results: any[] = [];
    if (queries.length > 0) {
      // Execute read queries in parallel without starting a transaction block,
      // avoiding transaction timeouts and lock contention.
      results = await Promise.all(queries);
    }
    
    const data: Record<string, any[]> = {};
    let hasMore = false;
    let latestTimestamp = pullSince.getTime();

    results.forEach((resultList, index) => {
      const key = keys[index];
      data[key] = resultList;
      if (resultList.length === limit) {
        hasMore = true;
      }
      if (resultList.length > 0) {
        const maxTime = new Date(resultList[resultList.length - 1].updatedAt).getTime();
        if (maxTime > latestTimestamp) {
          latestTimestamp = maxTime;
        }
      }
    });

    return NextResponse.json({
      success: true,
      hasMore,
      nextCursor: new Date(latestTimestamp).toISOString(),
      data
    });

  } catch (error: any) {
    console.error("Sync Pull Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
