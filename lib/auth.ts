import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Provide Google for production use
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // Simple dev credential login for testing cloud DB sync
    CredentialsProvider({
      name: "Development Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@expense.tracker" },
        password: { label: "Password", type: "password", placeholder: "any password works" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        let user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user) {
           user = await prisma.user.create({
             data: { email: credentials.email, name: "Demo User" }
           });
        }
        return { id: user.id, name: user.name, email: user.email };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-do-not-use-in-prod",
};
