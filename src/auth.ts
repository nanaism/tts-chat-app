import { createClient } from "@supabase/supabase-js";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { v4 as uuidv4 } from "uuid"; // ★ uuidライブラリをインポート

// Supabaseの管理者権限クライアントを初期化
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
    // 1. 保護者（管理者）用のGoogleログインプロバイダー
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),

    // 2. 子供用のQRコードログインプロバイダー（ここは変更なし）
    Credentials({
      id: "qr-login",
      name: "QR Login",
      credentials: {
        childId: { type: "text" },
      },
      async authorize(credentials) {
        if (typeof credentials.childId !== "string") {
          return null;
        }
        try {
          const { data: child, error } = await supabaseAdmin
            .from("children")
            .select("id, nickname")
            .eq("id", credentials.childId)
            .single();

          if (error || !child) {
            console.error("QR Login Auth Error:", error);
            return null;
          }

          return {
            id: child.id,
            name: child.nickname,
          };
        } catch (e) {
          console.error("QR Login Authorize function threw an error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // ★★★ ここからがID管理を修正した新しいコールバックです ★★★

    async signIn({ user, account }) {
      // Googleプロバイダーでのログインの場合のみ、DBと連携処理を行う
      if (account?.provider === "google") {
        if (!user.email) {
          console.error("Google account does not have an email.");
          return false; // emailがなければログイン失敗
        }

        try {
          // 1. Emailを元に、Supabaseの`users`テーブルからユーザーを検索
          const { data: existingUser, error: selectError } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", user.email)
            .single();

          // 2. ユーザーが既にDBに存在する場合
          if (existingUser) {
            // 既存のDBのUUIDを`user`オブジェクトの`id`に設定する
            // これが後続のjwtコールバックに渡される
            user.id = existingUser.id;
          }
          // 3. ユーザーがDBに存在しない場合
          else if (selectError && selectError.code === "PGRST116") {
            // PGRST116は.single()で行が見つからなかった時の正常なエラー
            const newUserId = uuidv4(); // 新しいUUIDを生成
            const { error: insertError } = await supabaseAdmin
              .from("users")
              .insert({
                id: newUserId, // 生成したUUID
                email: user.email,
                name: user.name,
                avatar_url: user.image,
              });

            if (insertError) {
              console.error("Failed to insert new user:", insertError);
              return false; // DBへの挿入失敗時はログインを中止
            }
            // 新しく作成したUUIDを`user`オブジェクトの`id`に設定する
            user.id = newUserId;
          }
          // 4. その他のDBエラーが発生した場合
          else if (selectError) {
            console.error("Error selecting user:", selectError);
            return false;
          }
        } catch (error) {
          console.error("Unexpected error during signIn callback:", error);
          return false;
        }
      }
      // 全ての処理が成功したか、Google以外のプロバイダーならログインを許可
      return true;
    },

    async jwt({ token, user }) {
      // `signIn`で`user.id`に設定したDBのUUIDを、tokenの`sub`（subject）に格納する
      // これにより、token内にアプリケーションで一貫して使えるIDが保持される
      if (user) {
        token.sub = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      // `jwt`コールバックで`token.sub`に格納したDBのUUIDを、
      // `session.user.id`に設定する
      // これにより、サーバーコンポーネントやクライアントコンポーネントの `auth()` や `useSession()` で
      // `session.user.id` としてDBのUUIDが取得できるようになる
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },

    // ★★★ ここまでが新しいコールバック ★★★
  },
  session: {
    strategy: "jwt",
  },
});
