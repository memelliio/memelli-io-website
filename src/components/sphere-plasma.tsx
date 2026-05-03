'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type SphereState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'dispatching'
  | 'error';

interface SphereProps {
  state: SphereState;
  size?: number;
  audioAmplitude?: number;
  onClick?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  State Config                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const STATE_CONFIG: Record<SphereState, { rotSpeed: number; pulseAmp: number; pulseFreq: number; emissiveIntensity: number }> = {
  idle:        { rotSpeed: 0.002, pulseAmp: 0.015, pulseFreq: 0.8,  emissiveIntensity: 0.15 },
  listening:   { rotSpeed: 0.003, pulseAmp: 0.02,  pulseFreq: 1.0,  emissiveIntensity: 0.25 },
  thinking:    { rotSpeed: 0.006, pulseAmp: 0.03,  pulseFreq: 1.5,  emissiveIntensity: 0.35 },
  speaking:    { rotSpeed: 0.004, pulseAmp: 0.025, pulseFreq: 1.2,  emissiveIntensity: 0.3  },
  dispatching: { rotSpeed: 0.008, pulseAmp: 0.035, pulseFreq: 2.0,  emissiveIntensity: 0.4  },
  error:       { rotSpeed: 0.001, pulseAmp: 0.01,  pulseFreq: 0.5,  emissiveIntensity: 0.1  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Plasma Globe Mesh                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PlasmaGlobe({ state, audioAmplitude = 0 }: { state: SphereState; audioAmplitude: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, '/sphere-plasma-globe.png');

  const material = useMemo(() => {
    const tex = texture.clone();
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(0xcc2233),
      emissiveIntensity: 0.15,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      side: THREE.FrontSide,
    });
  }, [texture]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const cfg = STATE_CONFIG[state];
    const t = clock.getElapsedTime();

    // Slow Y rotation
    meshRef.current.rotation.y += cfg.rotSpeed;

    // Gentle breathing scale (sin wave)
    const audioBoost = audioAmplitude * 0.05;
    const breathe = 1 + Math.sin(t * cfg.pulseFreq) * cfg.pulseAmp + audioBoost;
    meshRef.current.scale.setScalar(breathe);

    // Update emissive intensity
    material.emissiveIntensity = cfg.emissiveIntensity + audioAmplitude * 0.1;
  });

  // Image is 2848x1600, pre-rendered globe — use plane facing camera
  const aspect = 2848 / 1600;
  const planeH = 3.2;
  const planeW = planeH * aspect;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial
        map={material.map}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SpherePlasma({ state, size = 200, audioAmplitude = 0, onClick }: SphereProps) {
  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
    >
      <Canvas
        dpr={[1.5, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 2, 5]} intensity={0.8} />
        <directionalLight position={[-3, -1, 3]} intensity={0.4} />

        <PlasmaGlobe state={state} audioAmplitude={audioAmplitude ?? 0} />
      </Canvas>
    </div>
  );
}
