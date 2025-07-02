// middleware.ts の内容をこちらに置き換えてください

import { auth } from "@/auth";

export default auth((req) => {
  // `req.auth` にはセッション情報が格納されます。
  // セッション情報の中に `user` オブジェクトが存在しない場合（つまり未ログインの場合）で、
  // かつ、アクセス先が `/admin` で始まるパスの場合に、if文の中の処理を実行します。
  if (!req.auth?.user && req.nextUrl.pathname.startsWith("/admin")) {
    // Auth.jsが提供する汎用のサインインページへのURLを生成します。
    const loginUrl = new URL("/api/auth/signin", req.nextUrl.origin);

    // パラメータとして、ログイン成功後に戻ってきたいURL（元々アクセスしようとしたURL）を
    // `callbackUrl` として設定します。
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.href);

    // ユーザーを生成したサインインページのURLにリダイレクトさせます。
    return Response.redirect(loginUrl);
  }

  // それ以外の場合（認証済み、または/admin以外のページへのアクセス）は、
  // 何もせずリクエストを続行します。
  return;
});

// このミドルウェアを適用するパスを指定します。
export const config = {
  matcher: ["/admin/:path*"],
};
