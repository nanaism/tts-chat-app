// src/components/features/chat/ChatClient.tsx

"use client";

import type { VRMExpressionPresetName } from "@pixiv/three-vrm";
import type { ThreeEvent } from "@react-three/fiber";
import { AnimatePresence } from "framer-motion";
import type { Session } from "next-auth";
import { Kiwi_Maru } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

// 分割したコンポーネントをインポート
import { ControlBarFooter } from "@/components/features/chat/controllers/ControlBarFooter";
import { SettingsDialog } from "@/components/features/chat/controllers/SettingsDialog";
import { UnlockScreen } from "@/components/features/chat/controllers/UnlockScreen";
import { ChatHistoryOverlay } from "@/components/features/chat/ui/ChatHistoryOverlay";
import { LiveMessageBubble } from "@/components/features/chat/ui/LiveMessageBubble";
import { ThinkingUI } from "@/components/features/chat/ui/ThinkingUI";
import { VRMCanvas } from "@/components/features/chat/vrm/VRMCanvas";

// --- 型定義 ---
type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
  audioData?: string;
  audioUrl?: string;
  emotion?: Emotion;
};
type Emotion = VRMExpressionPresetName | "thinking";
interface CustomWindow {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}
type Props = {
  session: Session;
};

// --- 定数と初期化関数 ---
const cuteFont = Kiwi_Maru({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});
const THINK_MODE_KEY = "near-think-mode";

const initialMessages = [
  {
    text: "こんにちは！わたしはニア。おはなししよう！",
    emotion: "happy" as Emotion,
    audioUrl: "/sounds/greeting1.wav",
  },
  {
    text: "今日どんなことがあったの？ニアに教えてくれるとうれしいな！",
    emotion: "happy" as Emotion,
    audioUrl: "/sounds/greeting2.wav",
  },
  {
    text: "やっほー！君が来てくれるの、ずっと待ってたんだ！さっそくおしゃべりしよっ！",
    emotion: "happy" as Emotion,
    audioUrl: "/sounds/greeting4.wav",
  },
];
const goodbyeMessages = [
  {
    text: "またね！いつでも待ってるからね！",
    emotion: "happy" as Emotion,
    audioUrl: "/sounds/goodbye1.wav",
  },
  {
    text: "バイバイ！次のおはなしも楽しみにしてるね！",
    emotion: "happy" as Emotion,
    audioUrl: "/sounds/goodbye2.wav",
  },
  {
    text: "じゃあね！また会いに来てね～！",
    emotion: "happy" as Emotion,
    audioUrl: "/sounds/goodbye3.wav",
  },
];

const createInitialMessage = (): Message => {
  const randomIndex = Math.floor(Math.random() * initialMessages.length);
  return { id: 0, role: "ai", ...initialMessages[randomIndex] };
};
const createGoodbyeMessage = (): Message => {
  const randomIndex = Math.floor(Math.random() * goodbyeMessages.length);
  return { id: Date.now(), role: "ai", ...goodbyeMessages[randomIndex] };
};

