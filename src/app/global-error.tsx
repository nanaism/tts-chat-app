"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

// global-errorでは他のコンポーネントが読み込めない可能性があるため、
// Buttonコンポーネントは使わず、インラインのスタイルで実装します。
// アイコンも外部ライブラリに依存せず、シンプルなテキストで表現します。

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // どんなエラーが起きたか開発者が知れるように、コンソールにはログを残します
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="ja">
      <head>
        <title>ニア - たいへん！</title>
        {/*
          global-errorでは、Next/Fontや外部CSSが読み込まれない可能性があるため、
          汎用的なフォントとインラインスタイルに近いTailwindクラスでスタイリングします。
        */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100vw",
            height: "100vh",
            textAlign: "center",
            padding: "1.5rem",
            background: "linear-gradient(to bottom right, #e0f2fe, #f3e8ff)",
            fontFamily: "sans-serif",
            color: "#374151",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(10px)",
              borderRadius: "24px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              padding: "2rem",
              maxWidth: "448px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "3rem",
                lineHeight: "1",
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.1))",
              }}
            >
              (´；ω；｀)
            </div>

            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginTop: "0.5rem",
                color: "#1f2937",
              }}
            >
              たいへん！ なにか大きな問題が起きちゃったみたい…
            </h2>

            <p style={{ lineHeight: "1.6", color: "#4b5563" }}>
              アプリのかいはつしゃさんに、
              <br />
              このことを教えてあげてね。
            </p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                onClick={() => reset()}
                style={{
                  marginTop: "1rem",
                  borderRadius: "9999px",
                  background:
                    "linear-gradient(to bottom right, #f472b6, #8b5cf6)",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                  padding: "0.75rem 2rem",
                  fontSize: "1rem",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                もういちどやってみる
              </button>
            </motion.div>
          </motion.div>
        </main>
      </body>
    </html>
  );
}
