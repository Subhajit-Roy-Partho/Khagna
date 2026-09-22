import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb, initDb } from "./db";

export const authOptions: NextAuthOptions = {
  // OAuth apps (any subset works — configure what you have, see docs/06):
  //  GitHub:  github.com/settings/developers → AUTH_GITHUB_ID / AUTH_GITHUB_SECRET
  //  Google:  console.cloud.google.com → AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
  // Username+password accounts live in the users table (bcrypt-hashed).
  providers: [
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email + password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = String(creds?.email || "").toLowerCase().trim();
        const password = String(creds?.password || "");
        if (!email || !password) return null;
        await initDb();
        const row = (
          await getDb().execute({ sql: "SELECT * FROM users WHERE email=? LIMIT 1", args: [email] })
        ).rows[0] as unknown as
          | { id: number; name: string; email: string; password_hash: string; image: string }
          | undefined;
        if (!row?.password_hash) return null;
        const ok = await bcrypt.compare(password, row.password_hash);
        if (!ok) return null;
        return { id: String(row.id), name: row.name || email, email: row.email, image: row.image || "" };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};

export function authConfigured(): boolean {
  return Boolean(
    (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) ||
      (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  );
}