// ★★★ ここからが新しい子コンポーネント ★★★
// すべてのフックとロジックをこのコンポーネントに移動
function ChatInterface({ session }: Props) {
  // Hooks can be called safely here at the top level.
  const userId = session.user!.id!; // Parent component guarantees user.id exists.
  const isDemo = userId === "demo-user";

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isNewSession, setIsNewSession] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [thinkMode, setThinkMode] = useState<"fast" | "slow">("slow");
  const [liveMessage, setLiveMessage] = useState<Message | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [baseEmotion, setBaseEmotion] = useState<Emotion>("neutral");
  const [interactionEmotion, setInteractionEmotion] = useState<Emotion | null>(
    null
  );
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [effects, setEffects] = useState<
    Array<{ id: number; position: THREE.Vector3 }>
  >([]);
  const currentEmotion = interactionEmotion || baseEmotion;
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(THINK_MODE_KEY);
      if (savedMode === "fast" || savedMode === "slow") {
        setThinkMode(savedMode as "fast" | "slow");
      }
    } catch (e) {
      console.error("Failed to access localStorage for think mode:", e);
    }
  }, []);

  useEffect(() => {
    if (isDemo) {
      setMessages([createInitialMessage()]);
      setIsNewSession(true);
      return;
    }
    if (userId) {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`/api/conversations?childId=${userId}`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error("Failed to fetch history");
          const history: {
            content: string;
            role: "user" | "ai";
            emotion?: Emotion;
          }[] = await res.json();
          if (history.length > 0) {
            setMessages(
              history.map((msg, index) => ({
                id: Date.now() + index,
                role: msg.role,
                text: msg.content,
                emotion: msg.emotion,
              }))
            );
            setIsNewSession(false);
          } else {
            setMessages([createInitialMessage()]);
            setIsNewSession(true);
          }
        } catch (error) {
          console.error("Failed to fetch history, starting fresh.", error);
          setMessages([createInitialMessage()]);
        }
      };
      fetchHistory();
    }
  }, [userId, isDemo]);

  const handleSetThinkMode = (mode: "fast" | "slow") => {
    setThinkMode(mode);
    try {
      localStorage.setItem(THINK_MODE_KEY, mode);
    } catch (e) {
      console.error("Failed to save think mode to localStorage:", e);
    }
  };

  const playAudio = useCallback((audioSrc: string, onEnd?: () => void) => {
    const analyser = analyserRef.current;
    const context = audioContextRef.current;
    if (!analyser || !context || !audioSrc) {
      onEnd?.();
      return;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      audioSourceRef.current.stop();
    }

    const playDecodedBuffer = (buffer: ArrayBuffer) => {
      context
        .decodeAudioData(buffer)
        .then((audioBuffer) => {
          const source = context.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(analyser);
          source.start(0);
          setIsSpeaking(true);
          audioSourceRef.current = source;
          source.onended = () => {
            setIsSpeaking(false);
            audioSourceRef.current = null;
            onEnd?.();
          };
        })
        .catch((e) => {
          console.error("Error decoding audio data:", e);
          setIsSpeaking(false);
          onEnd?.();
        });
    };

    const fetchAndPlay = (url: string) => {
      fetch(url)
        .then((res) => res.arrayBuffer())
        .then(playDecodedBuffer)
        .catch((e) => {
          console.error("Error fetching audio:", e);
          setIsSpeaking(false);
          onEnd?.();
        });
    };

    if (audioSrc.startsWith("data:audio/")) {
      fetchAndPlay(audioSrc);
    } else if (audioSrc.startsWith("/")) {
      fetchAndPlay(audioSrc);
    } else {
      fetchAndPlay(`data:audio/wav;base64,${audioSrc}`);
    }
  }, []);

  const handleUnlock = async () => {
    if (!audioContextRef.current) {
      try {
        const w = window as CustomWindow;
        const AudioContextClass = w.AudioContext || w.webkitAudioContext;
        if (!AudioContextClass) {
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
    try {
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
    } catch (e) {
      console.error("Failed to resume AudioContext:", e);
    }
    setIsUnlocked(true);
  };

  useEffect(() => {
    if (isUnlocked && isNewSession && !isSpeaking && messages.length > 0) {
      const firstMessage = messages[0];
      if (firstMessage.role === "ai" && firstMessage.audioUrl) {
        setBaseEmotion(firstMessage.emotion || "happy");
        setLiveMessage(firstMessage);
        playAudio(firstMessage.audioUrl, () => {
          setTimeout(() => {
            setBaseEmotion("neutral");
            setLiveMessage(null);
          }, 1000);
        });
        setIsNewSession(false);
      }
    }
  }, [isUnlocked, isNewSession, isSpeaking, messages, playAudio]);

  const handleSendMessage = async (input: string) => {
    if (isLoading || !userId) return;
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    setInteractionEmotion(null);
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      audioSourceRef.current.stop();
    }
    setLiveMessage(null);
    setIsSpeaking(false);
    setIsLoading(true);
    setBaseEmotion("thinking");

    const userMessage: Message = { id: Date.now(), role: "user", text: input };
    const currentHistory = messages;
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          childId: isDemo ? null : userId,
          history: isDemo
            ? currentHistory
                .map((m) => ({ role: m.role, text: m.text }))
                .slice(-10)
            : null,
          mode: thinkMode,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error)
        throw new Error(data.error?.message || "APIエラーが発生しました。");
      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: data.textResponse,
        emotion: data.emotion,
        audioData: data.audioData,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLiveMessage(aiMessage);
      setBaseEmotion((data.emotion as Emotion) || "happy");
      if (data.audioData) {
        playAudio(data.audioData, () => {
          setTimeout(() => {
            setBaseEmotion("neutral");
            setLiveMessage(null);
          }, 1000);
        });
      }
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
      setBaseEmotion("sad");
      setTimeout(() => {
        setLiveMessage(null);
        setBaseEmotion("neutral");
      }, 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeadClick = (event: ThreeEvent<MouseEvent>) => {
    setEffects((prev) => [
      ...prev,
      { id: Date.now(), position: event.point.clone() },
    ]);
    if (isSpeaking) return;
    if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current);
    setInteractionEmotion("happy");
    interactionTimerRef.current = setTimeout(() => {
      setInteractionEmotion(null);
      interactionTimerRef.current = null;
    }, 2500);
  };

  const handleEffectComplete = (id: number) => {
    setEffects((prev) => prev.filter((effect) => effect.id !== id));
  };

  const handleReset = async () => {
    if (isLoading || isDemo || !userId) return;
    if (
      !window.confirm(
        "今までのニアとのおはなしを全部わすれちゃうけど、ほんとうにだいじょうぶ？"
      )
    )
      return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversations?childId=${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("履歴のリセットに失敗しました。");
      if (audioSourceRef.current) audioSourceRef.current.stop();
      setIsSpeaking(false);
      setMessages([createInitialMessage()]);
      setBaseEmotion("neutral");
      setIsHistoryOpen(false);
      setLiveMessage(null);
      setIsNewSession(true);
    } catch (error) {
      console.error("Reset failed:", error);
      alert(
        "ごめんなさい、おはなしの記憶を消すのに失敗しちゃった…。もう一度試してみてね。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = () => {
    if (isLoading) return;
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
    setBaseEmotion("happy");
    setInteractionEmotion(null);
    const goodbyeMessage = createGoodbyeMessage();
    setLiveMessage(goodbyeMessage);

    const onEnd = () => {
      setIsUnlocked(false);
      if (isDemo) {
        window.location.reload();
      }
    };
    if (goodbyeMessage.audioUrl) {
      playAudio(goodbyeMessage.audioUrl, () => setTimeout(onEnd, 500));
    } else {
      setTimeout(onEnd, 1000);
    }
  };

  return (
    <main
      className={`${cuteFont.className} w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col bg-gradient-to-br from-sky-100 to-violet-200`}
    >
      <AnimatePresence>
        {!isUnlocked && <UnlockScreen onUnlock={handleUnlock} />}
      </AnimatePresence>
      {isUnlocked && (
        <div className="w-full h-full flex flex-col z-10">
          <header className="w-full p-3 flex-shrink-0 bg-white/20 backdrop-blur-lg z-10 flex items-center justify-center border-b border-white/20">
            <h1 className="text-xl font-bold text-gray-800">ニアとおはなし</h1>
          </header>
          <div className="flex-1 w-full relative min-h-0">
            <div className="absolute inset-0 z-0">
              <VRMCanvas
                isLoading={isLoading}
                emotion={currentEmotion}
                analyser={analyserRef.current}
                isSpeaking={isSpeaking}
                onHeadClick={handleHeadClick}
                effects={effects}
                onEffectComplete={handleEffectComplete}
              />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
              <AnimatePresence>
                {liveMessage && liveMessage.role === "ai" && (
                  <LiveMessageBubble message={liveMessage} />
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>{isLoading && <ThinkingUI />}</AnimatePresence>
          </div>
          <ControlBarFooter
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onHistoryClick={() => setIsHistoryOpen(true)}
            onEndCallClick={handleEndCall}
            onSettingsClick={() => setIsSettingsOpen(true)}
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
          <SettingsDialog
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            thinkMode={thinkMode}
            setThinkMode={handleSetThinkMode}
          />
        </div>
      )}
    </main>
  );
}

// ★★★ ここがメインの親コンポーネント ★★★
// sessionをチェックし、問題なければ子コンポーネントをレンダリングする
export function ChatClient({ session }: Props) {
  if (!session.user?.id) {
    // このガード節により、子コンポーネントがレンダリングされるときには
    // 常に session.user.id が存在することが保証される
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <p>エラー: ユーザー情報が見つかりません。</p>
      </div>
    );
  }

  // チェックを通過したら、すべてのフックとロジックを含む子コンポーネントをレンダリング
  return <ChatInterface session={session} />;
}
