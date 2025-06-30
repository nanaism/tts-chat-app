"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Frown } from "lucide-react"; // Frownアイコンもかわいいかもしれません
import { useEffect } from "react";

// このコンポーネントはNext.jsによって自動的にエラーをpropsとして受け取ります
export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 開発者がエラー内容を把握できるように、コンソールにはエラーを出力します
    console.error(error);
  }, [error]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 bg-gradient-to-br from-sky-100 to-violet-200">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl p-8 max-w-md w-full flex flex-col items-center gap-4"
      >
        <div className="p-4 bg-red-100 rounded-full">
          {/* FrownやAlertTriangleなど、雰囲気に合わせてアイコンを選べます */}
          <Frown className="w-12 h-12 text-red-400" />
        </div>

        <h2 className="text-xl font-bold text-gray-800 mt-2">
          ごめんね、エラーが起きちゃったみたい…
        </h2>

        <p className="text-gray-600 leading-relaxed">
          今はアクセスが集中しているか、
          <br />
          ちょっとだけ調子が悪いのかもしれない…
        </p>

        {/* 開発時のみ詳細なエラーメッセージを表示するとデバッグに便利です */}
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded-md">
            {error.message}
          </p>
        )}

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={
              // reset()を呼び出すことで、ページを再読み込みせずに再レンダリングを試みます
              () => reset()
            }
            className="mt-4 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-lg px-8 py-3 text-base"
          >
            もう一度ためしてみる
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
