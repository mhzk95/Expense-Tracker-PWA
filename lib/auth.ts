import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('--- Authorize called ---');
          
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });
          
          console.log('User found: ' + (user ? user.id : 'null'));
          
          if (!user || !user.password) {
            console.log('User not found or no password');
            throw new Error("Invalid email or password");
          }

          const isMatch = await bcrypt.compare(credentials.password, user.password);
          console.log('Password match: ' + isMatch);
          
          if (!isMatch) {
            console.log('Password mismatch');
            throw new Error("Invalid email or password");
          }

          console.log('Authorize success');
          return { id: user.id, name: user.name, email: user.email };
        } catch (error: any) {
          console.error('Error in authorize: ' + error.message);
          throw error;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
  },
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
