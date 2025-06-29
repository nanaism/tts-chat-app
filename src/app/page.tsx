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
import { Canvas, ThreeEvent, useFrame, useLoader } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  History,
  Loader,
  Phone,
  PhoneOff,
  Send,
  Sparkles,
  Star,
  Trash,
  X,
} from "lucide-react";
import { Kiwi_Maru } from "next/font/google";
import {
  KeyboardEvent,
  memo,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import {
  GLTFLoader,
  GLTFParser,
} from "three/examples/jsm/loaders/GLTFLoader.js";

const cuteFont = Kiwi_Maru({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

// ★★★【変更点 1】★★★ 起動時のランダムメッセージと音声ファイルのリストを定義
// public/sounds/ に配置した実際のファイル名に合わせてください。
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

// ★★★【変更点 2】★★★ 終了時の音声もファイルパスで指定
// ★★★【変更点 1】★★★ 終了時の音声URLを削除し、メッセージのリストを定義
// const GOODBYE_AUDIO_URL = "/sounds/goodbye.wav"; // ← この行を削除またはコメントアウト

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
    audioUrl: "/sounds/goodbye3.wav", // public/sounds/ に配置したファイル名に合わせる
  },
];

type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
  audioData?: string; // APIからのBase64音声
  audioUrl?: string; // ローカルの音声ファイルパス
  emotion?: Emotion;
};
type Emotion = VRMExpressionPresetName | "thinking";

