import { SupabaseAdapter } from "@auth/supabase-adapter"; // ★ インポート
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
  // ★ ここからアダプターの設定
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  // ★ ここまで

  // callbacksは、セッションにユーザーIDを追加するためだけに残します。
  // signInコールバックはアダプターが処理するので削除します。
  callbacks: {
    async session({ session, user }) {
      // アダプターを使うと、userオブジェクトにIDが入ってきます
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
