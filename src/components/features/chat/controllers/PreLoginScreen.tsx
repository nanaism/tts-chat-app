"use client";

import { motion } from "framer-motion";
import { QrCode, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  onDemoStart: () => void;
};

export const PreLoginScreen = ({ onDemoStart }: Props) => {
  const router = useRouter();
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-rose-100 to-violet-200 flex flex-col justify-center items-center z-50 p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-6 flex flex-col items-center"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center shadow-2xl mx-auto">
          <Sparkles className="w-12 h-12 text-white/90" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">ニアとおはなし</h1>
        <p className="text-gray-600 max-w-sm mx-auto">
          はじめるには、QRコードを読み込んでね！
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button
            onClick={() => router.push("/login")}
            className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full px-8 py-4 text-lg font-semibold shadow-xl flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <QrCode className="w-6 h-6" /> QRコードでログイン
          </motion.button>

          <motion.button
            onClick={onDemoStart}
            className="bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 hover:from-purple-500 hover:to-red-600 text-white rounded-full px-8 py-4 text-lg font-semibold shadow-xl flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-6 h-6" /> デモをはじめる
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
