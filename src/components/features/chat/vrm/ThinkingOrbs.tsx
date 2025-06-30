"use client";

import { Sparkles } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber"; // ★ ThreeEvent をインポート
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const ORB_COUNT = 15;

const PopEffect = ({ color }: { color: THREE.Color }) => {
  // ★★★ setSpeedを削除 ★★★
  const [speed] = useState(() => 0.5 + Math.random() * 0.5);
  const [scale, setScale] = useState(() => 3 + Math.random() * 5);

  useEffect(() => {
    const timer = setTimeout(() => setScale(0), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Sparkles
      count={30}
      scale={scale}
      size={20}
      speed={speed}
      color={color}
      noise={1}
    />
  );
};

const Orb = ({
  initialPosition,
  initialColor,
}: {
  initialPosition: THREE.Vector3;
  initialColor: THREE.Color;
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [isPopped, setIsPopped] = useState(false);
  const [scale, setScale] = useState(0);

  useFrame(({ clock }) => {
    if (!meshRef.current || isPopped) return;
    meshRef.current.position.y =
      initialPosition.y +
      Math.sin(clock.getElapsedTime() + initialPosition.x) * 0.1;
    meshRef.current.rotation.y += 0.005;
  });

  useEffect(() => {
    setScale(0.1 + Math.random() * 0.05);
  }, []);

  // ★★★ anyをThreeEvent<MouseEvent>に修正 ★★★
  const handlePop = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isPopped) return;
    setIsPopped(true);
  };

  return (
    <group position={initialPosition}>
      <mesh
        ref={meshRef}
        onClick={handlePop}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
        scale={isPopped ? 0 : scale}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={initialColor}
          transparent
          opacity={0.7}
          roughness={0.1}
          metalness={0.2}
          emissive={initialColor}
          emissiveIntensity={0.3}
          envMapIntensity={1}
        />
      </mesh>
      {isPopped && <PopEffect color={initialColor} />}
    </group>
  );
};

export const ThinkingOrbs = () => {
  const orbs = useMemo(() => {
    return Array.from({ length: ORB_COUNT }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.5;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 1.0 + (Math.random() - 0.5) * 0.8;
      const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.6);
      return { position: new THREE.Vector3(x, y, z), color: color };
    });
  }, []);

  return (
    <group>
      {orbs.map((orb, i) => (
        <Orb key={i} initialPosition={orb.position} initialColor={orb.color} />
      ))}
    </group>
  );
};
