import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// このAPIルート専用の、全権限を持つSupabaseクライアントを作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // URLから child_id を取得 (例: /api/conversations?childId=xxx)
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("childId");

  if (!childId) {
    return NextResponse.json(
      { error: "Child ID is required" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .select("id, role, content, emotion, created_at")
      .eq("child_id", childId)
      .order("created_at", { ascending: true }); // 古い順に並べる

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // URLから child_id を取得
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("childId");

  if (!childId) {
    return NextResponse.json(
      { error: "Child ID is required" },
      { status: 400 }
    );
  }

  try {
    // eq = equal (等しい)
    // 指定されたchild_idに一致するすべての行を削除する
    const { error } = await supabaseAdmin
      .from("conversations")
      .delete()
      .eq("child_id", childId);

    if (error) {
      throw error;
    }

    // 成功したら、成功メッセージを返す
    return NextResponse.json({ message: "History reset successfully" });
  } catch (error) {
    console.error("Failed to reset conversations:", error);
    return NextResponse.json(
      { error: "Database query failed" },
      { status: 500 }
    );
  }
}
