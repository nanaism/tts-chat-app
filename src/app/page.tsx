"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { KeyboardEvent, useEffect, useRef, useState } from "react";

// UIコンポーネントとアイコン
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader, Mic, Play, RotateCw, Send, Sparkles } from "lucide-react";

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

const NiaAvatar = ({ isSpeaking }: { isSpeaking: boolean }) => {
  const avatarVariants: Variants = {
    idle: {
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 300, damping: 15 },
    },
    speaking: {
      scale: [1, 1.1, 1.05, 1.1, 1],
      transition: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
    },
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
const UnlockScreen = ({ onUnlock }: { onUnlock: () => void }) => (
  <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-rose-100 to-violet-200 flex flex-col justify-center items-center z-50 p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center"
    >
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center shadow-2xl mx-auto mb-6">
        <Sparkles className="w-12 h-12 text-white/90" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">ニアとおはなし</h1>
      <p className="text-gray-600 mb-8">タップして、おはなしをはじめよう</p>
      <motion.button
        onClick={onUnlock}
        className="bg-white/80 backdrop-blur-md rounded-full px-8 py-4 text-lg font-semibold text-violet-600 shadow-lg flex items-center gap-3"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Play className="w-6 h-6" />
        はじめる
      </motion.button>
    </motion.div>
  </div>
);

// ========= メインのチャットページ =========

export default function ChatPage() {
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const CHAT_HISTORY_KEY = "nia-chat-history";

  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.onplay = () => setIsAiSpeaking(true);
    audio.onended = () => setIsAiSpeaking(false);
    audio.onerror = (e) => {
      console.error("Audio Error:", e);
      setIsAiSpeaking(false);
    };
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse chat history:", e);
        setMessages([
          {
            id: 0,
            role: "ai",
            text: "こんにちは！わたしは「ニア」。どんなお話がしたいかな？",
          },
        ]);
      }
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

  // ★★★ ここが修正箇所です ★★★
  useEffect(() => {
    if (messages.length > 0) {
      // audioDataプロパティを除外した、保存用の新しいメッセージ配列を作成します。
      const messagesToSave = messages.map(({ ...rest }) => rest);

      try {
        // この軽量化された配列をローカルストレージに保存します。
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToSave));
      } catch (error) {
        console.error("ローカルストレージへの保存に失敗しました:", error);
      }
    }
  }, [messages]);

  const handleUnlockAudio = () => {
    if (audioRef.current) {
      audioRef.current.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      audioRef.current
        .play()
        .catch((e) =>
          console.log(
            "Audio unlock failed, this is expected on some browsers:",
            e
          )
        );
    }
    setIsAudioUnlocked(true);
  };

  const playAudioFromBase64 = (base64Data: string) => {
    if (!base64Data || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = `data:audio/wav;base64,${base64Data}`;
    audio.play().catch((e) => {
      console.error("音声の再生に失敗しました:", e);
      setIsAiSpeaking(false);
    });
  };

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
      if (data.audioData) playAudioFromBase64(data.audioData);
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsAiSpeaking(false);
  };

  return (
    <main
      className={`flex justify-center items-center w-full h-full min-h-screen bg-gradient-to-br from-sky-100 via-rose-100 to-violet-200 p-2 sm:p-4 ${roundedFont.className}`}
    >
      <AnimatePresence>
        {!isAudioUnlocked && <UnlockScreen onUnlock={handleUnlockAudio} />}
      </AnimatePresence>
      <AnimatePresence>
        {isAudioUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-2xl h-full md:h-[90vh] md:max-h-[800px] flex flex-col bg-white/50 backdrop-blur-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-white/30"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
