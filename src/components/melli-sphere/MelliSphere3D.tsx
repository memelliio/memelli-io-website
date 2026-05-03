'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BlendFunction } from 'postprocessing';

export type SphereState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'dispatching' | 'error';

interface MelliSphere3DProps {
  state: SphereState;
  audioAmplitude?: number;
}

// ── GLSL Simplex Noise ────────────────────────────────────────────────────────
const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const vertexShader = /* glsl */ `
${NOISE_GLSL}
uniform float uTime;
uniform float uMorphSpeed;
uniform float uMorphIntensity;
uniform float uAmplitude;
uniform float uSpin;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;

void main() {
  vec3 pos = position;
  float noise = snoise(pos * 1.8 + vec3(uTime * uMorphSpeed * 0.3));
  float noise2 = snoise(pos * 3.5 + vec3(uTime * uMorphSpeed * 0.7 + 100.0));
  float combined = noise * 0.65 + noise2 * 0.35;
  float audioNoise = snoise(pos * 5.0 + vec3(uTime * 2.0)) * uAmplitude * 0.4;
  float displacement = (combined + audioNoise) * uMorphIntensity;
  pos += normal * displacement;
  vNoise = combined;
  vNormal = normal;
  vPosition = pos;
  float angle = uTime * uSpin;
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  pos.xz = rot * pos.xz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uOpacity;
uniform float uTime;
uniform float uGlow;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vNoise;

void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 2.5);
  float t = clamp((vNoise + 1.0) * 0.5, 0.0, 1.0);
  vec3 col = mix(uColorA, uColorB, t);
  col = mix(col, uColorC, fresnel * 0.7);
  float pulse = sin(uTime * 2.0 + vNoise * 6.28) * 0.5 + 0.5;
  col += uColorC * pulse * uGlow * 0.3;
  col += uColorC * fresnel * uGlow;
  // Glass-like inner highlight
  float highlight = pow(max(dot(normalize(vNormal), normalize(vec3(-0.5, 0.6, 0.8))), 0.0), 6.0);
  col += vec3(1.0, 0.85, 0.85) * highlight * 0.35;
  gl_FragColor = vec4(col, uOpacity * (0.85 + fresnel * 0.15));
}
`;

// ── State → shader params (ALL RED) ──────────────────────────────────────────
interface StateParams {
  colorA: THREE.Color; colorB: THREE.Color; colorC: THREE.Color;
  morphSpeed: number; morphIntensity: number; spin: number;
  glow: number; bloomIntensity: number; bloomThreshold: number;
  ringSpeed: number;
}

const STATE_PARAMS: Record<SphereState, StateParams> = {
  idle: {
    colorA: new THREE.Color('#450a0a'), colorB: new THREE.Color('#991b1b'), colorC: new THREE.Color('#fca5a5'),
    morphSpeed: 0.4, morphIntensity: 0.12, spin: 0.0, glow: 0.3,
    bloomIntensity: 1.2, bloomThreshold: 0.6, ringSpeed: 0.5,
  },
  listening: {
    colorA: new THREE.Color('#7f1d1d'), colorB: new THREE.Color('#ef4444'), colorC: new THREE.Color('#fecaca'),
    morphSpeed: 1.4, morphIntensity: 0.28, spin: 0.0, glow: 0.75,
    bloomIntensity: 2.0, bloomThreshold: 0.35, ringSpeed: 1.6,
  },
  thinking: {
    colorA: new THREE.Color('#3b0000'), colorB: new THREE.Color('#b91c1c'), colorC: new THREE.Color('#f87171'),
    morphSpeed: 0.9, morphIntensity: 0.18, spin: 0.6, glow: 0.55,
    bloomIntensity: 1.5, bloomThreshold: 0.5, ringSpeed: 1.0,
  },
  speaking: {
    colorA: new THREE.Color('#7f1d1d'), colorB: new THREE.Color('#dc2626'), colorC: new THREE.Color('#fca5a5'),
    morphSpeed: 1.1, morphIntensity: 0.22, spin: 0.0, glow: 0.82,
    bloomIntensity: 2.2, bloomThreshold: 0.32, ringSpeed: 1.3,
  },
  dispatching: {
    colorA: new THREE.Color('#451a03'), colorB: new THREE.Color('#c2410c'), colorC: new THREE.Color('#fed7aa'),
    morphSpeed: 1.8, morphIntensity: 0.32, spin: 0.9, glow: 0.9,
    bloomIntensity: 2.4, bloomThreshold: 0.28, ringSpeed: 2.0,
  },
  error: {
    colorA: new THREE.Color('#1c0000'), colorB: new THREE.Color('#7f1d1d'), colorC: new THREE.Color('#fca5a5'),
    morphSpeed: 0.25, morphIntensity: 0.08, spin: 0.0, glow: 0.2,
    bloomIntensity: 0.8, bloomThreshold: 0.7, ringSpeed: 0.3,
  },
};

