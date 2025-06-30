"use client";

import { Button } from "@/components/ui/button";
import type { VRMExpressionPresetName } from "@pixiv/three-vrm";
import { motion } from "framer-motion";
import { Trash, X } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { ThinkingIndicator } from "./ThinkingIndicator";

type Emotion = VRMExpressionPresetName | "thinking";
type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
  audioData?: string;
  audioUrl?: string;
  emotion?: Emotion;
};

type Props = {
  messages: Message[];
  isLoading: boolean;
  onClose: () => void;
  onReset: () => void;
};

export const ChatHistoryOverlay = memo(
  ({ messages, isLoading, onClose, onReset }: Props) => {
    const scrollEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex flex-col justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="h-[85%] bg-white/90 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 p-3 border-b flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full text-gray-500"
              aria-label="閉じる"
            >
              <X size={24} />
            </Button>
            <h2 className="font-bold text-lg text-gray-700">
              おはなしのきろく
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="rounded-full text-gray-500"
              aria-label="履歴をリセット"
              disabled={isLoading || messages.length <= 1}
            >
              <Trash size={20} />
            </Button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4 pb-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {isLoading && <ThinkingIndicator />}
              <div ref={scrollEndRef} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);
ChatHistoryOverlay.displayName = "ChatHistoryOverlay";
