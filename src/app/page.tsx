// src/app/page.tsx (新しい内容)

import { auth } from "@/auth";
import { TopLevelClientPage } from "@/components/TopLevelClientPage";

// サーバーコンポーネントとしてセッション情報を取得
export default async function TopPage() {
  const session = await auth();

  // セッション情報をクライアントコンポーネントに渡して、UIの出し分けを任せる
  return <TopLevelClientPage session={session} />;
}
