import { FinishReason, GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import WavEncoder from "wav-encoder";
import { createAiPrompt } from "./constants";
import { summarizeConversation } from "./summarize";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
type HistoryMessage = { role: "user" | "model"; parts: { text: string }[] };

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      mode,
      childId,
    }: {
      message: string;
      mode: "fast" | "slow";
      childId: string;
    } = await req.json();

    if (!message || !childId) {
      return NextResponse.json(
        { error: "メッセージと子供IDは必須です。" },
        { status: 400 }
      );
    }

    // 会話の総数を取得
    const { count, error: countError } = await supabaseAdmin
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("child_id", childId);

    if (countError) throw countError;

    // 会話の往復が18回 (36メッセージ) ごとに要約を実行
    if ((count ?? 0) > 0 && (count ?? 0) % 36 === 0) {
      summarizeConversation(childId);
      console.log(
        `Conversation count is ${count}, triggering summarization for child ${childId}`
      );
    }

    // 長期記憶(サマリー)と短期記憶(会話履歴)を並行して取得
    const [summaryResult, historyResult] = await Promise.all([
      supabaseAdmin
        .from("child_summaries")
        .select("summary")
        .eq("child_id", childId)
        .single(),
      supabaseAdmin
        .from("conversations")
        .select("role, content")
        .eq("child_id", childId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (historyResult.error) throw historyResult.error;

    const summary = summaryResult.data?.summary ?? null;
    const formattedHistory: HistoryMessage[] = (historyResult.data || [])
      .reverse()
      .map((msg) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    const aiPrompt = createAiPrompt(summary);
    const contents = [
      ...formattedHistory,
      { role: "user", parts: [{ text: aiPrompt + "\n\n" + message }] },
    ];

    const isFastMode = mode === "fast";
    const textModel = isFastMode
      ? "gemini-2.5-flash-lite-preview-06-17"
      : "gemini-2.5-flash";
    const ttsModel = isFastMode
      ? "gemini-2.5-flash-preview-tts"
      : "gemini-2.5-pro-preview-tts";

    const chatResult = await genAI.models.generateContent({
      model: textModel,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING },
            responseText: { type: Type.STRING },
          },
          required: ["emotion", "responseText"],
        },
      },
    });

    let aiResponse: { emotion: string; responseText: string };

    if (chatResult.candidates?.[0]?.finishReason === FinishReason.SAFETY) {
      aiResponse = {
        emotion: "sad",
        responseText:
          "そっか、そんな気持ちなんだね。話してくれてありがとう。どんなことでも、あなたの味方だからね。",
      };
    } else {
      const rawResponse = chatResult.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawResponse)
        throw new Error("AIから有効な応答を取得できませんでした。");
      aiResponse = JSON.parse(rawResponse);
    }

    const { emotion, responseText } = aiResponse;
    if (!responseText || !emotion) {
      throw new Error("AIからの応答形式が正しくありません。");
    }

    Promise.all([
      supabaseAdmin
        .from("conversations")
        .insert({ child_id: childId, role: "user", content: message }),
      supabaseAdmin
        .from("conversations")
        .insert({
          child_id: childId,
          role: "ai",
          content: responseText,
          emotion: emotion,
        }),
    ]).catch((dbError) =>
      console.error("DB insert failed but continuing:", dbError)
    );

    const ttsResponse = await genAI.models.generateContent({
      model: ttsModel,
      contents: [{ parts: [{ text: responseText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
      },
    });

    const audioBase64 =
      ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64)
      throw new Error("Gemini APIから有効な音声データが返されませんでした。");

    const sampleRate = 24000;
    const pcmData = Buffer.from(audioBase64, "base64");
    const pcm_i16 = new Int16Array(
      pcmData.buffer,
      pcmData.byteOffset,
      pcmData.length / Int16Array.BYTES_PER_ELEMENT
    );
    const pcm_f32 = new Float32Array(pcm_i16.length);
    for (let i = 0; i < pcm_i16.length; i++) {
      pcm_f32[i] = pcm_i16[i] / 32768.0;
    }
    const wavData = await WavEncoder.encode({
      sampleRate: sampleRate,
      channelData: [pcm_f32],
    });
    const wavBase64 = Buffer.from(wavData).toString("base64");

    return NextResponse.json({
      emotion: emotion,
      textResponse: responseText,
      audioData: wavBase64,
    });
  } catch (error: unknown) {
    console.error("APIルートでエラーが発生しました:", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラーが発生しました。";
    return NextResponse.json(
      { error: { message: errorMessage } },
      { status: 500 }
    );
  }
}
