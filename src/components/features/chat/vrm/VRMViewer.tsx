"use client";

import {
  VRM,
  VRMExpressionPresetName,
  VRMHumanBoneName,
  VRMLoaderPlugin,
} from "@pixiv/three-vrm";
import { ThreeEvent, useFrame, useLoader } from "@react-three/fiber";
import { memo, useEffect, useRef } from "react";
import * as THREE from "three";
import {
  GLTFLoader,
  GLTFParser,
} from "three/examples/jsm/loaders/GLTFLoader.js";

type Emotion = VRMExpressionPresetName | "thinking";

type Props = {
  emotion: Emotion;
  analyser: AnalyserNode | null;
  isSpeaking: boolean;
  onHeadClick: (event: ThreeEvent<MouseEvent>) => void;
};

export const VRMViewer = memo(
  ({ emotion, analyser, isSpeaking, onHeadClick }: Props) => {
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
        if (
          document.visibilityState === "visible" &&
          vrmRef.current?.springBoneManager
        ) {
          vrmRef.current.springBoneManager.reset();
          startTimeRef.current = 0;
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () =>
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
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

      // --- 1. 表情(Expression)の制御 ---
      if (emotion !== "sad") {
        manager.setValue(VRMExpressionPresetName.Sad, 0);
      }
      if (isSpeaking && analyser) {
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
      let blinkValue = 0;
      const blinkManager = blinkState.current;
      if (blinkManager.isBlinking) {
        const progress = (elapsedTime - blinkManager.lastBlinkTime) / 0.1;
        if (progress >= 1) {
          blinkManager.isBlinking = false;
          blinkValue = 0;
        } else {
          blinkValue = Math.sin(progress * Math.PI);
        }
      } else if (
        elapsedTime - blinkManager.lastBlinkTime >
        blinkManager.nextBlinkDelay
      ) {
        blinkManager.isBlinking = true;
        blinkManager.lastBlinkTime = elapsedTime;
        blinkManager.nextBlinkDelay = 2.0 + Math.random() * 5.0;
      }
      manager.setValue(VRMExpressionPresetName.Blink, blinkValue);

      for (const preset of Object.values(VRMExpressionPresetName)) {
        if (
          typeof preset !== "string" ||
          preset === VRMExpressionPresetName.Blink ||
          preset === VRMExpressionPresetName.Aa
        )
          continue;
        let targetWeight = 0.0;
        if (emotion === "sad") {
          if (preset === VRMExpressionPresetName.Sad) targetWeight = 1.0;
        } else if (emotion === "thinking") {
          if (preset === VRMExpressionPresetName.Neutral) targetWeight = 0.5;
          if (preset === VRMExpressionPresetName.Oh) targetWeight = 0.15;
        } else {
          targetWeight = preset === emotion ? 1.0 : 0.0;
        }
        const currentWeight = manager.getValue(preset) ?? 0.0;
        manager.setValue(
          preset,
          THREE.MathUtils.lerp(currentWeight, targetWeight, clampedDelta * 8.0)
        );
      }

      // --- 2. 体の動き(Animation)の制御 ---
      const lerpFactor = clampedDelta * 2.0;
      if (chest) {
        chest.rotation.x = THREE.MathUtils.lerp(
          chest.rotation.x,
          Math.sin(clockTime * 0.6) * 0.015,
          lerpFactor
        );
      }

      switch (emotion) {
        case "sad":
          if (head) {
            head.rotation.x = THREE.MathUtils.lerp(
              head.rotation.x,
              0.25,
              lerpFactor
            );
            head.rotation.y = THREE.MathUtils.lerp(
              head.rotation.y,
              0,
              lerpFactor
            );
            head.rotation.z = THREE.MathUtils.lerp(
              head.rotation.z,
              0,
              lerpFactor
            );
          }
          if (spine)
            spine.rotation.y = THREE.MathUtils.lerp(
              spine.rotation.y,
              0,
              lerpFactor
            );
          if (gltf.scene)
            gltf.scene.position.y = THREE.MathUtils.lerp(
              gltf.scene.position.y,
              -0.12,
              lerpFactor
            );
          break;
        // ★★★ ここからが修正点 ★★★
        case "thinking":
          if (head) {
            head.rotation.x = THREE.MathUtils.lerp(
              head.rotation.x,
              0.15,
              lerpFactor
            ); // 少しうつむく
            head.rotation.y = THREE.MathUtils.lerp(
              head.rotation.y,
              Math.sin(clockTime * 0.5) * 0.15,
              lerpFactor
            ); // ゆっくり左右に
            head.rotation.z = THREE.MathUtils.lerp(
              head.rotation.z,
              Math.sin(clockTime * 0.7) * 0.1,
              lerpFactor * 1.5
            ); // かすかにかしげる
          }
          if (spine) {
            spine.rotation.y = THREE.MathUtils.lerp(
              spine.rotation.y,
              Math.sin(clockTime * 0.3) * 0.05,
              lerpFactor
            ); // 体も少し揺らす
          }
          break;
        // ★★★ ここまで ★★★
        default:
          if (head) {
            head.rotation.x = THREE.MathUtils.lerp(
              head.rotation.x,
              Math.sin(clockTime * 0.55) * 0.05,
              lerpFactor
            );
            head.rotation.z = THREE.MathUtils.lerp(
              head.rotation.z,
              0,
              lerpFactor
            );
          }
          if (neck)
            neck.rotation.y = THREE.MathUtils.lerp(
              neck.rotation.y,
              Math.sin(clockTime * 0.6) * 0.2,
              lerpFactor
            );
          if (spine)
            spine.rotation.y = THREE.MathUtils.lerp(
              spine.rotation.y,
              Math.sin(clockTime * 0.4) * 0.1,
              lerpFactor
            );
          if (gltf.scene)
            gltf.scene.position.y = THREE.MathUtils.lerp(
              gltf.scene.position.y,
              -0.1,
              lerpFactor
            );
          break;
      }
      vrm.update(clampedDelta);
    });

    return (
      <>
        <primitive object={gltf.scene} position={[0, -0.1, 0]} />
        <mesh
          ref={interactionRef}
          onClick={onHeadClick}
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
