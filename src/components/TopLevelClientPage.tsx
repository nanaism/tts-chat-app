// src/components/TopLevelClientPage.tsx (新規作成)

"use client";

import { ChatClient } from "@/components/features/chat/ChatClient";
import { PreLoginScreen } from "@/components/features/chat/controllers/PreLoginScreen";
import type { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { Kiwi_Maru } from "next/font/google";
import { useState } from "react";
import { Button } from "./ui/button";

const cuteFont = Kiwi_Maru({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

// PreLoginScreenにGoogleログイン機能を追加したバージョン
function EnhancedPreLoginScreen({ onDemoStart }: { onDemoStart: () => void }) {
  return (
    <PreLoginScreen onDemoStart={onDemoStart}>
      <div className="text-center mt-6">
        <p className="text-sm text-gray-500 mb-4">- または -</p>
        <Button
          onClick={() => signIn("google")}
          variant="outline"
          className="w-full"
        >
          保護者の方はGoogleでログイン
        </Button>
      </div>
    </PreLoginScreen>
  );
}

export function TopLevelClientPage({ session }: { session: Session | null }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 1. QRログインなどでセッションが確立されている場合
  if (session?.user?.id) {
    // isDemoModeをfalseにリセットしつつ、ChatClientを表示
    if (isDemoMode) setIsDemoMode(false);
    return <ChatClient session={session} />;
  }

  // 2. セッションはないが、ユーザーが「デモ」を選択した場合
  if (isDemoMode) {
    // ChatClientに渡すための、デモ用の擬似セッションオブジェクトを作成
    const demoSession: Session = {
      user: { id: "demo-user", name: "デモ" },
      expires: "1d", // 仮の有効期限
    };
    return <ChatClient session={demoSession} />;
  }

  // 3. デフォルト画面 (未ログイン状態で、デモも開始していない)
  return (
    <main
      className={`${cuteFont.className} w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col`}
    >
      <EnhancedPreLoginScreen onDemoStart={() => setIsDemoMode(true)} />
    </main>
  );
}
