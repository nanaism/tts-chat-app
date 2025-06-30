import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

// このAPIルート専用の、全権限を持つSupabaseクライアントを作成
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const teacherId = session.user.id;

  // ★ try-catchブロックを修正
  try {
    const { nickname } = await req.json();
    if (
      !nickname ||
      typeof nickname !== "string" ||
      nickname.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Nickname is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("children")
      .insert({
        nickname: nickname.trim(),
        managed_by_user_id: teacherId,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error details:", error);
      if (error.code === "23503") {
        return NextResponse.json(
          {
            error: "Failed to create child: Teacher not found in users table.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    // ★ anyをunknownに修正
    console.error("API Route Error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  // ★ reqを削除
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const teacherId = session.user.id;

  try {
    const { data, error } = await supabaseAdmin
      .from("children")
      .select("id, nickname, created_at")
      .eq("managed_by_user_id", teacherId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase select error:", error);
      throw new Error(error.message);
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    // ★ anyをunknownに
    console.error("API Error:", error);
    // ★ エラーがErrorインスタンスか確認
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch children: ${errorMessage}` },
      { status: 500 }
    );
  }
}
