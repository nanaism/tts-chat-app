import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth"; // ★ authをインポート

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // ★★★ ここからが修正点 ★★★
  const session = await auth(); // NextAuth.jsがリクエストから自動でセッションを解決するのを信じる
  console.log("Session in GET /api/children:", session); // デバッグ用ログ
  // ★★★ ここまで ★★★

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

export async function POST(req: NextRequest) {
  // ★★★ ここからが修正点 ★★★
  const session = await auth();
  console.log("Session in POST /api/children:", session); // デバッグ用ログ
  // ★★★ ここまで ★★★

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const teacherId = session.user.id;

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
      if (error.code === "23505") {
        // email重複エラーは無視
        // This case is handled in auth.ts, but as a fallback
      } else if (error.code === "23503") {
        return NextResponse.json(
          {
            error: "Failed to create child: Teacher not found in users table.",
          },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
