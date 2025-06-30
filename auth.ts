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
      if (account?.provider !== "google" || !user.id) {
        return false;
      }

      console.log(
        "SIGNIN CALLBACK: Attempting to upsert user to 'auth.users'."
      );

      try {
        // ★★★ ここが最重要修正点 ★★★
        // SupabaseのRPC（Remote Procedure Call）を使って、
        // Supabaseが内部的に管理するauthスキーマのusersテーブルにデータを書き込む
        const { error } = await supabaseAdmin.from("users").upsert(
          {
            id: user.id, // Googleから来たID (stringだがuuid形式)
            raw_user_meta_data: {
              // auth.usersテーブルの構造に合わせる
              name: user.name,
              avatar_url: user.image,
            },
            raw_app_meta_data: {
              provider: "google",
            },
            email: user.email,
          },
          { onConflict: "id" }
        );

        if (error) {
          // 2回目以降のログインでは、emailのunique制約でエラーが出ることがあるが、
          // onConflictでidが一致すれば更新されるので、基本的には問題ないはず。
          // それ以外の予期せぬエラーの場合のみサインインを止める。
          console.error("Supabase upsert in signIn failed:", error);
          // 万が一に備え、email重複エラー(23505)は許容する
          if (error.code !== "23505") {
            return false;
          }
        }

        console.log("User successfully upserted into auth.users.");
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
