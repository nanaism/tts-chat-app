"use client";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Rabbit, Turtle, X } from "lucide-react";
import { memo } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  thinkMode: "fast" | "slow";
  setThinkMode: (mode: "fast" | "slow") => void;
};

export const SettingsDialog = memo(
  ({ isOpen, onClose, thinkMode, setThinkMode }: Props) => {
    const handleModeChange = (mode: "fast" | "slow") => {
      setThinkMode(mode);
      onClose();
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-sm bg-white/90 rounded-3xl shadow-2xl p-6 flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  考え方を変える
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full text-gray-500"
                >
                  <X size={24} />
                </Button>
              </div>
              <p className="text-gray-600 text-sm">
                ニアの考える速さを選べるよ。速いとお返事がすぐ来るけど、ちょっとだけ考えが浅くなるかも？
              </p>

              <div className="flex flex-col gap-4 mt-2">
                <button
                  onClick={() => handleModeChange("fast")}
                  className={`flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                    thinkMode === "fast"
                      ? "border-pink-500 bg-pink-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-pink-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        thinkMode === "fast"
                          ? "bg-pink-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Rabbit size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-left text-gray-800">
                        うさぎモード
                      </h3>
                      <p className="text-sm text-left text-gray-500">
                        はやく考える
                      </p>
                    </div>
                  </div>
                  {thinkMode === "fast" && (
                    <motion.div
                      layoutId="active-indicator"
                      className="w-3 h-3 rounded-full bg-pink-500"
                    />
                  )}
                </button>

                <button
                  onClick={() => handleModeChange("slow")}
                  className={`flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                    thinkMode === "slow"
                      ? "border-violet-500 bg-violet-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-violet-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        thinkMode === "slow"
                          ? "bg-violet-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Turtle size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-left text-gray-800">
                        かめモード
                      </h3>
                      <p className="text-sm text-left text-gray-500">
                        じっくり考える
                      </p>
                    </div>
                  </div>
                  {thinkMode === "slow" && (
                    <motion.div
                      layoutId="active-indicator"
                      className="w-3 h-3 rounded-full bg-violet-500"
                    />
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
SettingsDialog.displayName = "SettingsDialog";
