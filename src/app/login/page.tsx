"use client";

import { QrCodeScanner } from "@/components/qr-code-scanner";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const CHILD_ID_STORAGE_KEY = "near-child-id";

export default function LoginPage() {
  const router = useRouter();
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

  const onScanSuccess = (decodedText: string) => {
    try {
      const urlObject = new URL(decodedText);
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
  };

  // ★★★ ここを修正 ★★★
  const onScanFailure = () => {
    // 将来的にデバッグで使うかもしれないので、console.warnを残しておくのも良い
    // console.warn(`Code scan error = ${error}`);
  };

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
        <div className="w-full max-w-xs mx-auto">
          <QrCodeScanner
            onScanSuccess={onScanSuccess}
            onScanFailure={onScanFailure}
          />
        </div>
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mt-4">
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </main>
  );
}
