import NextAuth from "next-auth";
import { authConfig } from "./auth.config"; // 設定ファイルをインポート

export const {
  auth,
  signIn,
  signOut,
  // handlers はここではエクスポートしない！
} = NextAuth(authConfig);
