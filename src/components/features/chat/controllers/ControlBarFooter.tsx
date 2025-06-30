"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { History, Loader, PhoneOff, Send, Settings } from "lucide-react";
import { KeyboardEvent, memo, useState } from "react";

type Props = {
  onSendMessage: (input: string) => void;
  onHistoryClick: () => void;
  onEndCallClick: () => void;
  onSettingsClick: () => void;
  isLoading: boolean;
};

export const ControlBarFooter = memo(
  ({
    onSendMessage,
    onHistoryClick,
    onEndCallClick,
    onSettingsClick,
    isLoading,
  }: Props) => {
    const [input, setInput] = useState("");

    const handleSend = () => {
      const trimmed = input.trim();
      if (trimmed && !isLoading) {
        onSendMessage(trimmed);
        setInput("");
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <footer className="p-3 bg-white/40 backdrop-blur-lg border-t flex-shrink-0 z-10">
        <div className="flex w-full items-center space-x-2">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onHistoryClick}
              disabled={isLoading}
              className="rounded-full text-gray-600 w-8 h-8"
              aria-label="履歴を表示"
            >
              <History size={24} />
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              disabled={isLoading}
              className="rounded-full text-gray-600 w-8 h-8"
              aria-label="設定"
            >
              <Settings size={22} />
            </Button>
          </motion.div>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ここに入力してね..."
            disabled={isLoading}
            className="flex-1 bg-white/80 rounded-full h-12 px-5"
          />
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-lg"
              aria-label="送信"
            >
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Loader className="h-6 w-6 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Send className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              type="button"
              onClick={onEndCallClick}
              disabled={isLoading}
              className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
              aria-label="おはなしをやめる"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      </footer>
    );
  }
);
ControlBarFooter.displayName = "ControlBarFooter";
