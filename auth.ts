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
        // "users"ではなく"profiles"テーブルを操作する
        const { error } = await supabaseAdmin.from("profiles").upsert(
          {
            id: user.id, // GoogleのIDをSupabaseのauth.users.idとして使う
            name: user.name,
            email: user.email,
            avatar_url: user.image,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" } // 主キー(id)が競合した場合は更新
        );

        if (error) {
          console.error("Supabase upsert failed in signIn:", error);
          return false; // エラーがあればサインインを中止
        }

        return true; // 成功したらサインインを許可
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
