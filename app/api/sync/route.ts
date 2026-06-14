import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await request.json();
    
    const { 
      transactions = [], 
      accounts = [], 
      categories = [], 
      budgets = [], 
      journalEntries = [], 
      vaultEntries = [],
      researchTopics = [],
      savedItems = [],
      reminders = [],
      lastSyncAt
    } = data;

    // Helper to remove IndexedDB-only fields
    const cleanItem = (item: any) => {
      const { syncStatus, localVersion, remoteVersion, ...rest } = item;
      return rest;
    };

    // 1. PUSH: Upsert local data to Postgres
    // Note: We use a transaction to ensure all entities are saved atomically.
    await prisma.$transaction(async (tx: any) => {
      // Upsert Accounts
      for (const item of accounts) {
        await tx.account.upsert({
          where: { id: item.id },
          create: { ...cleanItem(item), userId },
          update: { ...cleanItem(item), userId }
        });
      }
      
      // Upsert Categories
      for (const item of categories) {
        await tx.category.upsert({
          where: { id: item.id },
          create: { ...cleanItem(item), userId },
          update: { ...cleanItem(item), userId }
        });
      }
      
      // Upsert Budgets
      for (const item of budgets) {
        await tx.budget.upsert({
          where: { id: item.id },
          create: { ...cleanItem(item), startDate: new Date(item.startDate), userId },
          update: { ...cleanItem(item), startDate: new Date(item.startDate), userId }
        });
      }
      
      // Upsert Transactions
      for (const item of transactions) {
        const itemData = { ...cleanItem(item), date: new Date(item.date), userId };
        await tx.transaction.upsert({
          where: { id: item.id },
          create: itemData,
          update: itemData
        });
      }
      
      // Upsert Journal Entries
      for (const item of journalEntries) {
        const validPhotoUrls = Array.isArray(item.photoUrls) 
          ? item.photoUrls.filter((url: any) => typeof url === 'string')
          : [];

        const itemData = { 
          ...cleanItem(item), 
          photoUrls: validPhotoUrls,
          date: new Date(item.date), 
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          userId 
        };
        await tx.journal.upsert({
          where: { id: item.id },
          create: itemData,
          update: itemData
        });
      }
      
      // Upsert Vault Entries
      for (const item of vaultEntries) {
        const itemData = { 
          ...cleanItem(item),
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          userId 
        };
        await tx.vault.upsert({
          where: { id: item.id },
          create: itemData,
          update: itemData
        });
      }

      // Upsert Research Topics
      for (const item of researchTopics) {
        const itemData = { 
          ...cleanItem(item),
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          userId 
        };
        await tx.researchTopic.upsert({
          where: { id: item.id },
          create: itemData,
          update: itemData
        });
      }

      // Upsert Saved Items
      for (const item of savedItems) {
        const itemData = { 
          ...cleanItem(item),
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          userId 
        };
        await tx.savedItem.upsert({
          where: { id: item.id },
          create: itemData,
          update: itemData
        });
      }

      // Upsert Reminders
      for (const item of reminders) {
        const itemData = { 
          ...cleanItem(item),
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
          userId 
        };
        await tx.reminder.upsert({
          where: { id: item.id },
          create: itemData,
          update: itemData
        });
      }
    });

    // 2. PULL: Get data modified since lastSyncAt from Postgres
    const pullSince = lastSyncAt ? new Date(lastSyncAt) : new Date(0);
    
    const [
      pulledAccounts,
      pulledCategories,
      pulledBudgets,
      pulledTransactions,
      pulledJournals,
      pulledVaults,
      pulledResearchTopics,
      pulledSavedItems,
      pulledReminders
    ] = await Promise.all([
      prisma.account.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.category.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.budget.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.transaction.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.journal.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.vault.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.researchTopic.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.savedItem.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.reminder.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        accounts: pulledAccounts,
        categories: pulledCategories,
        budgets: pulledBudgets,
        transactions: pulledTransactions,
        journalEntries: pulledJournals,
        vaultEntries: pulledVaults,
        researchTopics: pulledResearchTopics,
        savedItems: pulledSavedItems,
        reminders: pulledReminders,
      }
    });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
