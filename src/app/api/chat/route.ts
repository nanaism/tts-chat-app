import { NextRequest, NextResponse } from "next/server";
// これまで使っていた @google/genai は、TTS部分ではもう使いません
import { GoogleGenAI } from "@google/genai";
// ★★★ 新しくインストールした、専用のTTSクライアントをインポートします ★★★
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

// Gemini AI クライアント (チャット用)
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

// ★★★ Cloud Text-to-Speech クライアント (音声合成用) ★★★
// こちらは、裏側で認証情報（GOOGLE_APPLICATION_CREDENTIALS）を自動で読み込みます。
const ttsClient = new TextToSpeechClient();

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "メッセージがありません。" },
        { status: 400 }
      );
    }

    // --- 1. テキスト生成 (Chat) ---
    // この部分はこれまで通り、Geminiを使います。
    const chatResult = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite-preview-06-17",
      contents: [{ role: "user", parts: [{ text: message }] }],
    });
    const textResponse = chatResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("AIから有効なテキスト応答を取得できませんでした。");
    }

    // --- 2. 音声生成 (専用APIを使用) ---

    // ★★★ これが、業界標準の、正しい音声合成リクエストです ★★★
    const request = {
      input: { text: textResponse },
      // 日本語の女性の声を指定
      voice: { languageCode: "ja-JP", ssmlGender: "FEMALE" as const },
      // 音声のエンコーディング形式をMP3に指定
      audioConfig: { audioEncoding: "MP3" as const },
    };

    // ★★★ 専用クライアントで、音声合成を実行します ★★★
    const [ttsResponse] = await ttsClient.synthesizeSpeech(request);

    // audioContentには、Base64エンコードされた音声データが直接入っています。
    const audioData = ttsResponse.audioContent;

    if (!audioData) {
      throw new Error(
        "Cloud Text-to-Speech APIから有効な音声データが返されませんでした。"
      );
    }

    // --- 3. レスポンスを返す ---
    return NextResponse.json({
      textResponse: textResponse,
      // Bufferかもしれないので、確実にBase64文字列に変換して返します。
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