// ── Morphing sphere ───────────────────────────────────────────────────────────
function MorphSphere({ state, audioAmplitude = 0 }: MelliSphere3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const params = STATE_PARAMS[state];

  const uniforms = useMemo(() => ({
    uTime:           { value: 0 },
    uMorphSpeed:     { value: params.morphSpeed },
    uMorphIntensity: { value: params.morphIntensity },
    uAmplitude:      { value: audioAmplitude },
    uSpin:           { value: params.spin },
    uColorA:         { value: params.colorA.clone() },
    uColorB:         { value: params.colorB.clone() },
    uColorC:         { value: params.colorC.clone() },
    uOpacity:        { value: 1.0 },
    uGlow:           { value: params.glow },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uAmplitude.value = THREE.MathUtils.lerp(uniforms.uAmplitude.value, audioAmplitude, 0.15);
    uniforms.uMorphSpeed.value     = THREE.MathUtils.lerp(uniforms.uMorphSpeed.value, params.morphSpeed, delta * 2);
    uniforms.uMorphIntensity.value = THREE.MathUtils.lerp(uniforms.uMorphIntensity.value, params.morphIntensity, delta * 2);
    uniforms.uSpin.value           = THREE.MathUtils.lerp(uniforms.uSpin.value, params.spin, delta * 2);
    uniforms.uGlow.value           = THREE.MathUtils.lerp(uniforms.uGlow.value, params.glow, delta * 2);
    uniforms.uColorA.value.lerp(params.colorA, delta * 1.5);
    uniforms.uColorB.value.lerp(params.colorB, delta * 1.5);
    uniforms.uColorC.value.lerp(params.colorC, delta * 1.5);
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12;
      meshRef.current.rotation.x += delta * 0.04;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.35, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// ── Glass inner glow layer ────────────────────────────────────────────────────
function InnerGlow({ state }: { state: SphereState }) {
  const params = STATE_PARAMS[state];
  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: params.colorC, transparent: true, opacity: 0.06, side: THREE.BackSide,
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    mat.color.lerp(params.colorC, delta * 1.5);
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, params.glow * 0.09, delta * 2);
  });

  return (
    <mesh scale={1.2}>
      <sphereGeometry args={[1.35, 32, 32]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// ── Orbital rings ─────────────────────────────────────────────────────────────
const RING_DEFS = [
  { radius: 2.05, tube: 0.007, tiltX: 0.3,  tiltZ: 0.1,  spinAxis: 'y' as const, speed:  1.4 },
  { radius: 2.28, tube: 0.005, tiltX: 1.15, tiltZ: 0.45, spinAxis: 'x' as const, speed: -1.9 },
  { radius: 2.48, tube: 0.004, tiltX: 1.5,  tiltZ: 0.2,  spinAxis: 'z' as const, speed:  1.1 },
];

function OrbitalRings({ state }: { state: SphereState }) {
  const params = STATE_PARAMS[state];
  const ringRefs = [
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
  ];

  const materials = useMemo(() => RING_DEFS.map((_, i) => new THREE.MeshBasicMaterial({
    color: i === 0 ? '#ef4444' : i === 1 ? '#dc2626' : '#b91c1c',
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  })), []);

  useFrame((_, delta) => {
    const speedMult = THREE.MathUtils.lerp(0.5, 1.6, params.ringSpeed / 2.0);
    RING_DEFS.forEach((def, i) => {
      const mesh = ringRefs[i].current;
      if (!mesh) return;
      if (def.spinAxis === 'y') mesh.rotation.y += delta * def.speed * speedMult;
      if (def.spinAxis === 'x') mesh.rotation.x += delta * def.speed * speedMult;
      if (def.spinAxis === 'z') mesh.rotation.z += delta * def.speed * speedMult;
      const targetOpacity = params.glow * 0.65;
      materials[i].opacity = THREE.MathUtils.lerp(materials[i].opacity, targetOpacity, delta * 1.5);
      const targetColor = i === 0 ? params.colorC : i === 1 ? params.colorB : params.colorA;
      materials[i].color.lerp(targetColor, delta * 1.5);
    });
  });

  return (
    <>
      {RING_DEFS.map((def, i) => (
        <mesh
          key={i}
          ref={ringRefs[i]}
          rotation={[def.tiltX, 0, def.tiltZ]}
        >
          <torusGeometry args={[def.radius, def.tube, 8, 140]} />
          <primitive object={materials[i]} attach="material" />
        </mesh>
      ))}
    </>
  );
}

// ── Orbital pearls — bright glowing dots that orbit on the rings ──────────────
function OrbitalPearls({ state }: { state: SphereState }) {
  const params = STATE_PARAMS[state];
  const groupRef = useRef<THREE.Group>(null);

  const pearlMats = useMemo(() => [
    new THREE.MeshBasicMaterial({ color: '#fca5a5', transparent: true, opacity: 0.95 }),
    new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.95 }),
    new THREE.MeshBasicMaterial({ color: '#fecaca', transparent: true, opacity: 0.95 }),
  ], []);

  useFrame((state3r, delta) => {
    const t = state3r.clock.elapsedTime;
    const speedMult = 0.4 + params.ringSpeed * 0.5;
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const radius = RING_DEFS[i].radius;
      const tiltX  = RING_DEFS[i].tiltX;
      const ang = t * (0.6 + i * 0.25) * speedMult * (i === 1 ? -1 : 1);
      // Orbit in the ring plane
      child.position.x = Math.cos(ang) * radius;
      child.position.y = Math.sin(ang) * Math.sin(tiltX) * radius;
      child.position.z = Math.sin(ang) * Math.cos(tiltX) * radius;
      pearlMats[i].opacity = THREE.MathUtils.lerp(pearlMats[i].opacity, params.glow * 0.95, delta * 2);
      pearlMats[i].color.lerp(i % 2 === 0 ? params.colorC : params.colorB, delta * 1.5);
    });
  });

  return (
    <group ref={groupRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <primitive object={pearlMats[i]} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ── Post-processing ───────────────────────────────────────────────────────────
function Effects({ state }: { state: SphereState }) {
  const params = STATE_PARAMS[state];
  const bloomRef = useRef<any>(null);
  const caRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (bloomRef.current) {
      bloomRef.current.intensity  = THREE.MathUtils.lerp(bloomRef.current.intensity, params.bloomIntensity, delta * 1.5);
      bloomRef.current.threshold  = THREE.MathUtils.lerp(bloomRef.current.threshold, params.bloomThreshold, delta * 1.5);
    }
    if (caRef.current) {
      const target = state === 'speaking' || state === 'dispatching' ? 0.003 : 0.001;
      caRef.current.offset.lerp(new THREE.Vector2(target, target), delta * 2);
    }
  });

  return (
    <EffectComposer>
      <Bloom
        ref={bloomRef}
        intensity={params.bloomIntensity}
        luminanceThreshold={params.bloomThreshold}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.85}
      />
      <ChromaticAberration
        ref={caRef}
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.001, 0.001)}
      />
    </EffectComposer>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export function MelliSphereScene({ state, audioAmplitude = 0 }: MelliSphere3DProps) {
  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight position={[3, 3, 3]}   intensity={1.8} color="#ef4444" />
      <pointLight position={[-3, -2, 2]} intensity={0.9} color="#991b1b" />
      <pointLight position={[0, 3, -2]}  intensity={0.5} color="#fca5a5" />
      <MorphSphere state={state} audioAmplitude={audioAmplitude} />
      <InnerGlow state={state} />
      <OrbitalRings state={state} />
      <OrbitalPearls state={state} />
      <Effects state={state} />
    </>
  );
}
