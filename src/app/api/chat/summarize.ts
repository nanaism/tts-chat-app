import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createSummaryPrompt } from "./constants";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
const summaryModel = "gemini-1.5-flash";

// 要約を実行する関数 (非同期で呼び出される)
export async function summarizeConversation(childId: string) {
  try {
    console.log(`Starting summarization for child: ${childId}`);

    const { data: conversations, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("role, content")
      .eq("child_id", childId)
      .order("created_at", { ascending: true })
      .limit(500);

    if (convError || !conversations || conversations.length < 10) {
      console.log("Not enough conversations to summarize.");
      return;
    }

    const conversationText = conversations
      .map((c) => `${c.role === "user" ? "子ども" : "ニア"}: ${c.content}`)
      .join("\n");

    const prompt = createSummaryPrompt(conversationText);
    const result = await genAI.models.generateContent({
      model: summaryModel,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // ★★★ ここからが修正箇所 (This is the fix) ★★★
    // 明示的で安全な型ガード
    let summary = "";
    const firstCandidate = result.candidates?.[0];

    if (
      firstCandidate &&
      firstCandidate.content &&
      Array.isArray(firstCandidate.content.parts) &&
      firstCandidate.content.parts.length > 0 &&
      firstCandidate.content.parts[0].text
    ) {
      // すべてのプロパティが存在することをチェックしてから代入
      summary = firstCandidate.content.parts[0].text;
    }
    // ★★★ ここまで ★★★

    if (summary.trim().length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from("child_summaries")
        .upsert(
          {
            child_id: childId,
            summary: summary,
            last_updated: new Date().toISOString(),
          },
          { onConflict: "child_id" }
        );

      if (upsertError) {
        console.error(
          `[Summarize] Failed to upsert for child ${childId}:`,
          upsertError
        );
      } else {
        console.log(`[Summarize] Summary updated for child: ${childId}`);
      }
    } else {
      console.warn(
        `[Summarize] Generated summary was empty for child ${childId}.`
      );
    }
  } catch (error) {
    console.error(`[Summarize] An error occurred for child ${childId}:`, error);
  }
}
