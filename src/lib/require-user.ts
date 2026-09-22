import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type AuthedUser = { name: string; image: string; email: string };

export async function requireUser(): Promise<{ user: AuthedUser } | { error: Response }> {
  const session = await getServerSession(authOptions);
  const u = session?.user as { name?: string; image?: string; email?: string } | undefined;
  if (!u?.email) {
    return {
      error: Response.json({ ok: false, error: "Sign in to make changes." }, { status: 401 }),
    };
  }
  return { user: { name: u.name || u.email, image: u.image || "", email: u.email } };
}
