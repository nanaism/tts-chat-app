import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import WavEncoder from "wav-encoder";
// ★★★ 1. constants.ts からプロンプトをインポート ★★★
import { aiPrompt } from "./constant";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

// systemInstructionの代わりにインポートしたaiPromptを使用します
const systemInstruction = aiPrompt;

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
      model: "gemini-2.5-flash",
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

    // --- 2. 音声生成 (Gemini API TTS) ---

    // ★★★ 2. 音声のスタイルを指示するプロンプトを作成 ★★★
    // 'ニア'の性格に合わせて「優しく、穏やかなトーンで」という指示を追加します。
    const voiceStylePrompt = `優しく、穏やかなトーンで話してください：${textResponse}`;

    const ttsResponse = await genAI.models.generateContent({
      model: "gemini-2.5-pro-preview-tts",
      // ★★★ 3. スタイル指示付きのテキストを渡す ★★★
      contents: [{ parts: [{ text: voiceStylePrompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            // "Sulafat" は「温かい」声と説明されているので、キャラクターに合うかもしれません。
            prebuiltVoiceConfig: { voiceName: "Sulafat" },
          },
        },
      },
    });

    const audioBase64 =
      ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      throw new Error("Gemini APIから有効な音声データが返されませんでした。");
    }

    // --- WAV形式への変換処理 (前回と同じ) ---
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

    // --- 3. レスポンスを返す ---
    return NextResponse.json({
      textResponse: textResponse,
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
