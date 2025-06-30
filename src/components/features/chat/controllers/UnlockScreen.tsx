"use client";

import { app_version } from "@/app/api/chat/constants";
import { motion } from "framer-motion";
import { Phone, Sparkles } from "lucide-react";
import { memo } from "react";

export const UnlockScreen = memo(({ onUnlock }: { onUnlock: () => void }) => (
  <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-rose-100 to-violet-200 flex flex-col justify-center items-center z-50 p-4 text-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center shadow-2xl mx-auto mb-6">
        <Sparkles className="w-12 h-12 text-white/90" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">ニアとおはなし</h1>
      <p className="text-gray-600 mb-8 max-w-sm mx-auto">
        うれしいこと、なやみごと、なんでも話してね。
      </p>
      <div className="flex justify-center">
        <motion.button
          onClick={onUnlock}
          className="relative z-10 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full px-8 py-4 text-lg font-semibold shadow-xl flex items-center gap-3 backdrop-blur-md transition-all duration-200"
          style={{
            background:
              "linear-gradient(135deg, #34d399 0%, #22c55e 50%, #14b8a6 100%)",
          }}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.96 }}
        >
          <Phone className="w-6 h-6 text-white drop-shadow" /> はじめる
        </motion.button>
      </div>
    </motion.div>
    <div className="absolute bottom-4 right-4 text-xs text-gray-500/80 font-mono select-none">
      v{app_version}
    </div>
  </div>
));
UnlockScreen.displayName = "UnlockScreen";
