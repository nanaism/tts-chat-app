import { ChildrenDashboard } from "@/components/features/admin/ChildrenDashboard"; // 新しいコンポーネント
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";

// サーバーサイドでのみ使用するSupabaseクライアント
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getChildrenForTeacher(teacherId: string) {
  const { data, error } = await supabaseAdmin
    .from("children")
    .select("id, nickname, created_at")
    .eq("managed_by_user_id", teacherId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch children on server:", error);
    return []; // エラーの場合は空の配列を返す
  }
  return data;
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // サーバーサイドで子供のリストを事前に取得
  const initialChildren = await getChildrenForTeacher(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">
          ようこそ、{session.user.name}さん
        </h2>
        <p className="text-gray-600">管理する子供を追加・確認できます。</p>
      </div>

      {/* インタラクティブな部分はクライアントコンポーネントに任せる */}
      <ChildrenDashboard initialChildren={initialChildren} />
    </div>
  );
}
