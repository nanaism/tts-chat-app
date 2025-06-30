import { Button } from "@/components/ui/button"; // shadcn/uiのButtonを再利用
import { auth, signIn, signOut } from "../../auth";

export async function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/admin/dashboard" });
      }}
    >
      <Button type="submit">Googleでログイン</Button>
    </form>
  );
}

export async function SignOut() {
  const session = await auth(); // サーバーサイドでセッション情報を取得
  if (!session?.user) return null; // 未ログイン時は何も表示しない

  return (
    <div className="flex items-center gap-4">
      <p className="text-sm text-gray-600">{session.user.email}</p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button type="submit" variant="outline">
          ログアウト
        </Button>
      </form>
    </div>
  );
}
