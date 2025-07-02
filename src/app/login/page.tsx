// src/app/login/page.tsx

"use client";

import { QrCodeScanner } from "@/components/qr-code-scanner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // URLに child_id が含まれていれば、自動的にログイン処理を開始
  useEffect(() => {
    const childId = searchParams.get("child_id");
    if (childId) {
      // Auth.jsのsignIn関数にリダイレクトまで任せる
      // 成功すれば callbackUrl ('/') にリダイレクトされ、失敗した場合はエラーが表示される
      signIn("qr-login", {
        childId: childId,
        callbackUrl: "/", // ログイン成功後に遷移するページ
      }).catch((error: unknown) => {
        // catchの型はunknownが安全
        console.error("Sign-in promise rejected:", error);
        setErrorMessage(
          "ログイン処理中に予期せぬエラーが発生しました。もう一度お試しください。"
        );
      });
    }
  }, [searchParams]);

  const onScanSuccess = (decodedText: string) => {
    try {
      const urlObject = new URL(decodedText);
      const childId = urlObject.searchParams.get("child_id");
      // 正しいログイン用URLか検証
      if (childId && urlObject.pathname === "/login") {
        // ログイン処理をトリガーするため、child_id付きのURLに遷移させる
        router.push(`/login?child_id=${childId}`);
      } else {
        setErrorMessage("このQRコードはログイン用ではありません。");
      }
    } catch {
      setErrorMessage("無効なQRコードです。");
    }
  };

  // onScanFailureの引数の型を `unknown` にしてエラーに対応
  const onScanFailure = (error: unknown) => {
    console.error("QR Scan Error:", error);
    // ユーザーには汎用的なメッセージを表示
    setErrorMessage("QRコードの読み取りに失敗しました。");
  };

  // child_id がある場合は、ログイン処理中の画面を表示
  if (searchParams.has("child_id")) {
    return (
      <main className="w-full h-[100dvh] flex flex-col justify-center items-center bg-gray-100 p-4 text-center">
        <div className="max-w-md w-full space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">
            ログインしています...
          </h1>
          <p className="text-gray-600 mt-2">
            画面はそのままで、お待ちください。
          </p>
        </div>
      </main>
    );
  }

  // QRスキャナーを表示するUI
  return (
    <main className="w-full h-[100dvh] flex flex-col justify-center items-center bg-gray-100 p-4 text-center">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            QRコードでログイン
          </h1>
          <p className="text-gray-600 mt-2">
            もらったQRコードを、
            <br />
            四角いワクの中にうつしてね。
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
      <div className="pt-4">
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          もどる
        </Button>
      </div>
    </main>
  );
}

// useSearchParams を使うため Suspense でラップ
export default function LoginPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