interface CustomWindow {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

const TapEffect = ({
  id,
  position,
  onComplete,
}: {
  id: number;
  position: THREE.Vector3;
  onComplete: (id: number) => void;
}) => {
  const groupRef = useRef<THREE.Group>(null!);

  const particles = useMemo(() => {
    const particleCount = 20;
    const initialSpeed = 0.4;
    const lifetime = 0.4;

    return Array.from({ length: particleCount }).map(() => {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      )
        .normalize()
        .multiplyScalar(initialSpeed * (Math.random() * 0.5 + 0.5));

      const particleLifetime = lifetime * (Math.random() * 0.7 + 0.3);

      return {
        velocity,
        color: new THREE.Color().setHSL(Math.random(), 1.0, 0.5),
        lifetime: particleLifetime,
        initialLifetime: particleLifetime,
        scale: Math.random() * 0.04 + 0.02,
        currentPosition: new THREE.Vector3(),
      };
    });
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    let allParticlesDead = true;

    particles.forEach((p, i) => {
      const mesh = groupRef.current.children[i] as THREE.Mesh;
      if (!mesh || p.lifetime <= 0) {
        if (mesh) mesh.visible = false;
        return;
      }

      allParticlesDead = false;
      p.lifetime -= delta;

      p.velocity.multiplyScalar(0.95);
      p.velocity.y -= 9.8 * delta * 0.15;

      p.currentPosition.add(p.velocity.clone().multiplyScalar(delta));
      mesh.position.copy(p.currentPosition);

      const lifePercent = Math.max(0, p.lifetime / p.initialLifetime);
      const currentScale = p.scale * Math.sin(lifePercent * Math.PI);
      mesh.scale.set(currentScale, currentScale, currentScale);
    });

    if (allParticlesDead) {
      onComplete(id);
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.1, 6, 6]} />
          <meshBasicMaterial
            color={p.color}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

const ModelLoader = () => {
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

// ★★★【修正点 1】★★★ 'Sorrow' を 'Sad' に修正した完全なVRMViewerコンポーネント
const VRMViewer = memo(
  ({
    emotion,
    analyser,
    isSpeaking,
    onHeadClick,
  }: {
    emotion: Emotion;
    analyser: AnalyserNode | null;
    isSpeaking: boolean;
    onHeadClick: (event: ThreeEvent<MouseEvent>) => void;
  }) => {
    const gltf = useLoader(GLTFLoader, "/avatar.vrm", (loader) => {
      loader.register((parser: GLTFParser) => new VRMLoaderPlugin(parser));
    });
    const vrmRef = useRef<VRM | null>(null);
    const restingArmRad = useRef(Math.PI * (-70 / 180));
    const interactionRef = useRef<THREE.Mesh>(null);

    const startTimeRef = useRef(0);

    const blinkState = useRef({
      isBlinking: false,
      lastBlinkTime: 0,
      nextBlinkDelay: 3.0,
    });

    useEffect(() => {
      if (!gltf.userData.vrm) return;
      const vrm = gltf.userData.vrm;
      vrmRef.current = vrm;

      vrm.humanoid
        .getNormalizedBoneNode(VRMHumanBoneName.Head)!
        .rotation.set(0, 0, 0);
      vrm.humanoid
        .getNormalizedBoneNode(VRMHumanBoneName.Neck)!
        .rotation.set(0, 0, 0);
      vrm.humanoid
        .getNormalizedBoneNode(VRMHumanBoneName.Spine)!
        .rotation.set(0, 0, 0);

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

    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          if (vrmRef.current?.springBoneManager) {
            vrmRef.current.springBoneManager.reset();
          }
          startTimeRef.current = 0;
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }, []);

    useFrame((state, delta) => {
      const clampedDelta = Math.min(delta, 1 / 20);

      const vrm = vrmRef.current;
      if (!vrm?.expressionManager || !vrm.humanoid) return;

      const manager = vrm.expressionManager;
      const humanoid = vrm.humanoid;
      const clockTime = state.clock.elapsedTime;
      const head = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Head);
      const neck = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Neck);
      const spine = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Spine);
      const chest = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Chest);

      const breathingCycle = Math.sin(clockTime * 0.8);
      const breathingAmount = ((breathingCycle + 1) / 2) * 0.04;

      if (startTimeRef.current === 0) {
        startTimeRef.current = clockTime;
        blinkState.current.lastBlinkTime = 0;
      }
      const elapsedTime = clockTime - startTimeRef.current;

      if (head && interactionRef.current) {
        const headPosition = new THREE.Vector3();
        head.getWorldPosition(headPosition);
        interactionRef.current.position.copy(headPosition);
        interactionRef.current.position.y += 0.15;
      }

      if (emotion === "thinking") {
        manager.setValue(VRMExpressionPresetName.Blink, 1.0);
      } else {
        let blinkValue = 0;
        const blinkManager = blinkState.current;
        const blinkDuration = 0.1;

        if (blinkManager.isBlinking) {
          const progress =
            (elapsedTime - blinkManager.lastBlinkTime) / blinkDuration;
          if (progress >= 1) {
            blinkManager.isBlinking = false;
            blinkValue = 0;
          } else {
            blinkValue = Math.sin(progress * Math.PI);
          }
        } else {
          if (
            elapsedTime - blinkManager.lastBlinkTime >
            blinkManager.nextBlinkDelay
          ) {
            blinkManager.isBlinking = true;
            blinkManager.lastBlinkTime = elapsedTime;
            blinkManager.nextBlinkDelay = 2.0 + Math.random() * 5.0;
          }
        }
        manager.setValue(VRMExpressionPresetName.Blink, blinkValue);
      }

      if (emotion === "thinking") {
        if (gltf.scene)
          gltf.scene.position.y = THREE.MathUtils.lerp(
            gltf.scene.position.y,
            -0.1,
            clampedDelta * 3.0
          );
        if (head) {
          head.rotation.x = THREE.MathUtils.lerp(
            head.rotation.x,
            0,
            clampedDelta * 2.0
          );
          head.rotation.y = THREE.MathUtils.lerp(
            head.rotation.y,
            0,
            clampedDelta * 2.0
          );
          head.rotation.z = THREE.MathUtils.lerp(
            head.rotation.z,
            Math.PI / 18,
            clampedDelta * 3.0
          );
        }
        if (neck)
          neck.rotation.y = THREE.MathUtils.lerp(
            neck.rotation.y,
            0,
            clampedDelta * 2.0
          );

        if (spine)
          spine.rotation.y = THREE.MathUtils.lerp(
            spine.rotation.y,
            Math.sin(clockTime * 0.3) * 0.1,
            clampedDelta * 2.0
          );

        if (chest) {
          chest.rotation.x = THREE.MathUtils.lerp(
            chest.rotation.x,
            breathingAmount,
            clampedDelta * 2.0
          );
        }

        manager.setValue(VRMExpressionPresetName.Happy, 0);
        manager.setValue(
          VRMExpressionPresetName.Neutral,
          THREE.MathUtils.lerp(
            manager.getValue(VRMExpressionPresetName.Neutral) ?? 0,
            0.5,
            clampedDelta * 5.0
          )
        );
        manager.setValue(
          VRMExpressionPresetName.Oh,
          THREE.MathUtils.lerp(
            manager.getValue(VRMExpressionPresetName.Oh) ?? 0,
            0.15,
            clampedDelta * 5.0
          )
        );
        // 'Sorrow' を 'Sad' に変更
        manager.setValue(
          VRMExpressionPresetName.Sad,
          THREE.MathUtils.lerp(
            manager.getValue(VRMExpressionPresetName.Sad) ?? 0,
            0.3,
            clampedDelta * 5.0
          )
        );
        manager.setValue(VRMExpressionPresetName.Aa, 0);
      } else {
        // 'Sad' プリセットを元に戻す
        manager.setValue(VRMExpressionPresetName.Sad, 0);

        if (head)
          head.rotation.z = THREE.MathUtils.lerp(
            head.rotation.z,
            0,
            clampedDelta * 3.0
          );

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
            clampedDelta * 5.0
          );
          leftUpperArm.rotation.z = THREE.MathUtils.lerp(
            leftUpperArm.rotation.z,
            restingArmRad.current,
            clampedDelta * 5.0
          );
        }

        for (const preset of Object.values(VRMExpressionPresetName)) {
          if (
            typeof preset !== "string" ||
            preset === VRMExpressionPresetName.Blink ||
            preset === VRMExpressionPresetName.Sad // Sadは個別管理なので除外
          )
            continue;
          const targetWeight = preset === emotion ? 1.0 : 0.0;
          const currentWeight = manager.getValue(preset) ?? 0.0;
          manager.setValue(
            preset,
            THREE.MathUtils.lerp(
              currentWeight,
              targetWeight,
              clampedDelta * 10.0
            )
          );
        }

        if (isSpeaking && analyser) {
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          const volume = data.reduce((a, b) => a + b, 0) / data.length;
          manager.setValue(
            VRMExpressionPresetName.Aa,
            Math.min(1.0, (volume / 100) ** 1.5)
          );

          const lerpFactor = clampedDelta * 2.0;
          let targetChestRotationX = 0;

          switch (emotion) {
            case VRMExpressionPresetName.Happy:
              if (gltf.scene)
                gltf.scene.position.y = THREE.MathUtils.lerp(
                  gltf.scene.position.y,
                  -0.1 + Math.abs(Math.sin(elapsedTime * 2.5) * 0.02),
                  lerpFactor
                );
              if (spine)
                spine.rotation.y = THREE.MathUtils.lerp(
                  spine.rotation.y,
                  Math.sin(elapsedTime * 1.8) * 0.15,
                  lerpFactor
                );
              if (head)
                head.rotation.x = THREE.MathUtils.lerp(
                  head.rotation.x,
                  Math.sin(elapsedTime * 1.8) * 0.08,
                  lerpFactor
                );
              break;
            case VRMExpressionPresetName.Sad:
              targetChestRotationX = 0.15;
              if (head)
                head.rotation.x = THREE.MathUtils.lerp(
                  head.rotation.x,
                  0.1,
                  lerpFactor
                );
              break;
            default:
              if (gltf.scene)
                gltf.scene.position.y = THREE.MathUtils.lerp(
                  gltf.scene.position.y,
                  -0.1 + Math.sin(elapsedTime * 0.5) * 0.01,
                  lerpFactor
                );
              if (spine)
                spine.rotation.y = THREE.MathUtils.lerp(
                  spine.rotation.y,
                  0,
                  lerpFactor
                );
              if (head)
                head.rotation.x = THREE.MathUtils.lerp(
                  head.rotation.x,
                  0,
                  lerpFactor
                );
              break;
          }
          if (chest) {
            chest.rotation.x = THREE.MathUtils.lerp(
              chest.rotation.x,
              targetChestRotationX + breathingAmount,
              lerpFactor
            );
          }
        } else {
          manager.setValue(VRMExpressionPresetName.Aa, 0);

          const INITIAL_DELAY = 1.0;
          const lerpFactor = clampedDelta * 1.5;

          if (elapsedTime < INITIAL_DELAY) {
            if (gltf.scene)
              gltf.scene.position.y = THREE.MathUtils.lerp(
                gltf.scene.position.y,
                -0.1,
                lerpFactor
              );
            if (spine)
              spine.rotation.y = THREE.MathUtils.lerp(
                spine.rotation.y,
                0,
                lerpFactor
              );
            if (neck)
              neck.rotation.y = THREE.MathUtils.lerp(
                neck.rotation.y,
                0,
                lerpFactor
              );
            if (head)
              head.rotation.x = THREE.MathUtils.lerp(
                head.rotation.x,
                0,
                lerpFactor
              );
          } else {
            const animationTime = elapsedTime - INITIAL_DELAY;
            const targetFloatY = -0.1 + Math.sin(animationTime * 0.5) * 0.012;
            const targetSpineY =
              Math.sin(animationTime * 0.4) * 0.15 +
              Math.sin(animationTime * 0.25) * 0.1;
            const targetNeckY =
              Math.sin(animationTime * 0.6) * 0.3 +
              Math.sin(animationTime * 0.8) * 0.2;
            const targetHeadX = Math.sin(animationTime * 0.55) * 0.08;

            if (gltf.scene)
              gltf.scene.position.y = THREE.MathUtils.lerp(
                gltf.scene.position.y,
                targetFloatY,
                lerpFactor
              );
            if (spine)
              spine.rotation.y = THREE.MathUtils.lerp(
                spine.rotation.y,
                targetSpineY,
                lerpFactor
              );
            if (neck)
              neck.rotation.y = THREE.MathUtils.lerp(
                neck.rotation.y,
                targetNeckY,
                lerpFactor
              );
            if (head)
              head.rotation.x = THREE.MathUtils.lerp(
                head.rotation.x,
                targetHeadX,
                lerpFactor
              );

            if (chest) {
              chest.rotation.x = THREE.MathUtils.lerp(
                chest.rotation.x,
                breathingAmount,
                lerpFactor
              );
            }
          }
        }
      }
      vrm.update(clampedDelta);
    });

    return (
      <>
        <primitive object={gltf.scene} position={[0, -0.1, 0]} />
        <mesh
          ref={interactionRef}
          onClick={(e) => {
            e.stopPropagation();
            onHeadClick(e);
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </>
    );
  }
);
VRMViewer.displayName = "VRMViewer";

