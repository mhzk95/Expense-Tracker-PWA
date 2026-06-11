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
      lastSyncAt
    } = data;

    // 1. PUSH: Upsert local data to Postgres
    // Note: We use a transaction to ensure all entities are saved atomically.
    await prisma.$transaction(async (tx: any) => {
      // Upsert Accounts
      for (const item of accounts) {
        await tx.account.upsert({
          where: { id: item.id },
          create: { ...item, userId },
          update: { ...item, userId }
        });
      }
      
      // Upsert Categories
      for (const item of categories) {
        await tx.category.upsert({
          where: { id: item.id },
          create: { ...item, userId },
          update: { ...item, userId }
        });
      }
      
      // Upsert Budgets
      for (const item of budgets) {
        await tx.budget.upsert({
          where: { id: item.id },
          create: { ...item, startDate: new Date(item.startDate), userId },
          update: { ...item, startDate: new Date(item.startDate), userId }
        });
      }
      
      // Upsert Transactions
      for (const item of transactions) {
        const itemData = { ...item, date: new Date(item.date), userId };
        await tx.transaction.upsert({
          where: { id: item.id },
          create: itemData,
          update: itemData
        });
      }
      
      // Upsert Journal Entries
      for (const item of journalEntries) {
        const itemData = { 
          ...item, 
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
          ...item,
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
    });

    // 2. PULL: Get data modified since lastSyncAt from Postgres
    const pullSince = lastSyncAt ? new Date(lastSyncAt) : new Date(0);
    
    const [
      pulledAccounts,
      pulledCategories,
      pulledBudgets,
      pulledTransactions,
      pulledJournals,
      pulledVaults
    ] = await Promise.all([
      prisma.account.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.category.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.budget.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.transaction.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.journal.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
      prisma.vault.findMany({ where: { userId, updatedAt: { gt: pullSince } } }),
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
      }
    });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
