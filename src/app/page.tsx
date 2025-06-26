"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Volume2 } from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";

// メッセージの型定義
type Message = {
  role: "user" | "ai";
  text: string;
  audioData?: string; // AIのメッセージは音声データを持つことがある
};

// 音声再生ボタンのコンポーネント
const PlayAudioButton = ({ audioData }: { audioData: string }) => {
  const playAudio = () => {
    // Base64データが無効な場合や空の場合をチェック
    if (!audioData || audioData.trim() === "") {
      console.error("再生エラー: audioDataが空または無効です。");
      return;
    }
    // Base64データをData URLに変換
    const audioSrc = `data:audio/mp3;base64,${audioData}`;
    const audio = new Audio(audioSrc);

    // 再生に失敗した場合のエラーハンドリングを追加
    audio.play().catch((e) => {
      console.error("音声の再生に失敗しました:", e);
      // ここでユーザーにエラーを通知するUIを表示することも可能
    });
  };

  return (
    <Button
      onClick={playAudio}
      variant="ghost"
      size="icon"
      className="ml-2 flex-shrink-0"
    >
      <Volume2 className="h-4 w-4" />
      <span className="sr-only">音声を再生</span>
    </Button>
  );
};

// メインのチャットページコンポーネント
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // メッセージリストが更新されるたびに、一番下までスクロールする
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("div");
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages]);

  // メッセージを送信する非同期関数
  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = { role: "user", text: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);

    // input stateがクリアされる前に現在の値を保持
    const currentInput = trimmedInput;
    setInput("");
    setIsLoading(true);

    try {
      // POSTリクエストでAPIを呼び出し
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        // APIからエラーが返ってきた場合、詳細をログに出力
        const errorText = await response.text();
        console.error("APIエラー:", response.status, errorText);
        throw new Error(`APIからの応答がありませんでした: ${response.status}`);
      }

      // 正常な応答をJSONとして解析
      const data = await response.json();

      const aiMessage: Message = {
        role: "ai",
        text: data.textResponse,
        audioData: data.audioData,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("メッセージ送信処理中にエラーが発生しました:", error);
      // ユーザーにエラーを通知するためのメッセージ
      const errorMessage: Message = {
        role: "ai",
        text: "申し訳ありません、エラーが発生しました。もう一度お試しください。",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 入力欄でエンターキーが押された時の処理
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && !isLoading) {
      e.preventDefault(); // デフォルトのエンターキーの挙動をキャンセル
      handleSendMessage();
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md h-[95vh] grid grid-rows-[auto_1fr_auto]">
        <CardHeader>
          <CardTitle className="text-center text-xl">Gemini TTS Chat</CardTitle>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-6 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-end gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm break-words ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {/* AIのメッセージで、かつaudioDataがある場合のみ再生ボタンを表示 */}
                  {msg.role === "ai" && msg.audioData && (
                    <PlayAudioButton audioData={msg.audioData} />
                  )}
                </div>
              ))}
              {/* ローディング中のインジケーター */}
              {isLoading && (
                <div className="flex items-center justify-start space-x-2">
                  <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="p-4 border-t">
          {/* <form> を使わず、divで囲む */}
          <div className="flex w-full items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown} // エンターキーでの送信をハンドリング
              placeholder="メッセージを送信..."
              disabled={isLoading}
              autoComplete="off"
            />
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">送信</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
