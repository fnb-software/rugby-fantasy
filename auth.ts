import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const parseEmails = (raw: string | undefined): string[] =>
  (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const allowed = parseEmails(process.env.ALLOWED_EMAILS);
const admins = parseEmails(process.env.ADMIN_EMAILS);

export type Role = "admin" | "user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async signIn({ user }) {
      if (allowed.length === 0) return true;
      const email = user.email?.toLowerCase();
      return !!email && allowed.includes(email);
    },
    async jwt({ token, account, profile }) {
      if (account && profile && "sub" in profile && profile.sub) {
        token.userId = profile.sub as string;
      }
      if (account && profile && typeof profile.email === "string") {
        token.role = admins.includes(profile.email.toLowerCase())
          ? "admin"
          : "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      if (session.user) {
        session.user.role = (token.role as Role | undefined) ?? "user";
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: Role;
  }
}
