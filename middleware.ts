import { NextResponse } from "next/server";
import { auth } from "./auth";

export default auth((req) => {
  // req.auth にユーザーセッション情報が含まれる
  // 未認証の状態で /admin で始まるパスにアクセスした場合
  if (!req.auth && req.nextUrl.pathname.startsWith("/admin")) {
    // サインイン後のリダイレクト先をcallbackUrlとして指定
    const loginUrl = new URL("/api/auth/signin/google", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);

    // Googleのサインインページに直接リダイレクトする
    return NextResponse.redirect(loginUrl);
  }

  // 認証済みの場合、または/admin以外のパスへのアクセスは、何もしない
  return NextResponse.next();
});

// middlewareを適用するパスを指定
export const config = {
  matcher: ["/admin/:path*"],
};
