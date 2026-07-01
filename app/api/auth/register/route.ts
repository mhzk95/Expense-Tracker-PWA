import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        bankAccounts: {
          create: [
            {
              name: "Cash",
              type: "cash",
              balance: 0,
              currency: "INR",
              status: "active",
              color: "#10b981",
              icon: "Wallet",
              includeInNetWorth: true,
              isDefault: true,
            },
            {
              name: "Main Checking",
              type: "checking",
              balance: 0,
              currency: "INR",
              status: "active",
              color: "#6366f1",
              icon: "Building2",
              includeInNetWorth: true,
              isDefault: false,
            }
          ]
        },
        categories: {
          create: [
            // Income (Green Spectrum)
            { name: "Salary", type: "income", color: "#22c55e", icon: "Banknote" },
            { name: "Freelance", type: "income", color: "#10b981", icon: "Briefcase" },
            { name: "Business", type: "income", color: "#059669", icon: "Building2" },
            { name: "Investments", type: "income", color: "#16a34a", icon: "TrendingUp" },
            { name: "Rental Income", type: "income", color: "#15803d", icon: "House" },
            { name: "Gifts", type: "income", color: "#84cc16", icon: "Gift" },
            { name: "Other Income", type: "income", color: "#65a30d", icon: "CircleDollarSign" },

            // Food & Dining (Orange/Yellow/Amber Spectrum)
            { name: "Groceries", type: "expense", color: "#f59e0b", icon: "ShoppingCart" },
            { name: "Dining Out", type: "expense", color: "#f97316", icon: "UtensilsCrossed" },
            { name: "Coffee & Snacks", type: "expense", color: "#fb923c", icon: "Coffee" },

            // Housing & Living (Purple/Violet/Lavender Spectrum)
            { name: "Rent/Mortgage", type: "expense", color: "#7c3aed", icon: "Home" },
            { name: "Utilities", type: "expense", color: "#8b5cf6", icon: "Zap" },
            { name: "Home Maintenance", type: "expense", color: "#9333ea", icon: "Hammer" },
            { name: "Furniture", type: "expense", color: "#a855f7", icon: "Sofa" },

            // Transportation (Blue Spectrum)
            { name: "Fuel", type: "expense", color: "#3b82f6", icon: "Fuel" },
            { name: "Public Transport", type: "expense", color: "#2563eb", icon: "Bus" },
            { name: "Ride Sharing", type: "expense", color: "#1d4ed8", icon: "CarTaxiFront" },
            { name: "Vehicle Maintenance", type: "expense", color: "#1e40af", icon: "Wrench" },

            // Health & Insurance (Red/Crimson Spectrum)
            { name: "Healthcare", type: "expense", color: "#ef4444", icon: "HeartPulse" },
            { name: "Insurance", type: "expense", color: "#dc2626", icon: "Shield" },

            // Finance & Taxes (Cyan/Teal/Sky Blue Spectrum)
            { name: "Savings", type: "expense", color: "#0ea5e9", icon: "PiggyBank" },
            { name: "Investments", type: "expense", color: "#0284c7", icon: "LineChart" },
            { name: "Loan Payments", type: "expense", color: "#0369a1", icon: "CreditCard" },
            { name: "Taxes", type: "expense", color: "#0f766e", icon: "Receipt" },

            // Lifestyle & Entertainment (Pink/Magenta Spectrum)
            { name: "Shopping", type: "expense", color: "#14b8a6", icon: "ShoppingBag" },
            { name: "Entertainment", type: "expense", color: "#ec4899", icon: "Tv" },
            { name: "Travel", type: "expense", color: "#06b6d4", icon: "Plane" },
            { name: "Subscriptions", type: "expense", color: "#f472b6", icon: "Repeat" },
            { name: "Hobbies", type: "expense", color: "#d946ef", icon: "Gamepad2" },

            // Family & Care (Indigo Spectrum)
            { name: "Education", type: "expense", color: "#6366f1", icon: "GraduationCap" },
            { name: "Childcare", type: "expense", color: "#818cf8", icon: "Baby" },
            { name: "Pets", type: "expense", color: "#4f46e5", icon: "PawPrint" },
            { name: "Parents", type: "expense", color: "#c084fc", icon: "Users" },
            { name: "Family Support", type: "expense", color: "#e879f9", icon: "HeartHandshake" },

            // Miscellaneous (Gray/Slate/Brown Spectrum)
            { name: "Gifts & Donations", type: "expense", color: "#a1a1aa", icon: "Gift" },
            { name: "Personal Care", type: "expense", color: "#fda4af", icon: "Sparkles" },
            { name: "Miscellaneous", type: "expense", color: "#6b7280", icon: "Package" },
          ]
        }
      },
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
