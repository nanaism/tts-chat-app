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

export const LiveMessageBubble = memo(({ message }: { message: Message }) => {
  return (
    <div className="absolute inset-x-0 bottom-0 p-4 pb-6 flex flex-col items-center justify-end pointer-events-none z-10">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { type: "spring", damping: 20, stiffness: 300 },
        }}
        exit={{ opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.2 } }}
        className="relative max-w-sm md:max-w-md bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center text-gray-800 shadow-xl pointer-events-auto"
      >
        <div
          className="absolute left-1/2 -top-2 w-4 h-4 bg-inherit transform -translate-x-1/2 rotate-45"
          style={{ zIndex: -1 }}
        ></div>
        <p className="break-words">{message.text}</p>
      </motion.div>
    </div>
  );
});
LiveMessageBubble.displayName = "LiveMessageBubble";
