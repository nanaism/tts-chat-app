// app/api/chat/route.ts

import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // --- ステップ1: テキスト生成 ---
    const chatResult = await genAI.models.generateContent({
      model: "gemini-1.5-flash-latest",
      contents: [{ role: "user", parts: [{ text: message }] }],
    });

    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // ここが、最後の、そして唯一の正しい修正点です
    // .text は関数ではなく、プロパティです。()は不要です。
    const textResponse = chatResult.text;
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★

    // AIからの返答が空である可能性も考慮し、エラーチェックを追加します
    if (!textResponse) {
      throw new Error("AIから有効なテキスト応答を取得できませんでした。");
    }

    // --- ステップ2: 音声合成 ---
    const ttsResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: "user", parts: [{ text: textResponse }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const audioData =
      ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      throw new Error("音声データの生成に失敗しました。");
    }

    return NextResponse.json({
      textResponse: textResponse,
      audioData: audioData,
    });
  } catch (error: unknown) {
    console.error("[API Error]:", error);
    let errorMessage = "不明なサーバーエラーが発生しました。";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      {
        error: "サーバーサイドでエラーが発生しました。",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
