import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      role?: string;
      username?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    access_token?: string;
    role?: string;
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    role?: string;
    username?: string;
    id?: string;
  }
}
