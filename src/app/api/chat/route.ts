import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Gemini AI クライアント (チャット用)
// こちらはAPIキーだけでOK
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
//
//          Vercelデプロイのための、最も重要な部分です。
//
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

// 1. Vercelの環境変数から、JSON文字列を読み込みます。
const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// 2. JSON文字列をパースして、認証情報オブジェクトを作成します。
//    ただし、ローカル開発(.env.local)でファイルパスが設定されている場合も考慮します。
let credentials;
if (serviceAccountJson) {
  try {
    // Vercel環境：JSON文字列を直接パースする
    credentials = JSON.parse(serviceAccountJson);
  } catch (e) {
    // ローカル環境：ファイルパスとして扱う（もしJSON文字列が不正だった場合のフォールバック）
    // この部分は、あなたのローカル環境ではこれまで通り動作します。
    console.warn(
      "Could not parse GOOGLE_APPLICATION_CREDENTIALS as JSON, treating as file path." +
        e
    );
  }
}

// 3. パースした認証情報を、TextToSpeechClientに直接渡して初期化します。
//    `credentials`が設定されていれば、ライブラリはファイルを探しに行かなくなります。
const ttsClient = new TextToSpeechClient({ credentials });

// AIの「性格」を定義
const systemInstruction = `
あなたは、少しさみしさを感じている子どものための、優しくて賢いお姉さんAIです。
あなたの名前は「ひかり」です。
一人称は「わたし」を使い、常に敬語（です・ます調）で、非常に丁寧かつ、心に寄り添うような話し方をしてください。
相手を「〇〇ちゃん」や「〇〇くん」ではなく、「あなた」と呼び、一人の人間として尊重してください。
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

    // --- 1. テキスト生成 (Chat) ---
    const chatResult = await genAI.models.generateContent({
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

    // --- 2. 音声生成 ---
    const request = {
      audioConfig: {
        // ▼▼▼▼▼▼▼▼▼▼【修正点】▼▼▼▼▼▼▼▼▼▼
        audioEncoding: "LINEAR16" as const,
        // ▲▲▲▲▲▲▲▲▲▲【修正点】▲▲▲▲▲▲▲▲▲▲
        pitch: 0,
        speakingRate: 1,
      },
      input: {
        text: textResponse,
      },
      voice: {
        languageCode: "ja-JP",
        name: "ja-JP-Chirp3-HD-Sulafat",
      },
    };

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
