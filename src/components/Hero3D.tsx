"use client";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function BasketAndCards() {
  const group = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.25;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.12;
    }
    if (ringA.current) ringA.current.rotation.z += delta * 0.5;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.35;
  });

  return (
    <group ref={group}>
      {/* shopping basket body */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[2.2, 1.2, 1.5]} />
        <meshStandardMaterial color="#10b981" roughness={0.35} metalness={0.15} />
      </mesh>
      {/* basket rim */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[2.4, 0.14, 1.7]} />
        <meshStandardMaterial color="#065f46" roughness={0.4} />
      </mesh>
      {/* handle */}
      <mesh position={[0, 0.9, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.9, 0.09, 12, 40, Math.PI]} />
        <meshStandardMaterial color="#6ee7b7" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* groceries peeking out */}
      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.4}>
        <mesh position={[-0.6, 0.75, 0.2]}>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.5} />
        </mesh>
      </Float>
      <Float speed={3} rotationIntensity={0.5} floatIntensity={1.6}>
        <mesh position={[0.55, 0.85, -0.1]}>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>
      </Float>

      {/* floating credit card */}
      <Float speed={2} rotationIntensity={0.8} floatIntensity={1.2}>
        <group position={[1.9, 1.15, 0.4]} rotation={[-0.25, -0.5, 0.12]}>
          <mesh>
            <boxGeometry args={[1.5, 0.06, 0.95]} />
            <meshStandardMaterial color="#7c3aed" roughness={0.25} metalness={0.55} />
          </mesh>
          <mesh position={[-0.45, 0.045, 0]}>
            <boxGeometry args={[0.4, 0.02, 0.28]} />
            <meshStandardMaterial color="#fbbf24" emissive="#b45309" emissiveIntensity={0.6} />
          </mesh>
        </group>
      </Float>

      {/* coins */}
      <Float speed={3.4} rotationIntensity={0.4} floatIntensity={1.8}>
        <mesh position={[-1.9, 1.1, -0.3]} rotation={[Math.PI / 2.4, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.09, 28]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.8} />
        </mesh>
      </Float>
      <Float speed={2.8} rotationIntensity={0.4} floatIntensity={1.5}>
        <mesh position={[-2.2, 0.35, 0.4]} rotation={[Math.PI / 2.1, 0.3, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.08, 28]} />
          <meshStandardMaterial color="#fde68a" roughness={0.2} metalness={0.8} />
        </mesh>
      </Float>

      {/* orbit rings */}
      <mesh ref={ringA} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[2.9, 0.03, 8, 90]} />
        <meshStandardMaterial color="#22d3ee" transparent opacity={0.7} />
      </mesh>
      <mesh ref={ringB} rotation={[Math.PI / 1.8, 0.4, 0]}>
        <torusGeometry args={[3.4, 0.02, 8, 90]} />
        <meshStandardMaterial color="#34d399" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 8.5], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 6, 4]} intensity={1.4} />
      <pointLight position={[-5, -2, -3]} intensity={0.8} color="#22d3ee" />
      <pointLight position={[4, 3, 4]} intensity={0.6} color="#a7f3d0" />
      <BasketAndCards />
      <ContactShadows position={[0, -1.6, 0]} opacity={0.45} scale={10} blur={2.4} far={4} color="#022c22" />
    </Canvas>
  );
}