const VRMCanvas = memo(
  ({
    emotion,
    analyser,
    isSpeaking,
    onHeadClick,
    effects,
    onEffectComplete,
  }: {
    emotion: Emotion;
    analyser: AnalyserNode | null;
    isSpeaking: boolean;
    onHeadClick: (event: ThreeEvent<MouseEvent>) => void;
    effects: Array<{ id: number; position: THREE.Vector3 }>;
    onEffectComplete: (id: number) => void;
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
          <VRMViewer
            emotion={emotion}
            analyser={analyser}
            isSpeaking={isSpeaking}
            onHeadClick={onHeadClick}
          />
          {effects.map((effect) => (
            <TapEffect
              key={effect.id}
              id={effect.id}
              position={effect.position}
              onComplete={onEffectComplete}
            />
          ))}
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
              <Trash size={20} />
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
    <div className="absolute inset-x-0 bottom-0 p-4 pb-6 flex flex-col items-center justify-end pointer-events-none z-10">
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
        className="relative max-w-sm md:max-w-md bg-white/80 backdrop-blur-lg rounded-2xl p-4 text-center text-gray-800 shadow-xl pointer-events-auto"
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

const ControlBarFooter = memo(
  ({
    onSendMessage,
    onHistoryClick,
    onEndCallClick,
    isLoading,
  }: {
    onSendMessage: (input: string) => void;
    onHistoryClick: () => void;
    onEndCallClick: () => void;
    isLoading: boolean;
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
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onHistoryClick}
              disabled={isLoading}
              className="rounded-full text-gray-600 w-6 h-6"
              aria-label="履歴を表示"
            >
              <History size={26} />
            </Button>
          </motion.div>

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
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              type="button"
              onClick={onEndCallClick}
              disabled={isLoading}
              className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
              aria-label="おはなしをやめる"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      </footer>
    );
  }
);
ControlBarFooter.displayName = "ControlBarFooter";

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
          // ↓ tailwindのbg-gradient-to-br...が親divの背景色に負けているので、relative+z-10で重ね順を上げる
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
  </div>
));
UnlockScreen.displayName = "UnlockScreen";

