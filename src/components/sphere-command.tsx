'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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

interface SphereCommandProps {
  state: SphereState;
  size?: number;
  audioAmplitude?: number;
  onClick?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  State-driven rotation speeds                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function rotSpeedForState(state: SphereState): number {
  switch (state) {
    case 'idle':        return 0.001;
    case 'listening':   return 0.0015;
    case 'thinking':    return 0.003;
    case 'speaking':    return 0.0012;
    case 'dispatching': return 0.004;
    case 'error':       return 0.0005;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Command Sphere Mesh                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CommandSphere({ state, amplitude }: { state: SphereState; amplitude: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const rotSpeed = useRef(0.001);

  useEffect(() => {
    rotSpeed.current = rotSpeedForState(state);
  }, [state]);

  // Load command center texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/sphere-command-center.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 16;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      setTexture(tex);
    });
  }, []);

  // Emissive color based on state
  const emissiveColor = useMemo(() => {
    switch (state) {
      case 'error': return new THREE.Color('#661010');
      default:      return new THREE.Color('#1a1a2e');
    }
  }, [state]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // No rotation — image is flat, circle stays still
    // Gentle breathing scale only
    const breathe = 1.0 + Math.sin(t * 0.8) * 0.008 + amplitude * 0.02;
    meshRef.current.scale.setScalar(breathe);
  });

  if (!texture) return null;

  // Image is 2752x1536, already looks like a sphere — use a plane facing camera
  const aspect = 2752 / 1536;
  const planeH = 2.0;
  const planeW = planeH * aspect;

  return (
    <group ref={meshRef}>
      <mesh>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial
          map={texture}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Scene                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CommandScene({ state, amplitude }: { state: SphereState; amplitude: number }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 5]} intensity={0.5} />
      <directionalLight position={[-2, -1, 3]} intensity={0.25} />
      <CommandSphere state={state} amplitude={amplitude} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Export                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SphereCommand({ state, size = 300, audioAmplitude = 0, onClick }: SphereCommandProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Command Center Sphere"
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1.5, 2]}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <CommandScene state={state} amplitude={audioAmplitude} />
      </Canvas>
    </div>
  );
}
