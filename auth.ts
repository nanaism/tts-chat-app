import { SupabaseAdapter } from "@auth/supabase-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// --- ▼▼▼ デバッグコード ▼▼▼ ---
// Vercelのランタイムログで、これらの値が正しく表示されるか確認する
console.log("--- Auth.ts Loading ---");
console.log(
  "Supabase URL Loaded:",
  process.env.NEXT_PUBLIC_SUPABASE_URL ? "Yes" : "No"
);
console.log(
  "Supabase Service Key Loaded:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "Yes" : "No"
);
console.log("Google ID Loaded:", process.env.AUTH_GOOGLE_ID ? "Yes" : "No");
// --- ▲▲▲ デバッグコード ▲▲▲ ---

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

  // --- ▼▼▼ 【重要】一時的に 'database' 戦略に変更して切り分け ▼▼▼ ---
  session: {
    strategy: "database", // "jwt" から "database" に変更
  },
  // --- ▲▲▲ ---

  callbacks: {
    // 'database' 戦略では、sessionコールバックの第二引数は `user` オブジェクト
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id; // user.idをセッションに追加
      }
      return session;
    },
  },
});
