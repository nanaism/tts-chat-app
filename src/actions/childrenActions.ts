"use server"; // このファイル内の関数は全てサーバーサイドで実行される

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 新しい子供を追加するサーバーアクション
export async function addChild(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const teacherId = session.user.id;

  const nickname = formData.get("nickname") as string;
  if (!nickname || nickname.trim().length === 0) {
    return { error: "Nickname is required" };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("children")
      .insert({
        nickname: nickname.trim(),
        managed_by_user_id: teacherId,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error in server action:", error);
      return { error: `Database error: ${error.message}` };
    }

    // 重要：ダッシュボードページを再検証して、新しいデータを反映させる
    revalidatePath("/admin/dashboard");
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error in addChild action:", error);
    return { error: "An unexpected error occurred." };
  }
}
