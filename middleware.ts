import NextAuth from "next-auth";
// ↓ src/auth.ts ではなく、src/auth.config.ts を直接インポート
import { authConfig } from "./src/auth.config";

// ↓ NextAuth と authConfig からミドルウェア用の auth 関数を生成
export default NextAuth(authConfig).auth;

// configオブジェクトはそのまま残します
export const config = {
  matcher: ["/admin/:path*"],
};
