"use client";

import { Html } from "@react-three/drei";
import { motion } from "framer-motion";
import { Heart, Sparkles, Star } from "lucide-react";

export const ModelLoader = () => {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { ease: "easeOut" as const, duration: 0.5 },
    },
  };

  return (
    <Html center>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center gap-6"
      >
        <div className="relative w-48 h-48 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "8s" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2">
              <Heart className="w-8 h-8 text-pink-300" fill="currentColor" />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <Star className="w-7 h-7 text-yellow-300" fill="currentColor" />
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
              <Sparkles className="w-7 h-7 text-sky-300" fill="currentColor" />
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <Star className="w-8 h-8 text-violet-300" fill="currentColor" />
            </div>
          </motion.div>

          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Star className="w-20 h-20 text-pink-400" fill="currentColor" />
          </motion.div>
        </div>
        <motion.p
          variants={itemVariants}
          className={`text-lg font-semibold text-gray-700 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full`}
        >
          まほうのじゅんびちゅう…
        </motion.p>
      </motion.div>
    </Html>
  );
};
