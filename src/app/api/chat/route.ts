import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import WavEncoder from "wav-encoder";
import { aiPrompt } from "./constant";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

// ★ 追加: フロントエンドから渡されるメッセージの型を定義
type FrontendMessage = {
  role: "user" | "ai";
  text: string;
};

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      history,
      mode,
    }: {
      message: string;
      history: FrontendMessage[]; // ★ 変更: 型を適用
      mode: "fast" | "slow";
    } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "メッセージがありません。" },
        { status: 400 }
      );
    }

    const isFastMode = mode === "fast";
    const textModel = isFastMode
      ? "gemini-2.5-flash-lite-preview-06-17"
      : "gemini-2.5-flash";
    const ttsModel = isFastMode
      ? "gemini-2.5-flash-preview-tts"
      : "gemini-2.5-pro-preview-tts";

    // --- ★ 変更点: ここから ---
    // 1. 過去の会話履歴をGemini APIの形式に変換します。
    // 'ai' ロールを 'model' にマッピングすることが重要です。
    const formattedHistory = history.map((msg) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    // 2. AIに渡す全会話コンテンツを構築します。
    // プロンプトを先頭に、過去の履歴、そして最新のユーザーメッセージを結合します。
    const contents = [
      ...formattedHistory,
      {
        role: "user",
        parts: [{ text: aiPrompt + "\n\n" + message }],
      },
    ];
    // --- ★ 変更点: ここまで ---

    // --- テキストと感情を生成 ---
    const chatResult = await genAI.models.generateContent({
      model: textModel,
      contents: contents, // ★ 変更点: 構築した全会話履歴を使用
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: {
              type: Type.STRING,
              description: "応答内容に最も合う感情をリストから選択したもの。",
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

    const rawResponse = chatResult.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawResponse) {
      throw new Error("AIから有効な応答を取得できませんでした。");
    }

    const aiResponse = JSON.parse(rawResponse);
    const { emotion, responseText } = aiResponse;

    if (!responseText || !emotion) {
      throw new Error("AIからの応答形式が正しくありません。");
    }

    // --- 音声生成 ---
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

    // --- WAV形式への変換処理 ---
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

    // --- レスポンスを返す ---
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
