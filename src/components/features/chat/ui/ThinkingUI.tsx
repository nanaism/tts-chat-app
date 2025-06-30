"use client";

import { motion } from "framer-motion";

export const ThinkingUI = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-black/20 text-white px-4 py-2 rounded-full backdrop-blur-sm shadow-lg pointer-events-none"
    >
      <p>考え中...</p>
    </motion.div>
  );
};
