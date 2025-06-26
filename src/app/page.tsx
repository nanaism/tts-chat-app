// app/page.tsx
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";
import { AlertTriangle, Bot, LoaderCircle, Send, User } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  isError?: boolean;
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAreaRef.current?.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", text: inputValue };
    setChatHistory((prev) => [...prev, userMessage]);

    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "APIリクエストに失敗しました。");
      }

      const data = await response.json();
      const { textResponse, audioData } = data;

      const aiMessage: ChatMessage = { role: "ai", text: textResponse };
      setChatHistory((prev) => [...prev, aiMessage]);

      const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
      audio.play();
    } catch (err: unknown) {
      // 修正点: 'any' を 'unknown' に変更
      // 修正点: 型ガードを追加して安全にエラーメッセージを取得
      let errorMessage = "不明なエラーが発生しました。";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: errorMessage, isError: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // JSX部分は変更なしのため、前回と同様のものを利用
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-2 sm:p-4">
      <Card className="w-full max-w-2xl h-[95vh] sm:h-[85vh] flex flex-col shadow-2xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
            <Bot className="w-7 h-7 text-blue-600" />
            <span>Gemini 2.5 & TTS Chat</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-grow p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    msg.role === "user" ? "justify-end" : ""
                  )}
                >
                  {msg.role === "ai" && (
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback>
                        <Bot size={20} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "p-3 rounded-xl max-w-xs md:max-w-md",
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700",
                      {
                        "bg-red-100 dark:bg-red-900/50 border border-red-500/50":
                          msg.isError,
                      }
                    )}
                  >
                    {msg.isError && (
                      <AlertTriangle className="inline-block w-4 h-4 mr-2 text-red-600" />
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback>
                        <User size={20} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback>
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="p-3 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center space-x-2">
                    <LoaderCircle className="h-5 w-5 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Generating...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="border-t pt-4">
          <form
            onSubmit={handleSubmit}
            className="w-full flex items-center gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="AIにメッセージを送信..."
              className="flex-grow"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} size="icon">
              <Send className={cn("h-5 w-5", isLoading && "hidden")} />
              <LoaderCircle
                className={cn("h-5 w-5 animate-spin", !isLoading && "hidden")}
              />
              <span className="sr-only">送信</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
