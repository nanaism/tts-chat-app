import { createClient } from "@supabase/supabase-js";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Supabaseのクライアントを定義
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  // adapterは使いません

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.id || !user.email) {
        return false;
      }

      console.log(
        "SIGNIN CALLBACK: Attempting to upsert user to 'public.users'."
      );

      try {
        // ★★★ ここが最重要修正点 ★★★
        // publicスキーマのusersテーブルにデータを書き込む。
        // テーブルのカラム構成に合わせてデータを整形する。
        const { error } = await supabaseAdmin
          .from("users") // デフォルトでpublicスキーマを参照
          .upsert(
            {
              id: user.id, // GoogleのIDを主キーとして使用
              name: user.name,
              email: user.email,
              avatar_url: user.image, // カラム名が 'avatar_url' の場合
              // provider: account.provider, // 必要であればプロバイダー情報も保存
            },
            {
              onConflict: "id", // 'id' カラムがコンフリクトした場合に上書きする
            }
          );

        if (error) {
          console.error("Supabase upsert in signIn failed:", error);
          return false; // upsertでエラーが発生した場合はサインインを失敗させる
        }

        console.log("User successfully upserted into public.users.");
        return true; // サインインを許可
      } catch (err) {
        console.error("Unexpected error during signIn upsert:", err);
        return false;
      }
    },
    async session({ session, token }) {
      // token.subには、Googleから来たユーザーID(UUID形式の文字列)が入っている
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
  session: {
    strategy: "jwt", // 手動連携なので、セッションはJWT方式
  },
});
