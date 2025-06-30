"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Props = {
  id: number;
  position: THREE.Vector3;
  onComplete: (id: number) => void;
};

export const TapEffect = ({ id, position, onComplete }: Props) => {
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
