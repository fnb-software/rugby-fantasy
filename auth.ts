import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowed = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}
