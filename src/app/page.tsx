"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  VRM,
  VRMExpressionPresetName,
  VRMHumanBoneName,
  VRMLoaderPlugin,
} from "@pixiv/three-vrm";
import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader,
  MessageSquare,
  Play,
  RotateCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { M_PLUS_Rounded_1c } from "next/font/google";
import {
  KeyboardEvent,
  memo,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import {
  GLTFLoader,
  GLTFParser,
} from "three/examples/jsm/loaders/GLTFLoader.js";

const roundedFont = M_PLUS_Rounded_1c({
  weight: ["400", "700"],
  subsets: ["latin"],
});

type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
  audioData?: string;
  emotion?: string;
};
type Emotion = VRMExpressionPresetName | "thinking";

const ModelLoader = () => {
  return (
    <Html center>
      <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md rounded-full px-5 py-3 text-gray-700 shadow-lg">
        <Loader className="h-6 w-6 animate-spin" />
        <p className="font-semibold">ニアをよびだしています...</p>
      </div>
    </Html>
  );
};

// ========= 【ここから修正】VRMViewer コンポーネント (自然なまばたき実装) =========
const VRMViewer = memo(
  ({
    emotion,
    analyser,
  }: {
    emotion: Emotion;
    analyser: AnalyserNode | null;
  }) => {
    const gltf = useLoader(GLTFLoader, "/avatar.vrm", (loader) => {
      loader.register((parser: GLTFParser) => new VRMLoaderPlugin(parser));
    });
    const vrmRef = useRef<VRM | null>(null);
    const restingArmRad = useRef(Math.PI * (-70 / 180));

    // 【ここから追加】まばたきの状態を管理するためのuseRef
    const blinkState = useRef({
      isBlinking: false,
      lastBlinkTime: 0,
      nextBlinkDelay: 3.0, // 最初のまばたきまでの時間
    });

    useEffect(() => {
      if (!gltf.userData.vrm) return;
      const vrm = gltf.userData.vrm;
      vrmRef.current = vrm;

      const rightUpperArm = vrm.humanoid?.getNormalizedBoneNode(
        VRMHumanBoneName.RightUpperArm
      );
      const leftUpperArm = vrm.humanoid?.getNormalizedBoneNode(
        VRMHumanBoneName.LeftUpperArm
      );
      if (rightUpperArm && leftUpperArm) {
        rightUpperArm.rotation.z = -restingArmRad.current;
        leftUpperArm.rotation.z = restingArmRad.current;
      }

      if (vrm.springBoneManager) {
        vrm.springBoneManager.reset();
      }
    }, [gltf]);

    useFrame((state, delta) => {
      const vrm = vrmRef.current;
      if (!vrm?.expressionManager || !vrm.humanoid) return;

      const manager = vrm.expressionManager;
      const humanoid = vrm.humanoid;
      const clockTime = state.clock.elapsedTime;

      // 【ここからが新しいまばたき処理】
      let blinkValue = 0;
      const blinkManager = blinkState.current;
      const blinkDuration = 0.6; // 瞬きの速さ

      if (blinkManager.isBlinking) {
        const progress =
          (clockTime - blinkManager.lastBlinkTime) / blinkDuration;
        if (progress >= 1) {
          blinkManager.isBlinking = false;
          blinkValue = 0; // 完全に開く
        } else {
          // sinカーブで 0 -> 1 -> 0 の滑らかな動きを生成
          blinkValue = Math.sin(progress * Math.PI);
        }
      } else {
        if (
          clockTime - blinkManager.lastBlinkTime >
          blinkManager.nextBlinkDelay
        ) {
          blinkManager.isBlinking = true;
          blinkManager.lastBlinkTime = clockTime;
          // 次のまばたきを2〜7秒後のランダムな時間に設定
          blinkManager.nextBlinkDelay = 3.0 + Math.random() * 4.0;
        }
      }
      manager.setValue(VRMExpressionPresetName.Blink, blinkValue);
      // 【ここまでが新しいまばたき処理】

      const chest = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Chest);
      if (chest) {
        chest.rotation.x = Math.sin(clockTime * 0.8) * 0.01;
      }

      if (emotion === "thinking") {
        const head = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(
            head.rotation.z,
            Math.PI / 18,
            delta * 3.0
          );
        }
        manager.setValue(
          VRMExpressionPresetName.Neutral,
          THREE.MathUtils.lerp(
            manager.getValue(VRMExpressionPresetName.Neutral) ?? 0,
            0.8,
            delta * 5.0
          )
        );
        manager.setValue(
          VRMExpressionPresetName.Oh,
          THREE.MathUtils.lerp(
            manager.getValue(VRMExpressionPresetName.Oh) ?? 0,
            0.2,
            delta * 5.0
          )
        );
        manager.setValue(VRMExpressionPresetName.Aa, 0);
      } else {
        const head = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
        if (head) {
          head.rotation.z = THREE.MathUtils.lerp(
            head.rotation.z,
            0,
            delta * 3.0
          );
        }
        for (const preset of Object.values(VRMExpressionPresetName)) {
          // Blinkは専用ロジックで制御するのでスキップ
          if (
            typeof preset !== "string" ||
            preset === VRMExpressionPresetName.Blink
          )
            continue;
          const targetWeight = preset === emotion ? 1.0 : 0.0;
          const currentWeight = manager.getValue(preset) ?? 0.0;
          manager.setValue(
            preset,
            THREE.MathUtils.lerp(currentWeight, targetWeight, delta * 10.0)
          );
        }

        const rightUpperArm = humanoid.getNormalizedBoneNode(
          VRMHumanBoneName.RightUpperArm
        );
        const leftUpperArm = humanoid.getNormalizedBoneNode(
          VRMHumanBoneName.LeftUpperArm
        );
        if (rightUpperArm && leftUpperArm) {
          rightUpperArm.rotation.z = THREE.MathUtils.lerp(
            rightUpperArm.rotation.z,
            -restingArmRad.current,
            delta * 5.0
          );
          leftUpperArm.rotation.z = THREE.MathUtils.lerp(
            leftUpperArm.rotation.z,
            restingArmRad.current,
            delta * 5.0
          );
        }

        if (analyser) {
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          const volume = data.reduce((a, b) => a + b, 0) / data.length;
          manager.setValue(
            VRMExpressionPresetName.Aa,
            Math.min(1.0, (volume / 100) ** 1.5)
          );
        } else {
          manager.setValue(VRMExpressionPresetName.Aa, 0);
        }
      }

      vrm.update(delta);
    });

    return <primitive object={gltf.scene} position={[0, -0.1, 0]} />;
  }
);
VRMViewer.displayName = "VRMViewer";
// ========= 【ここまで修正】VRMViewer コンポーネント =========

