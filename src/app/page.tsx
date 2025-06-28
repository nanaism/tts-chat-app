"use client";

// Reactと、今回新たに導入するアニメーションライブラリをインポート
import { KeyboardEvent, useEffect, useRef, useState } from "react";
// ★★★ 修正点1：framer-motionから「Variants」の型をインポート ★★★
import { AnimatePresence, motion, Variants } from "framer-motion";

// UIコンポーネントとアイコン
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCw, Send, Sparkles } from "lucide-react";

// Next.jsのフォント最適化機能で、可愛らしい丸ゴシック体を読み込みます
import { M_PLUS_Rounded_1c } from "next/font/google";
const roundedFont = M_PLUS_Rounded_1c({
  weight: ["400", "700"],
  subsets: ["latin"],
});

// ========= 新しいコンポーネントたち =========

const HikariAvatar = () => (
  <motion.div
    className="w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-br from-pink-300 to-indigo-400 shadow-lg flex items-center justify-center"
    whileHover={{ scale: 1.1, rotate: 10 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Sparkles className="text-white/80" />
  </motion.div>
);

const TypingIndicator = () => (
  <motion.div
    className="flex items-center space-x-1.5 p-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
  >
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
  </motion.div>
);

const useTypewriter = (text: string, speed = 50) => {
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

// メッセージの吹き出しコンポーネント
const MessageBubble = ({ msg }: { msg: Message }) => {
  const typedText = useTypewriter(msg.text);
  const isUser = msg.role === "user";
  // ★★★ 修正点1：アニメーションの設計図に「Variants」型を指定 ★★★
  const bubbleVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };
  return (
    <motion.div
      className={`flex items-end gap-3 w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      {!isUser && <HikariAvatar />}
      <div
        className={`max-w-[80%] rounded-2xl p-4 shadow-md text-base leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white rounded-br-none"
            : "bg-white text-gray-800 rounded-bl-none"
        }`}
      >
        {isUser ? msg.text : typedText}
      </div>
    </motion.div>
  );
};

// ========= メインのチャットページ =========

type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
  audioData?: string;
};

const playAudioFromBase64 = (base64Data: string) => {
  if (!base64Data) return;
  // ★★★ MIMEタイプを "audio/mp3" から "audio/wav" に変更 ★★★
  const audioSrc = `data:audio/wav;base64,${base64Data}`;
  const audio = new Audio(audioSrc);
  audio.play().catch((e) => console.error("音声の再生に失敗しました:", e));
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const CHAT_HISTORY_KEY = "hikari-chat-history";

  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([
        {
          id: 0,
          role: "ai",
          text: "こんにちは！わたしは「ひかり」。どんなお話がしたいかな？",
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // ★★★ 修正点2：二重に定義されていた関数を、一つに統合 ★★★
  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: trimmedInput,
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = trimmedInput;
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });
      if (!response.ok) throw new Error("APIからの応答がありませんでした");
      const data = await response.json();
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
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: "ごめんなさい、少し調子が悪いみたい。もう一度話しかけてくれるかな？",
      };
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
  };

  return (
    <main
      className={`flex justify-center items-center h-screen bg-gradient-to-br from-rose-100 to-teal-100 p-4 ${roundedFont.className}`}
    >
      <div className="w-full max-w-lg h-full max-h-[700px] flex flex-col bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/30">
        <header className="p-4 text-center border-b border-white/30 flex justify-between items-center">
          <div className="w-10 h-10"></div>
          <h1 className="text-xl font-bold text-gray-700 tracking-wider">
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

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-6 space-y-6">
              <AnimatePresence>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
              </AnimatePresence>
              {isLoading && <TypingIndicator />}
            </div>
          </ScrollArea>
        </div>

        <footer className="p-4 border-t border-white/30 bg-white/20">
          <div className="flex w-full items-center space-x-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージをかいてね..."
              disabled={isLoading}
              className="flex-1 bg-white/70 rounded-full border-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 transition-all text-base px-5 py-6"
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                type="button"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="rounded-full w-14 h-14 bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-lg hover:scale-105 transition-transform"
              >
                <Send className="h-6 w-6" />
              </Button>
            </motion.div>
          </div>
        </footer>
      </div>
    </main>
  );
}