const CHAT_HISTORY_KEY = "near-chat-history";

// ★★★【変更点 3】★★★ ランダムな初回メッセージを生成するヘルパー関数
const createInitialMessage = (): Message => {
  const randomIndex = Math.floor(Math.random() * initialMessages.length);
  const selectedMessage = initialMessages[randomIndex];
  return {
    id: 0,
    role: "ai",
    text: selectedMessage.text,
    emotion: selectedMessage.emotion,
    audioUrl: selectedMessage.audioUrl,
  };
};

// ★★★【変更点 2】★★★ ランダムな終了メッセージを生成するヘルパー関数を追加
const createGoodbyeMessage = (): Message => {
  const randomIndex = Math.floor(Math.random() * goodbyeMessages.length);
  const selectedMessage = goodbyeMessages[randomIndex];
  return {
    id: Date.now(), // IDはその都度生成
    role: "ai",
    text: selectedMessage.text,
    emotion: selectedMessage.emotion,
    audioUrl: selectedMessage.audioUrl,
  };
};

export default function ChatPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isNewSession, setIsNewSession] = useState(true);
  const [messages, setMessages] = useState<Message[]>(() => [
    createInitialMessage(),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setIsNewSession(false);
        }
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  }, []);

  // ★★★【修正点 2】★★★ `playAudio` 関数をコンポーネントのトップレベルに一度だけ定義
  const playAudio = (audioSrc: string, onEnd?: () => void) => {
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

    if (audioSrc.startsWith("/") || audioSrc.startsWith("http")) {
      fetch(audioSrc)
        .then((response) => {
          if (!response.ok) throw new Error("Audio file not found");
          return response.arrayBuffer();
        })
        .then(playDecodedBuffer)
        .catch((e) => {
          console.error("Error fetching audio:", e);
          setIsSpeaking(false);
          onEnd?.();
        });
    } else {
      try {
        const decodedData = window.atob(audioSrc);
        const buffer = Uint8Array.from(decodedData, (c) =>
          c.charCodeAt(0)
        ).buffer;
        playDecodedBuffer(buffer);
      } catch (e) {
        console.error("Error playing base64 audio:", e);
        setIsSpeaking(false);
        onEnd?.();
      }
    }
  };

  // ★★★【修正点 3】★★★ `handleUnlock` の構造をクリーンアップ
  const handleUnlock = () => {
    if (!audioContextRef.current) {
      try {
        const w = window as CustomWindow;
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

    if (isNewSession && !isSpeaking) {
      const firstMessage = messages[0];
      if (firstMessage?.audioUrl) {
        setBaseEmotion(firstMessage.emotion || "happy");
        setLiveMessage(firstMessage);

        // ★★★【変更点】★★★ 発話後の状態リセットをsetTimeoutで1秒遅らせる
        playAudio(firstMessage.audioUrl, () => {
          setTimeout(() => {
            setBaseEmotion("neutral");
            setLiveMessage(null);
          }, 1000); // 1秒のクールダウンを追加
        });

        setIsNewSession(false);
      }
    }
  };

  const handleSendMessage = async (input: string) => {
    if (isLoading) return;

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
        audioData: data.audioData,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setLiveMessage(aiMessage);

      setBaseEmotion((data.emotion as Emotion) || "happy");
      if (data.audioData) {
        playAudio(data.audioData, () => {
          // 発話後のクールダウン
          setTimeout(() => {
            setBaseEmotion("neutral");
            setLiveMessage(null);
          }, 1000);
        });
      }

      const finalHistory = [
        ...newHistory,
        { ...aiMessage, audioData: undefined, audioUrl: undefined },
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
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    setInteractionEmotion("happy");
    interactionTimerRef.current = setTimeout(() => {
      setInteractionEmotion(null);
      interactionTimerRef.current = null;
    }, 2500);
  };

  const handleEffectComplete = (id: number) => {
    setEffects((prev) => prev.filter((effect) => effect.id !== id));
  };

  const handleReset = () => {
    if (audioSourceRef.current) audioSourceRef.current.stop();
    setIsSpeaking(false);
    setMessages([createInitialMessage()]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    setBaseEmotion("neutral");
    setIsHistoryOpen(false);
    setLiveMessage(null);
    setIsNewSession(true); // リセット時は新規セッションに戻す
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

    if (goodbyeMessage.audioUrl) {
      playAudio(goodbyeMessage.audioUrl, () => {
        setTimeout(() => {
          setIsUnlocked(false);
          handleReset();
        }, 500);
      });
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
          <header
            className={` w-full p-3 flex-shrink-0 bg-white/20 backdrop-blur-lg z-10 flex items-center justify-center border-b border-white/20`}
          >
            <h1 className="text-xl font-bold text-gray-800">ニアとおはなし</h1>
          </header>

          <div className="flex-1 w-full relative min-h-0">
            <div className="absolute inset-0 z-0">
              <VRMCanvas
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

            <AnimatePresence>
              {isLoading && <ThinkingIndicator />}
            </AnimatePresence>
          </div>

          <ControlBarFooter
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onHistoryClick={() => setIsHistoryOpen(true)}
            onEndCallClick={handleEndCall}
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
