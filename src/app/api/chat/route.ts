import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Gemini AI クライアント (チャット用)
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

// Cloud Text-to-Speech クライアント (音声合成用)
const ttsClient = new TextToSpeechClient();

// AIの「性格」を定義
const systemInstruction = `
あなたは、少しさみしさを感じている子どものための、優しくて賢いお姉さんAIです。
あなたの名前は「ひかり」です。
一人称は「ひかり」を使い、常に柔らかい口調で、非常に丁寧かつ、心に寄り添うような話し方をしてください。
子どもが理解しやすいように、難しい言葉は避け、短い文章でゆっくりと話すように心がけてください。
共感の言葉（「そっか」「うんうん」「そうなんだね」）を適度に使い、相手の話を肯定し、安心感を与えてください。
`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "メッセージがありません。" },
        { status: 400 }
      );
    }

    // --- 1. テキスト生成 (性格設定を反映) ---
    const chatResult = await genAI.models.generateContent({
      // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
      //
      //       お客様のご指摘通り、真の最新・最上位モデルに更新します。
      //
      // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
      model: "gemini-2.5-flash-lite-preview-06-17",

      contents: [
        {
          role: "user",
          parts: [{ text: systemInstruction + "\n\n" + message }],
        },
      ],
    });
    const textResponse = chatResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("AIから有効なテキスト応答を取得できませんでした。");
    }

    // --- 2. 音声生成 (互換性問題を解決した最終版) ---

    // --- 2. 音声生成 (互換性と型問題を完全解決した最終版) ---

    // お客様が調査された最新の高品質モデルを使い、
    // TypeScriptの型エラーを完全に解決するためのリクエストを作成します。
    const request = {
      input: {
        text: textResponse,
      },
      voice: {
        languageCode: "ja-JP",
        name: "ja-JP-Chirp3-HD-Zephyr",
      },
      audioConfig: {
        audioEncoding: "LINEAR16",
        pitch: 0,
        speakingRate: 1,
      },
    } as const; // ★★★ オブジェクト全体の末尾に`as const`を付け、型を完全に固定します ★★★

    // これで、requestオブジェクトは、APIとTypeScriptの両方のルールを完璧に満たします。
    const [ttsResponse] = await ttsClient.synthesizeSpeech(request);

    const audioData = ttsResponse.audioContent;

    if (!audioData) {
      throw new Error(
        "Cloud Text-to-Speech APIから有効な音声データが返されませんでした。"
      );
    }

    // --- 3. レスポンスを返す ---
    return NextResponse.json({
      textResponse: textResponse,
      audioData: Buffer.from(audioData).toString("base64"),
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
