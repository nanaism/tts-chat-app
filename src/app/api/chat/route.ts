import { GoogleGenAI, Type } from "@google/genai"; // ★★★ Type をインポート ★★★
import { NextRequest, NextResponse } from "next/server";
import WavEncoder from "wav-encoder";
import { aiPrompt } from "./constant"; // プロンプトも少し変更します

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "メッセージがありません。" },
        { status: 400 }
      );
    }

    // --- 1. テキストと感情を生成 (Chat with Structured Output) ---
    const chatResult = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: aiPrompt + "\n\n" + message }],
        },
      ],
      // ★★★ 構造化出力を定義 ★★★
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

    // APIからの応答は、スキーマに基づいて構造化されたテキストになっています
    const rawResponse = chatResult.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawResponse) {
      throw new Error("AIから有効な応答を取得できませんでした。");
    }

    // JSONテキストをパースしてオブジェクトとして利用
    const aiResponse = JSON.parse(rawResponse);
    const { emotion, responseText } = aiResponse;

    if (!responseText || !emotion) {
      throw new Error("AIからの応答形式が正しくありません。");
    }

    // --- 2. 音声生成 (Gemini API TTS) ---
    // (この部分のロジックに変更はありません)
    const ttsResponse = await genAI.models.generateContent({
      model: "gemini-2.5-pro-preview-tts",
      contents: [{ parts: [{ text: responseText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            // "Sulafat" は「温かい」声と説明されているので、キャラクターに合うかもしれません。
            // prebuiltVoiceConfig: { voiceName: "Zephyr" },
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

    // --- WAV形式への変換処理 (変更なし) ---
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
