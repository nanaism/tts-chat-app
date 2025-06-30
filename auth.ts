import { createClient } from "@supabase/supabase-js";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

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
  // ★★★★★ ここからが最重要修正点 ★★★★★
  callbacks: {
    async signIn({ user, account }) {
      // Googleでのサインインの場合のみ処理を実行
      if (account?.provider === "google" && user.id) {
        console.log(
          "SIGNIN CALLBACK: Google sign-in detected for user:",
          user.email
        );
        try {
          const { error } = await supabaseAdmin.from("users").upsert(
            {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            },
            { onConflict: "id" }
          );

          if (error) {
            console.error("Supabase upsert error on signIn:", error);
            return false; // DBエラー時はサインインを失敗させる
          }

          console.log("User successfully upserted to DB.");
          return true; // サインインを許可
        } catch (err) {
          console.error("Unexpected error during signIn upsert:", err);
          return false; // 予期せぬエラーでもサインインを失敗させる
        }
      }
      return false; // Google以外のサインインは許可しない
    },
    async session({ session, token }) {
      // token.sub にはプロバイダーのユーザーIDが入っている
      // これをセッションのIDとして設定し、アプリ全体で利用する
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    // jwtコールバックはDB書き込みの責務を負わない
    async jwt({ token }) {
      return token;
    },
  },
  // ★★★★★ ここまで ★★★★★
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/api/auth/signin",
  },
});
