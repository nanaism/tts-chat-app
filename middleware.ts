import { auth } from "./auth"; // プロジェクトルートのauth.tsを参照

export default auth((req) => {
  // req.auth にユーザーセッション情報が含まれる
  // ログインしていない状態で /admin にアクセスした場合、ログインページにリダイレクトされる
  if (!req.auth && req.nextUrl.pathname.startsWith("/admin")) {
    const newUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

// middlewareを適用するパスを指定
export const config = {
  matcher: ["/admin/:path*"],
};
