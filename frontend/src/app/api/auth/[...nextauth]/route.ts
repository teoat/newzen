import NextAuth, { type Session, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { type JWT } from "next-auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Zenith Forensic",
      credentials: {
        username: { label: "Investigator ID", type: "text", placeholder: "admin" },
        password: { label: "Access Key", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            body: new URLSearchParams({
              username: credentials?.username || "",
              password: credentials?.password || "",
            }),
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
          });

          const user = await res.json();

          if (res.ok && user) {
            return user;
          }
          return null;
        } catch {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.accessToken = user.access_token;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session && session.user) {
        session.accessToken = token.accessToken;
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
});

export { handler as GET, handler as POST };