const VRMCanvas = memo(
  ({
    emotion,
    analyser,
  }: {
    emotion: Emotion;
    analyser: AnalyserNode | null;
  }) => {
    return (
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 1.5], fov: 25 }}
        className="w-full h-full touch-none"
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={1.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={2.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <Suspense fallback={<ModelLoader />}>
          <VRMViewer emotion={emotion} analyser={analyser} />
        </Suspense>
        <OrbitControls
          target={[0, 1.2, 0]}
          enableZoom={false}
          enablePan={false}
        />
      </Canvas>
    );
  }
);
VRMCanvas.displayName = "VRMCanvas";

const MessageBubble = memo(({ msg }: { msg: Message }) => {
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

const TypingIndicator = memo(() => (
  <motion.div
    className="flex items-end gap-2"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, transition: { duration: 0.1 } }}
  >
    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-pink-400 to-violet-500" />
    <div className="flex items-center space-x-1.5 p-3 bg-white/90 rounded-2xl shadow-md">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-pink-400 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  </motion.div>
));
TypingIndicator.displayName = "TypingIndicator";

const ChatHistoryOverlay = memo(
  ({
    messages,
    isLoading,
    onClose,
    onReset,
  }: {
    messages: Message[];
    isLoading: boolean;
    onClose: () => void;
    onReset: () => void;
  }) => {
    const scrollEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex flex-col justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="h-[85%] bg-white/90 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-shrink-0 p-3 border-b flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full text-gray-500"
              aria-label="閉じる"
            >
              <X size={24} />
            </Button>
            <h2 className="font-bold text-lg text-gray-700">
              おはなしのきろく
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="rounded-full text-gray-500"
              aria-label="履歴をリセット"
              disabled={isLoading || messages.length <= 1}
            >
              <RotateCw size={20} />
            </Button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4 pb-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={scrollEndRef} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);
ChatHistoryOverlay.displayName = "ChatHistoryOverlay";

const LiveMessageBubble = memo(({ message }: { message: Message }) => {
  return (
    <div className="absolute bottom-24 md:bottom-28 left-0 right-0 w-full flex justify-center items-center p-4 pointer-events-none z-10">
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
        className="relative max-w-xs md:max-w-md bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center text-gray-800 shadow-xl pointer-events-auto"
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

const ThinkingIndicator = memo(() => {
  return (
    <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 bg-black/30 text-white/90 backdrop-blur-sm rounded-full px-4 py-2"
      >
        <p>考え中…</p>
        <motion.div
          className="w-2 h-2 bg-white rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
});
ThinkingIndicator.displayName = "ThinkingIndicator";

const ChatInputFooter = memo(
  ({
    onSendMessage,
    isLoading,
    onHistoryToggle,
  }: {
    onSendMessage: (input: string) => void;
    isLoading: boolean;
    onHistoryToggle: () => void;
  }) => {
    const [input, setInput] = useState("");
    const handleSend = () => {
      const trimmed = input.trim();
      if (trimmed && !isLoading) {
        onSendMessage(trimmed);
        setInput("");
      }
    };
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSend();
      }
    };
    return (
      <footer className="p-3 bg-white/40 backdrop-blur-lg border-t flex-shrink-0 z-10">
        <div className="flex w-full items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onHistoryToggle}
            className="rounded-full text-gray-600"
            aria-label="履歴を表示"
          >
            <MessageSquare size={24} />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージをかいてね..."
            disabled={isLoading}
            className="flex-1 bg-white/80 rounded-full h-12 px-5"
          />
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-lg"
              aria-label="送信"
            >
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Loader className="h-6 w-6 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Send className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </footer>
    );
  }
);
ChatInputFooter.displayName = "ChatInputFooter";

const UnlockScreen = memo(({ onUnlock }: { onUnlock: () => void }) => (
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
          className="bg-white/80 backdrop-blur-md rounded-full px-8 py-4 text-lg font-semibold text-violet-600 shadow-lg flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Play className="w-6 h-6" /> はじめる
        </motion.button>
      </div>
    </motion.div>
  </div>
));
UnlockScreen.displayName = "UnlockScreen";

const initialMessage: Message = {
  id: 0,
  role: "ai",
  text: "こんにちは！わたしはニア。おはなししよう！",
  emotion: "neutral",
};
const CHAT_HISTORY_KEY = "nia-chat-history";

export default function ChatPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>("neutral");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState<Message | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  }, []);

  const handleUnlock = () => {
    if (!audioContextRef.current) {
      try {
        const w = window as {
          AudioContext?: typeof AudioContext;
          webkitAudioContext?: typeof AudioContext;
        };
        const AudioContextClass = w.AudioContext || w.webkitAudioContext;

        if (!AudioContextClass) {
          console.error("AudioContext is not supported in this browser.");
          alert("お使いのブラウザは音声機能に対応していません。");
          return;
        }
        const context = new AudioContextClass();
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        analyser.connect(context.destination);
        audioContextRef.current = context;
        analyserRef.current = analyser;
      } catch (e) {
        console.error("Failed to initialize AudioContext:", e);
      }
    }
    audioContextRef.current?.resume();
    setIsUnlocked(true);
  };

  const playAudio = (audioData: string) => {
    const analyser = analyserRef.current;
    const context = audioContextRef.current;
    if (!analyser || !context || !audioData) return;
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      audioSourceRef.current.stop();
    }
    try {
      const decodedData = window.atob(audioData);
      const buffer = Uint8Array.from(decodedData, (c) =>
        c.charCodeAt(0)
      ).buffer;

      context
        .decodeAudioData(buffer)
        .then((audioBuffer) => {
          const source = context.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(analyser);
          source.start(0);
          audioSourceRef.current = source;
          source.onended = () => {
            setCurrentEmotion("neutral");
            setLiveMessage(null);
            audioSourceRef.current = null;
          };
        })
        .catch((e) => {
          console.error("Error decoding audio data:", e);
          setCurrentEmotion("neutral");
          setLiveMessage(null);
        });
    } catch (e) {
      // 【ここを修正】catchブロックに中括弧を追加
      console.error("Error playing audio:", e);
      setCurrentEmotion("neutral");
      setLiveMessage(null);
    }
  };

  const handleSendMessage = async (input: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setCurrentEmotion("thinking");

    const userMessage: Message = { id: Date.now(), role: "user", text: input };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: messages }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || "APIエラーが発生しました。");
      }

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: data.textResponse,
        emotion: data.emotion,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setLiveMessage(aiMessage);

      setCurrentEmotion((data.emotion as VRMExpressionPresetName) || "happy");
      playAudio(data.audioData);

      const finalHistory = [
        ...newHistory,
        { ...aiMessage, audioData: undefined },
      ];
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(finalHistory));
    } catch (error) {
      console.error("メッセージ処理エラー:", error);
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: "ごめんなさい、少し調子が悪いみたい… もう一度試してみてね。",
        emotion: "sad",
      };
      setMessages((prev) => [...prev, errorMsg]);
      setLiveMessage(errorMsg);
      setCurrentEmotion("sad");
      setTimeout(() => {
        setLiveMessage(null);
        setCurrentEmotion("neutral");
      }, 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (audioSourceRef.current) audioSourceRef.current.stop();
    setMessages([initialMessage]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    setCurrentEmotion("neutral");
    setIsHistoryOpen(false);
    setLiveMessage(null);
  };

  return (
    <main
      className={`w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-gradient-to-br from-sky-100 to-violet-200 ${roundedFont.className}`}
    >
      <AnimatePresence>
        {!isUnlocked && <UnlockScreen onUnlock={handleUnlock} />}
      </AnimatePresence>

      {/* 【ここを修正】破損していたコードを完全な状態に修正 */}
      {isUnlocked && (
        <div className="w-full h-full flex flex-col">
          <header className="w-full p-4 flex-shrink-0 bg-white/30 backdrop-blur-lg z-10 flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-700">ニアとおはなし</h1>
          </header>

          <div className="flex-1 w-full relative min-h-0">
            <div className="absolute inset-0 z-0">
              <VRMCanvas
                emotion={currentEmotion}
                analyser={analyserRef.current}
              />
            </div>

            <AnimatePresence>
              {liveMessage && liveMessage.role === "ai" && (
                <LiveMessageBubble message={liveMessage} />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isLoading && <ThinkingIndicator />}
            </AnimatePresence>
          </div>

          <ChatInputFooter
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onHistoryToggle={() => setIsHistoryOpen(true)}
          />

          <AnimatePresence>
            {isHistoryOpen && (
              <ChatHistoryOverlay
                messages={messages}
                isLoading={isLoading}
                onClose={() => setIsHistoryOpen(false)}
                onReset={handleReset}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}
