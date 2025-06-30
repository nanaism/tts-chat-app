"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { QrReader } from "react-qr-reader";

const CHILD_ID_STORAGE_KEY = "near-child-id";

// ★ onResultのresultの型を定義
interface QrScanResult {
  getText: () => string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = useCallback(
    (childId: string) => {
      try {
        localStorage.setItem(CHILD_ID_STORAGE_KEY, childId);
        console.log(`Child ID: ${childId} saved to localStorage.`);
        router.push("/");
      } catch (error) {
        console.error("Failed to save to localStorage", error);
        setErrorMessage(
          "ログイン情報の保存に失敗しました。ブラウザの設定を確認してください。"
        );
      }
    },
    [router]
  );

  useEffect(() => {
    const childIdFromQuery = searchParams.get("child_id");
    if (childIdFromQuery) {
      console.log("Direct access with child_id:", childIdFromQuery);
      handleLogin(childIdFromQuery);
    }
  }, [searchParams, handleLogin]);

  return (
    <main className="w-full h-[100dvh] flex flex-col justify-center items-center bg-gray-100 p-4 text-center">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            QRコードでログイン
          </h1>
          <p className="text-gray-600 mt-2">
            先生からもらったQRコードを、四角いワクの中にうつしてね。
          </p>
        </div>
        <div className="w-full max-w-xs mx-auto aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
          <QrReader
            // ★★★ ここからが最重要修正点 ★★★
            onResult={(
              result: QrScanResult | null | undefined,
              error: unknown
            ) => {
              // ★★★ ここまで ★★★
              if (result) {
                const url = result.getText();
                try {
                  const urlObject = new URL(url);
                  const childId = urlObject.searchParams.get("child_id");
                  if (childId) {
                    setErrorMessage(null);
                    handleLogin(childId);
                  } else {
                    setErrorMessage("このQRコードはログイン用ではありません。");
                  }
                } catch {
                  setErrorMessage("無効なQRコードです。");
                }
              }
              if (error) {
                // console.info(error); // 必要ならカメラエラーのデバッグに使う
              }
            }}
            constraints={{ facingMode: "environment" }}
            videoContainerStyle={{
              width: "100%",
              height: "100%",
              paddingTop: 0,
            }}
            videoStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </main>
  );
}
