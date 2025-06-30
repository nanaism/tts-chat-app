"use client";

import { motion } from "framer-motion";
import { memo } from "react";

export const ThinkingIndicator = memo(() => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="absolute inset-0 bg-black/10 backdrop-blur-sm z-20 flex flex-col justify-center items-center"
    >
      {/* 思考の光のオーラ */}
      <motion.div
        className="w-24 h-24 rounded-full border-2 border-white/50"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 4,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      <p className="text-white text-lg font-semibold mt-6 drop-shadow">
        考え中...
      </p>
    </motion.div>
  );
});
ThinkingIndicator.displayName = "ThinkingIndicator";
