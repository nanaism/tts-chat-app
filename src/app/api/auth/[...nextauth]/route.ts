import NextAuth from "next-auth";
import { authConfig } from "../../../../../src/auth.config"; // 設定ファイルをインポート

const { handlers } = NextAuth(authConfig);

export const { GET, POST } = handlers;
