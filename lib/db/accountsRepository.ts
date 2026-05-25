import { getDB, AccountEntity } from "./indexeddb";

export const accountsRepository = {
  async getAll(): Promise<AccountEntity[]> {
    const db = await getDB();
    const allAccounts = await db.getAll("accounts");
    const validAccounts = allAccounts.filter((a: AccountEntity) => !a.isDeleted);
    
    // Calculate derived balance
    const transactions = await db.getAll("transactions");
    const validTransactions = transactions.filter((t: any) => !t.isDeleted && t.status !== "failed" && t.status !== "cancelled");

    return validAccounts.map((account: AccountEntity) => {
      let currentBalance = account.balance; // initial balance

      for (const t of validTransactions) {
        if (t.accountId === account.id) {
          if (t.type === "income") currentBalance += t.amount;
          else if (t.type === "expense") currentBalance -= t.amount;
          else if (t.type === "transfer") currentBalance -= t.amount;
        }
        if (t.type === "transfer" && t.toAccountId === account.id) {
          currentBalance += t.amount;
        }
      }

      return {
        ...account,
        balance: currentBalance
      };
    });
  },

  async add(account: Omit<AccountEntity, "isDeleted">): Promise<void> {
    const db = await getDB();
    const newAcc: AccountEntity = {
      ...account,
      isDeleted: false,
    };
    
    // Save locally
    await db.put("accounts", newAcc);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:accounts:changed"));
    }
  },

  async update(id: string, updates: Partial<Omit<AccountEntity, "id" | "isDeleted">>): Promise<void> {
    const db = await getDB();
    const existing = await db.get("accounts", id);
    if (!existing) throw new Error("Account not found");

    const updatedAcc: AccountEntity = {
      ...existing,
      ...updates,
    };

    await db.put("accounts", updatedAcc);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:accounts:changed"));
    }
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get("accounts", id);
    if (!existing) return;

    const deletedAcc: AccountEntity = {
      ...existing,
      isDeleted: true,
    };

    await db.put("accounts", deletedAcc);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:accounts:changed"));
    }
  }
};
