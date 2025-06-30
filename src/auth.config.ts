// 'type' をつけて名前付きインポートに戻します
import type { NextAuthConfig, Session, User } from "next-auth";
import Google from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    // ↓ コールバックの引数に、インポートした型を直接指定します
    async session({ session, user }: { session: Session; user: User }) {
      // これで session と user が正しく型付けされます
      session.user.id = user.id;
      return session;
    },
  },
  session: {
    strategy: "database",
  },
} satisfies NextAuthConfig;