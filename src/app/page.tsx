"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { KeyboardEvent, useEffect, useRef, useState } from "react";

// UIコンポーネントとアイコン
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader, Mic, RotateCw, Send, Sparkles } from "lucide-react";

// フォント
import { M_PLUS_Rounded_1c } from "next/font/google";
const roundedFont = M_PLUS_Rounded_1c({
  weight: ["400", "700"],
  subsets: ["latin"],
});

// 型定義
type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
  audioData?: string;
};

// ========= コンポーネント定義 =========

// --- AIのアバター ---
// ★★★ エラー修正箇所 ★★★
const NiaAvatar = ({ isSpeaking }: { isSpeaking: boolean }) => {
  // アニメーションの状態を variants として定義
  const avatarVariants: Variants = {
    // 待機中の状態
    idle: {
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
    // 発話中の状態 (キーフレーム配列と duration ベースの transition を使用)
    speaking: {
      scale: [1, 1.1, 1.05, 1.1, 1],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
    // ホバー時の状態 (spring を使用)
    hover: {
      scale: 1.15,
      rotate: 10,
      transition: { type: "spring", stiffness: 300 },
    },
  };

  return (
    <motion.div
      className="w-11 h-11 rounded-full flex-shrink-0 bg-gradient-to-br from-pink-400 to-violet-500 shadow-lg flex items-center justify-center"
      variants={avatarVariants}
      // isSpeaking の状態に応じて 'speaking' または 'idle' variant を適用
      animate={isSpeaking ? "speaking" : "idle"}
      whileHover="hover"
    >
      {isSpeaking ? (
        <Mic className="text-white/90" size={20} />
      ) : (
        <Sparkles className="text-white/90" />
      )}
    </motion.div>
  );
};

// --- 考え中インジケーター ---
const TypingIndicator = () => (
  <motion.div
    className="flex items-end gap-3 justify-start"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
  >
    <NiaAvatar isSpeaking={false} />
    <div className="flex items-center space-x-1.5 p-4 bg-white/80 backdrop-blur-sm rounded-2xl rounded-bl-none shadow-md">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-pink-400 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  </motion.div>
);

// --- タイプライター Hook ---
const useTypewriter = (text: string, speed = 40) => {
  const [displayText, setDisplayText] = useState("");
  useEffect(() => {
    setDisplayText("");
    if (text) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          i++;
          setDisplayText(text.slice(0, i));
        } else {
          clearInterval(typingInterval);
        }
      }, speed);
      return () => clearInterval(typingInterval);
    }
  }, [text, speed]);
  return displayText;
};

// --- メッセージ吹き出し ---
const MessageBubble = ({
  msg,
  isLastAiMessage,
  isAiSpeaking,
}: {
  msg: Message;
  isLastAiMessage: boolean;
  isAiSpeaking: boolean;
}) => {
  const typedText = useTypewriter(msg.text);
  const isUser = msg.role === "user";

  const bubbleVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      className={`flex items-end gap-2 md:gap-3 w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      {!isUser && <NiaAvatar isSpeaking={isLastAiMessage && isAiSpeaking} />}
      <div
        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 md:p-4 shadow-md text-base leading-relaxed break-words ${
          isUser
            ? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-br-lg"
            : "bg-white/90 backdrop-blur-sm text-gray-800 rounded-bl-lg"
        }`}
      >
        {isUser ? msg.text : typedText}
      </div>
    </motion.div>
  );
};

// ========= メインのチャットページ =========

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const CHAT_HISTORY_KEY = "nia-chat-history";

  // --- 副作用 Hooks ---
  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([
        {
          id: 0,
          role: "ai",
          text: "こんにちは！わたしは「ニア」。どんなお話がしたいかな？",
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // --- 音声再生ロジック ---
  const playAudioFromBase64 = (base64Data: string) => {
    if (!base64Data) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audioSrc = `data:audio/wav;base64,${base64Data}`;
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.onplay = () => setIsAiSpeaking(true);
    audio.onended = () => setIsAiSpeaking(false);
    audio.onerror = () => setIsAiSpeaking(false);

    audio.play().catch((e) => {
      console.error("音声の再生に失敗しました:", e);
      setIsAiSpeaking(false);
    });
  };

  // --- メッセージ送信処理 ---
  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: trimmedInput,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedInput }),
      });

      if (!response.ok) throw new Error("APIからの応答がありませんでした");
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: data.textResponse,
        audioData: data.audioData,
      };

      if (data.audioData) {
        playAudioFromBase64(data.audioData);
      }
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("メッセージ送信処理中にエラー:", error);
      const text =
        error instanceof Error && error.message.includes("API")
          ? "ごめんなさい、APIとの通信がうまくいかなかったみたい…。"
          : "ごめんなさい、少し調子が悪いみたい。もう一度話しかけてくれるかな？";

      const errorMessage: Message = { id: Date.now() + 1, role: "ai", text };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 0,
        role: "ai",
        text: "うん、わかったよ！はじめまして、わたしは「ニア」。これから、よろしくね！",
      },
    ]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    if (audioRef.current) audioRef.current.pause();
    setIsAiSpeaking(false);
  };

  // --- レンダリング ---
  return (
    <main
      className={`flex justify-center items-center w-full h-full min-h-screen bg-gradient-to-br from-sky-100 via-rose-100 to-violet-200 p-2 sm:p-4 ${roundedFont.className}`}
    >
      <div className="w-full max-w-2xl h-full md:h-[90vh] md:max-h-[800px] flex flex-col bg-white/50 backdrop-blur-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-white/30">
        {/* Header */}
        <header className="p-4 border-b border-white/30 flex justify-between items-center flex-shrink-0">
          <div className="w-10 h-10"></div>
          <h1 className="text-lg md:text-xl font-bold text-gray-700 tracking-wider">
            ニアとおはなし
          </h1>
          <motion.div
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1, rotate: -15 }}
          >
            <Button
              onClick={handleClearChat}
              variant="ghost"
              size="icon"
              className="rounded-full group transition-colors hover:bg-rose-100/50"
            >
              <RotateCw className="h-5 w-5 text-gray-500 group-hover:text-rose-500 transition-colors" />
              <span className="sr-only">はじめから</span>
            </Button>
          </motion.div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6 space-y-6">
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isLastAiMessage={
                      msg.role === "ai" && index === messages.length - 1
                    }
                    isAiSpeaking={isAiSpeaking}
                  />
                ))}
              </AnimatePresence>
              {isLoading && <TypingIndicator />}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <footer className="p-3 sm:p-4 border-t border-white/30 bg-white/20">
          <div className="flex w-full items-center space-x-2 sm:space-x-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージをかいてね..."
              disabled={isLoading}
              className="flex-1 bg-white/70 rounded-full border-gray-200/50 focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 transition-all text-base px-5 py-3 h-14"
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="relative rounded-full w-14 h-14 bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-lg hover:scale-105 transition-transform disabled:scale-100 disabled:bg-gray-400"
              >
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    <motion.div
                      key="loader"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <Loader className="h-6 w-6 animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                    >
                      <Send className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </footer>
      </div>
    </main>
  );
}
