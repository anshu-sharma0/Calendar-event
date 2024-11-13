import NextAuth from "next-auth";
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";

// Augment NextAuth types to include accessToken in the session and JWT
declare module "next-auth" {
  interface Session {
    accessToken: string; // Add the accessToken property to the session
  }

  interface JWT {
    accessToken?: string; // Add the accessToken property to the JWT
  }
}
