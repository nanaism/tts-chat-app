import { SupabaseAdapter } from "@auth/supabase-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  // セッション戦略はアダプター利用の標準である 'database' を指定
  session: {
    strategy: "database",
  },
  // callbacks ブロックを一旦すべて削除して、アダプターのデフォルト動作に任せる
});
