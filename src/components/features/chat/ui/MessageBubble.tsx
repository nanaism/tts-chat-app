"use client";

import type { VRMExpressionPresetName } from "@pixiv/three-vrm";
import { motion } from "framer-motion";
import { memo } from "react";

type Emotion = VRMExpressionPresetName | "thinking";
type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
  audioData?: string;
  audioUrl?: string;
  emotion?: Emotion;
};

export const MessageBubble = memo(({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user";
  return (
    <motion.div
      className={`flex items-end gap-2 w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-pink-400 to-violet-500 shadow-lg" />
      )}
      <div
        className={`max-w-[85%] rounded-2xl p-3 shadow-md text-base leading-relaxed break-words ${
          isUser ? "bg-cyan-500 text-white" : "bg-white/90 text-gray-800"
        }`}
      >
        {msg.text}
      </div>
    </motion.div>
  );
});
MessageBubble.displayName = "MessageBubble";
