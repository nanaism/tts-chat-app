import { FinishReason, GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import WavEncoder from "wav-encoder";
import { aiPrompt } from "./constants";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type HistoryMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

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

    const { data: historyFromDb, error: historyError } = await supabaseAdmin
      .from("conversations")
      .select("role, content")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (historyError) throw historyError;

    const formattedHistory: HistoryMessage[] = historyFromDb
      .reverse()
      .map((msg) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

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

    // --- テキストと感情を生成 ---
    const chatResult = await genAI.models.generateContent({
      model: textModel,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: {
              type: Type.STRING,
              description:
                "応答内容に最も合う感情をリストから一つだけ選んでください。",
            },
            responseText: {
              type: Type.STRING,
              description: "ユーザーへの応答メッセージ本文。",
            },
          },
          required: ["emotion", "responseText"],
        },
      },
    });

    let aiResponse: { emotion: string; responseText: string };

    // 1. まず、AIからの生の応答全体をログに出力してみる
    console.log(
      "Full chatResult from Gemini:",
      JSON.stringify(chatResult, null, 2)
    );

    // 2. セーフティフィルターが作動したかチェック
    if (chatResult.candidates?.[0]?.finishReason === FinishReason.SAFETY) {
      console.log("Safety filter triggered. Providing a safe response.");
      aiResponse = {
        emotion: "sad",
        responseText:
          "そっか、そんな気持ちなんだね。話してくれてありがとう。どんなことでも、あなたの味方だからね。",
      };
    } else {
      const rawResponse = chatResult.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawResponse) {
        throw new Error("AIから有効な応答を取得できませんでした。");
      }

      // 3. パースする前の生のJSON文字列もログに出力
      console.log("Raw JSON response from AI:", rawResponse);

      aiResponse = JSON.parse(rawResponse);
    }

    // 4. 最終的に採用された感情とテキストをログに出力
    console.log("Final emotion and responseText:", aiResponse);

    const { emotion, responseText } = aiResponse;
    if (!responseText || !emotion) {
      throw new Error("AIからの応答形式が正しくありません。");
    }

    await Promise.all([
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
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Zephyr" },
          },
        },
      },
    });

    const audioBase64 =
      ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      throw new Error("Gemini APIから有効な音声データが返されませんでした。");
    }

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
