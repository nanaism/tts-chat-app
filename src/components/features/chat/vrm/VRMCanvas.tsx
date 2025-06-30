"use client";

import type { VRMExpressionPresetName } from "@pixiv/three-vrm";
import { OrbitControls, Sparkles } from "@react-three/drei"; // ★ Sparklesをインポート
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { memo, Suspense } from "react";
import * as THREE from "three";
import { ModelLoader } from "./ModelLoader";
import { TapEffect } from "./TapEffect";
import { ThinkingOrbs } from "./ThinkingOrbs"; // ★ ThinkingOrbsをインポート
import { VRMViewer } from "./VRMViewer";

type Emotion = VRMExpressionPresetName | "thinking";

type Props = {
  emotion: Emotion;
  analyser: AnalyserNode | null;
  isSpeaking: boolean;
  isLoading: boolean; // ★ isLoadingを受け取る
  onHeadClick: (event: ThreeEvent<MouseEvent>) => void;
  effects: Array<{ id: number; position: THREE.Vector3 }>;
  onEffectComplete: (id: number) => void;
};

export const VRMCanvas = memo(
  ({
    emotion,
    analyser,
    isSpeaking,
    isLoading,
    onHeadClick,
    effects,
    onEffectComplete,
  }: Props) => {
    return (
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 1.5], fov: 25 }}
        className="w-full h-full touch-none"
        dpr={[1, 1.5]}
      >
        {/* ★★★ ここからが修正点 ★★★ */}
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

          {/* ★★★ ここからが修正点 ★★★ */}
          {isLoading && (
            <>
              <ThinkingOrbs />
              <Sparkles
                count={100}
                scale={1.5}
                size={20}
                speed={0.4}
                color="#fff"
              />
            </>
          )}
          {/* ★★★ ここまで ★★★ */}
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
