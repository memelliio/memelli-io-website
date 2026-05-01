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

interface SphereProps {
  state: SphereState;
  size?: number;
  audioAmplitude?: number;
  onClick?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Brand Colors                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const C_PRIMARY = new THREE.Color('#D72638');
const C_DEEP    = new THREE.Color('#B71E2E');
const C_ENERGY  = new THREE.Color('#E84855');
const C_HOT     = new THREE.Color('#F07080');
const C_GLOW    = new THREE.Color('#FDDDE1');
const C_WHITE   = new THREE.Color('#FFFFFF');
const C_DEEP_ERROR = new THREE.Color('#8B1020');

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  State Configuration — 3 clear states: SLEEP, IDLE, LIVE                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Cfg {
  plasmaSpeed: number;
  plasmaIntensity: number;
  plasmaDistortion: number;
  rotSpeed: number;
  particleBrightness: number;
  particleDrift: number;
  equatorGlow: number;
  equatorPulseSpeed: number;
  logoOpacity: number;
  logoPulseSpeed: number;
  logoScale: number;
  coreColor: THREE.Color;
  glowIntensity: number;
  shellRimGlow: number;
  ringSpeed1: number;
  ringSpeed2: number;
  ringSpeed3: number;
  ringBrightness: number;
  railSpeed: number;
  whiteHotMix: number;       // how much white appears in plasma peaks
  sparkleFrequency: number;  // sparkle flash rate (0 = none, 1 = frequent)
  equatorFlashIntensity: number; // white energy flashes at equator crossings
  noiseSpeed: number;        // noise animation multiplier
}

// SLEEP: 25% of live values
const SLEEP_CFG: Cfg = {
  plasmaSpeed: 0.375, plasmaIntensity: 0.325, plasmaDistortion: 0.03, rotSpeed: 0.9375,
  particleBrightness: 0.25, particleDrift: 0.05,
  equatorGlow: 0.325, equatorPulseSpeed: 0.625,
  logoOpacity: 0.125, logoPulseSpeed: 0.219, logoScale: 1.24,
  coreColor: C_DEEP.clone(), glowIntensity: 0.05, shellRimGlow: 0.325,
  ringSpeed1: 0.675, ringSpeed2: 0.8, ringSpeed3: 0.875,
  ringBrightness: 0.3,
  railSpeed: 0.3,
  whiteHotMix: 0.125,
  sparkleFrequency: 0.2,
  equatorFlashIntensity: 0.15,
  noiseSpeed: 0.3,
};

// IDLE: 60% of live values
const IDLE_CFG: Cfg = {
  plasmaSpeed: 0.9, plasmaIntensity: 0.78, plasmaDistortion: 0.072, rotSpeed: 2.25,
  particleBrightness: 0.6, particleDrift: 0.12,
  equatorGlow: 0.78, equatorPulseSpeed: 1.5,
  logoOpacity: 0.3, logoPulseSpeed: 0.525, logoScale: 1.275,
  coreColor: C_PRIMARY.clone(), glowIntensity: 0.12, shellRimGlow: 0.78,
  ringSpeed1: 1.62, ringSpeed2: 1.92, ringSpeed3: 2.1,
  ringBrightness: 0.72,
  railSpeed: 0.72,
  whiteHotMix: 0.3,
  sparkleFrequency: 0.48,
  equatorFlashIntensity: 0.36,
  noiseSpeed: 0.72,
};

// LIVE: 120% — all settings 20% brighter
const LIVE_CFG: Cfg = {
  plasmaSpeed: 1.8, plasmaIntensity: 1.56, plasmaDistortion: 0.144, rotSpeed: 4.5,
  particleBrightness: 1.2, particleDrift: 0.24,
  equatorGlow: 1.56, equatorPulseSpeed: 3.0,
  logoOpacity: 0.8, logoPulseSpeed: 1.05, logoScale: 1.3375,
  coreColor: C_ENERGY.clone(), glowIntensity: 0.24, shellRimGlow: 1.56,
  ringSpeed1: 3.24, ringSpeed2: 3.84, ringSpeed3: 4.2,
  ringBrightness: 1.44,
  railSpeed: 1.44,
  whiteHotMix: 0.6,
  sparkleFrequency: 0.96,
  equatorFlashIntensity: 0.72,
  noiseSpeed: 1.44,
};

// LIVE variant for dispatching — max intensity
const LIVE_MAX_CFG: Cfg = {
  ...LIVE_CFG,
  plasmaSpeed: 2.1, plasmaIntensity: 1.5, plasmaDistortion: 0.15, rotSpeed: 1.8,
  ringSpeed1: 3.6, ringSpeed2: 4.8, ringSpeed3: 5.5,
  ringBrightness: 1.4,
  railSpeed: 1.6,
  whiteHotMix: 0.7,
  sparkleFrequency: 1.0,
  equatorFlashIntensity: 0.9,
  noiseSpeed: 1.6,
  coreColor: C_HOT.clone(),
  glowIntensity: 0.25,
};

// LIVE variant for speaking — outward pulse emphasis
const LIVE_SPEAK_CFG: Cfg = {
  ...LIVE_CFG,
  plasmaDistortion: 0.1,
  equatorGlow: 1.5,
  equatorPulseSpeed: 2.0,
  coreColor: C_PRIMARY.clone(),
};

// ERROR: deep red sleep
const ERROR_CFG: Cfg = {
  ...SLEEP_CFG,
  coreColor: C_DEEP_ERROR.clone(),
  plasmaIntensity: 0.25,
  glowIntensity: 0.04,
  shellRimGlow: 0.4,
};

function cfg(state: SphereState): Cfg {
  switch (state) {
    case 'idle': return { ...SLEEP_CFG };
    case 'listening': return { ...IDLE_CFG };
    case 'thinking': return { ...LIVE_CFG };
    case 'speaking': return { ...LIVE_SPEAK_CFG };
    case 'dispatching': return { ...LIVE_MAX_CFG };
    case 'error': return { ...ERROR_CFG };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Lerp helper for smooth transitions (~1 second at 60fps)                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function lerpVal(current: number, target: number, speed = 0.05): number {
  return current + (target - current) * speed;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GLSL Noise (shared simplex 3D noise)                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const noiseGLSL = /* glsl */ `
  vec4 pm(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 ti(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)),x0=v-i+dot(i,C.xxx),g=step(x0.yzx,x0.xyz),l=1.0-g;
    vec3 i1=min(g,l.zxy),i2=max(g,l.zxy),x1=x0-i1+C.xxx,x2=x0-i2+C.yyy,x3=x0-D.yyy;
    i=mod(i,289.0);vec4 p=pm(pm(pm(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=1.0/7.0;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z),y_=floor(j-7.0*x_),x=x_*ns.x+ns.yyyy,y=y_*ns.x+ns.yyyy,h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy),b1=vec4(x.zw,y.zw),s0=floor(b0)*2.0+1.0,s1=floor(b1)*2.0+1.0,sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy,a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x),p1=vec3(a0.zw,h.y),p2=vec3(a1.xy,h.z),p3=vec3(a1.zw,h.w);
    vec4 norm=ti(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Inner Plasma Sphere                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const plasmaVert = /* glsl */ `
  uniform float uTime;
  uniform float uDistortion;
  uniform float uSpeed;
  uniform float uNoiseSpeed;
  varying vec3 vNorm;
  varying vec3 vPos;
  varying vec2 vUv;

  ${noiseGLSL}

  void main(){
    vUv = uv;
    vPos = position;
    vNorm = normalize(normalMatrix * normal);

    // Multi-octave noise displacement for organic surface
    float t = uTime * uNoiseSpeed;
    float n1 = snoise(position * 2.5 + t * uSpeed) * 0.5;
    float n2 = snoise(position * 5.0 + t * uSpeed * 1.3) * 0.25;
    float n3 = snoise(position * 10.0 + t * uSpeed * 1.7) * 0.125;
    float displacement = (n1 + n2 + n3) * uDistortion;

    vec3 newPos = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
  }
`;

const plasmaFrag = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform float uNoiseSpeed;
  uniform float uWhiteHotMix;
  uniform vec3 uColor1;  // primary
  uniform vec3 uColor2;  // deep
  uniform vec3 uColor3;  // energy
  uniform vec3 uColor4;  // hot
  uniform vec3 uColor5;  // glow white
  uniform sampler2D uLogoTex;
  uniform float uLogoLoaded;
  uniform float uLogoOpacity;
  varying vec3 vNorm;
  varying vec3 vPos;
  varying vec2 vUv;

  ${noiseGLSL}

  void main(){
    float t = uTime * uSpeed * uNoiseSpeed;

    // Multi-octave plasma wisps — faster noise animation
    float n1 = snoise(vPos * 3.0 + t * 0.4) * 0.5 + 0.5;
    float n2 = snoise(vPos * 6.0 - t * 0.6 + vec3(10.0)) * 0.5 + 0.5;
    float n3 = snoise(vPos * 12.0 + t * 0.8 + vec3(20.0)) * 0.5 + 0.5;
    float n4 = snoise(vPos * 2.0 + t * 0.2 + vec3(30.0)) * 0.5 + 0.5;

    // Combine noise octaves for swirling wisps
    float plasma = n1 * 0.4 + n2 * 0.3 + n3 * 0.2 + n4 * 0.1;

    // Energy concentrations — bright spots
    float concentrate = pow(n2 * n3, 2.0) * 3.0;
    float wisp = pow(abs(snoise(vPos * 4.0 + t * 0.5)), 3.0) * 2.0;

    // Color mixing based on plasma intensity
    vec3 col = mix(uColor2, uColor1, plasma);
    col = mix(col, uColor3, concentrate * 0.5);
    col = mix(col, uColor4, wisp * 0.4);
    col = mix(col, uColor5, pow(concentrate, 3.0) * 0.3);

    // White-hot centers where noise peaks — intensity driven by state
    float hotPeak = pow(max(plasma, 0.0), 4.0) * concentrate;
    col = mix(col, vec3(1.0, 0.97, 0.95), hotPeak * uWhiteHotMix * 2.0);

    // Additional white at energy peak intersections
    float peakWhite = pow(n1 * n2 * n3, 3.0) * 8.0;
    col = mix(col, vec3(1.0, 0.98, 0.96), clamp(peakWhite * uWhiteHotMix, 0.0, 0.6));

    // Fresnel for edge glow
    vec3 N = normalize(vNorm);
    float fresnel = pow(1.0 - abs(dot(N, vec3(0.0, 0.0, 1.0))), 2.0);
    col += uColor3 * fresnel * 0.4;

    // Overall intensity
    col *= uIntensity;

    // Alpha: more opaque at energy concentrations, softer edges
    float alpha = 0.5 + plasma * 0.3 + concentrate * 0.2;
    alpha = clamp(alpha, 0.3, 0.95);

    gl_FragColor = vec4(col, alpha);
  }
`;

function InnerPlasma({ state, amp }: { state: SphereState; amp: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const logoRef = useRef<THREE.Mesh>(null);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const [logoTex, setLogoTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    new THREE.TextureLoader().load('/memelli-logo-white.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 16;
      setLogoTex(tex);
    });
  }, []);

  const u = useMemo(() => ({
    uTime: { value: 0 },
    uSpeed: { value: 0.15 },
    uDistortion: { value: 0.03 },
    uIntensity: { value: 0.6 },
    uNoiseSpeed: { value: 0.6 },
    uWhiteHotMix: { value: 0.0 },
    uLogoTex: { value: null as THREE.Texture | null },
    uLogoLoaded: { value: 0 },
    uLogoOpacity: { value: 0.25 },
    uColor1: { value: C_PRIMARY.clone() },
    uColor2: { value: C_DEEP.clone() },
    uColor3: { value: C_ENERGY.clone() },
    uColor4: { value: C_HOT.clone() },
    uColor5: { value: C_GLOW.clone() },
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = tgt.current;
    u.uTime.value = t;
    u.uSpeed.value = lerpVal(u.uSpeed.value, c.plasmaSpeed + amp * 0.1);
    u.uDistortion.value = lerpVal(u.uDistortion.value, c.plasmaDistortion + amp * 0.02);
    u.uIntensity.value = lerpVal(u.uIntensity.value, c.plasmaIntensity + amp * 0.15);
    u.uNoiseSpeed.value = lerpVal(u.uNoiseSpeed.value, c.noiseSpeed);
    u.uWhiteHotMix.value = lerpVal(u.uWhiteHotMix.value, c.whiteHotMix);
    if (logoTex && u.uLogoLoaded.value < 0.5) {
      u.uLogoTex.value = logoTex;
      u.uLogoLoaded.value = 1.0;
    }
    u.uLogoOpacity.value = lerpVal(u.uLogoOpacity.value, c.logoOpacity * 0.6);
    u.uColor1.value.lerp(c.coreColor, 0.05);

    if (ref.current) {
      // Plasma rotates left (negative Y)
      ref.current.rotation.y -= c.rotSpeed * 0.02;
      ref.current.rotation.x += Math.sin(t * 0.1) * 0.0008;
    }
    // Logo rotates right via separate logoRef
    if (logoRef.current) {
      logoRef.current.rotation.y += c.rotSpeed * 0.0125;
    }
  });

  return (
    <group>
      {/* Plasma sphere — rotates left */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.85, 64]} />
        <shaderMaterial
          vertexShader={plasmaVert}
          fragmentShader={plasmaFrag}
          uniforms={u}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
        />
      </mesh>
      {/* Logo sphere — rotates right, separate from plasma */}
      {logoTex && (
        <mesh ref={logoRef} renderOrder={5}>
          <icosahedronGeometry args={[0.86, 64]} />
          <meshBasicMaterial
            map={logoTex}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            color="#F07080"
          />
        </mesh>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Glass Sphere Frame with Specular White Highlights                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const shellVert = /* glsl */ `
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main(){
    vUv = uv;
    vNorm = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const shellFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uRimGlow;
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main(){
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 N = normalize(vNorm);
    float NdV = max(dot(N, V), 0.0);

    // Fresnel rim glow
    float fresnel = pow(1.0 - NdV, 4.0);

    // Multiple specular highlights — bright white points where light catches
    vec3 L1 = normalize(vec3(3.0, 4.0, 5.0));
    vec3 L2 = normalize(vec3(-2.0, -3.0, 4.0));
    vec3 L3 = normalize(vec3(0.0, 5.0, 3.0));
    vec3 L4 = normalize(vec3(4.0, -1.0, 3.0));
    vec3 L5 = normalize(vec3(-3.0, 2.0, 5.0));
    vec3 H1 = normalize(V + L1);
    vec3 H2 = normalize(V + L2);
    vec3 H3 = normalize(V + L3);
    vec3 H4 = normalize(V + L4);
    vec3 H5 = normalize(V + L5);
    float spec1 = pow(max(dot(N, H1), 0.0), 300.0) * 1.2;
    float spec2 = pow(max(dot(N, H2), 0.0), 200.0) * 0.8;
    float spec3 = pow(max(dot(N, H3), 0.0), 250.0) * 1.0;
    float spec4 = pow(max(dot(N, H4), 0.0), 180.0) * 0.6;
    float spec5 = pow(max(dot(N, H5), 0.0), 220.0) * 0.7;

    float totalSpec = spec1 + spec2 + spec3 + spec4 + spec5;

    // Subtle ring highlight at equator
    float equatorHighlight = pow(1.0 - abs(N.y), 8.0) * 0.15;

    // Color: brand red rim with bright white specular
    vec3 col = uColor * fresnel * uRimGlow * 1.2;
    col += vec3(1.0, 0.98, 0.95) * totalSpec; // bright white specular points
    col += uColor * equatorHighlight;

    // Subtle pulsing
    float pulse = sin(uTime * 0.6) * 0.05 + 1.0;
    col *= pulse;

    // Alpha: visible only at edges
    float alpha = fresnel * 0.7 + totalSpec * 0.6 + equatorHighlight;
    alpha = clamp(alpha, 0.0, 0.85);

    gl_FragColor = vec4(col, alpha);
  }
`;

function GlassSphereFrame({ state }: { state: SphereState }) {
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const u = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: C_PRIMARY.clone() },
    uRimGlow: { value: 0.7 },
  }), []);

  useFrame(({ clock }) => {
    const c = tgt.current;
    u.uTime.value = clock.getElapsedTime();
    u.uColor.value.lerp(c.coreColor, 0.05);
    u.uRimGlow.value = lerpVal(u.uRimGlow.value, c.shellRimGlow);
  });

  return (
    <mesh>
      <icosahedronGeometry args={[0.93, 64]} />
      <shaderMaterial
        vertexShader={shellVert}
        fragmentShader={shellFrag}
        uniforms={u}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Logo Sprite                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function LogoSprite({ state }: { state: SphereState }) {
  const ref = useRef<THREE.Mesh>(null);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const [logoTex, setLogoTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    new THREE.TextureLoader().load('/memelli-logo-white.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 16;
      setLogoTex(tex);
    });
  }, []);

  const curOpacity = useRef(0.35);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const c = tgt.current;

    const breathe = Math.sin(t * c.logoPulseSpeed) * 0.01 + 1.0;
    const targetScale = c.logoScale * breathe;

    const aspect = 4171 / 3754;
    const offsetX = (-99 / 4171) * 1.7 * targetScale;
    const offsetY = (-106 / 3754) * 1.7 * targetScale;

    const baseSize = 1.7;
    ref.current.scale.set(
      baseSize * aspect * targetScale,
      baseSize * targetScale,
      1
    );
    ref.current.position.set(offsetX, offsetY, 0.1);

    // Slow smooth rotation
    ref.current.rotation.z += 0.001;

    const targetOpacity = (c.logoOpacity * 0.5) + Math.sin(t * c.logoPulseSpeed * 0.7) * 0.02;
    curOpacity.current = lerpVal(curOpacity.current, targetOpacity);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = curOpacity.current;
  });

  if (!logoTex) return null;

  return (
    <mesh ref={ref} position={[0, 0, 0.1]} renderOrder={5}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={logoTex}
        transparent
        opacity={0.2}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        color="#F07080"
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  White Sparkle Particles (5-8 inside sphere, random flash)                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function WhiteSparkles({ state }: { state: SphereState }) {
  const ref = useRef<THREE.Points>(null);
  const count = 8;
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const { positions, phases, radii } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const rd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.2 + Math.random() * 0.55;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      ph[i] = Math.random() * Math.PI * 2;
      rd[i] = 1.5 + Math.random() * 3.0; // flash frequency
    }
    return { positions: pos, phases: ph, radii: rd };
  }, []);

  const curSize = useRef(0.0);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const c = tgt.current;

    // Relocate sparkles randomly when they flash
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const flash = Math.pow(Math.max(Math.sin(t * radii[i] + phases[i]), 0.0), 8.0);
      if (flash < 0.01) {
        // Relocate when dark
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 0.2 + Math.random() * 0.55;
        arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        arr[i * 3 + 2] = r * Math.cos(phi);
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;

    // Size driven by sparkle frequency
    const targetSize = 0.03 * c.sparkleFrequency;
    curSize.current = lerpVal(curSize.current, targetSize);
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.size = curSize.current;
    mat.opacity = lerpVal(mat.opacity, c.sparkleFrequency * 0.9);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        color={C_WHITE}
        size={0.0}
        transparent
        opacity={0.0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Equator Flash — white energy at ring crossing points                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const equatorFlashVert = /* glsl */ `
  varying vec3 vNorm;
  varying vec3 vPos;
  void main(){
    vNorm = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const equatorFlashFrag = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vNorm;
  varying vec3 vPos;

  ${noiseGLSL}

  void main(){
    // Equator band — where Y is near 0
    float equator = pow(max(1.0 - abs(vPos.y) * 3.0, 0.0), 6.0);

    // Also add bands at +/- 30 degree tilts (ring crossing zones)
    float band1 = pow(max(1.0 - abs(vPos.y - vPos.z * 0.577) * 3.0, 0.0), 6.0);
    float band2 = pow(max(1.0 - abs(vPos.y + vPos.z * 0.577) * 3.0, 0.0), 6.0);

    float bands = max(equator, max(band1, band2));

    // Noise-driven flashing
    float flash = snoise(vPos * 8.0 + uTime * 2.0) * 0.5 + 0.5;
    flash = pow(flash, 4.0);

    float intensity = bands * flash * uIntensity;

    // White energy color
    vec3 col = vec3(1.0, 0.95, 0.92) * intensity * 1.5;

    float alpha = clamp(intensity, 0.0, 0.7);

    gl_FragColor = vec4(col, alpha);
  }
`;

function EquatorFlash({ state }: { state: SphereState }) {
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const u = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0 },
  }), []);

  useFrame(({ clock }) => {
    const c = tgt.current;
    u.uTime.value = clock.getElapsedTime();
    u.uIntensity.value = lerpVal(u.uIntensity.value, c.equatorFlashIntensity);
  });

  return (
    <mesh>
      <icosahedronGeometry args={[0.94, 32]} />
      <shaderMaterial
        vertexShader={equatorFlashVert}
        fragmentShader={equatorFlashFrag}
        uniforms={u}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Floating Particles (400 — inside sphere + orbiting outside along rings)  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FloatingParticles({ state, amp }: { state: SphereState; amp: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 400;
  const innerCount = 300;
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const { positions, velocities, orbitData } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const orbit = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      if (i < innerCount) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * 0.82;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
        vel[i * 3] = (Math.random() - 0.5) * 0.001;
        vel[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
        orbit[i * 3] = 0;
      } else {
        const ringGroup = (i - innerCount) % 3;
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.15 + ringGroup * 0.05 + (Math.random() - 0.5) * 0.06;
        orbit[i * 3] = angle;
        orbit[i * 3 + 1] = radius;
        orbit[i * 3 + 2] = ringGroup;
        vel[i * 3] = (0.3 + Math.random() * 0.7) * (Math.random() > 0.5 ? 1 : -1);
        pos[i * 3] = 0;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = 0;
      }
    }
    return { positions: pos, velocities: vel, orbitData: orbit };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const c = tgt.current;
    const drift = c.particleDrift;

    const arr = ref.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < innerCount; i++) {
      const b = i * 3;
      arr[b] += velocities[b] * drift * 60;
      arr[b + 1] += velocities[b + 1] * drift * 60;
      arr[b + 2] += velocities[b + 2] * drift * 60;

      if (state === 'dispatching') {
        const dx = arr[b], dy = arr[b + 1], dz = arr[b + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0.01) {
          arr[b] += (dx / dist) * 0.003;
          arr[b + 1] += (dy / dist) * 0.003;
          arr[b + 2] += (dz / dist) * 0.003;
        }
      }

      if (amp > 0.05) {
        const dx = arr[b], dy = arr[b + 1], dz = arr[b + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0.01) {
          arr[b] += (dx / dist) * amp * 0.001;
          arr[b + 1] += (dy / dist) * amp * 0.001;
          arr[b + 2] += (dz / dist) * amp * 0.001;
        }
      }

      const dx = arr[b], dy = arr[b + 1], dz = arr[b + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 0.88) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * 0.5;
        arr[b] = r * Math.sin(phi) * Math.cos(theta);
        arr[b + 1] = r * Math.sin(phi) * Math.sin(theta);
        arr[b + 2] = r * Math.cos(phi);
      }
    }

    // Ring speed: use average of ring speeds for outer particle orbit
    const avgRingSpeed = (c.ringSpeed1 + c.ringSpeed2 + c.ringSpeed3) / 3;
    for (let i = innerCount; i < count; i++) {
      const b = i * 3;
      const ringGroup = orbitData[i * 3 + 2];
      const radius = orbitData[i * 3 + 1];
      const speedMul = velocities[b];

      const angle = orbitData[i * 3] + t * speedMul * avgRingSpeed * 0.5;

      let x = Math.cos(angle) * radius;
      let y = 0;
      let z = Math.sin(angle) * radius;

      if (ringGroup === 1) {
        const tiltAngle = Math.PI / 6;
        const cosT = Math.cos(tiltAngle);
        const sinT = Math.sin(tiltAngle);
        const ny = y * cosT - z * sinT;
        const nz = y * sinT + z * cosT;
        y = ny;
        z = nz;
      } else if (ringGroup === 2) {
        const tiltAngle = -Math.PI / 6;
        const cosT = Math.cos(tiltAngle);
        const sinT = Math.sin(tiltAngle);
        const ny = y * cosT - z * sinT;
        const nz = y * sinT + z * cosT;
        y = ny;
        z = nz;
      }

      arr[b] = x;
      arr[b + 1] = y;
      arr[b + 2] = z;
    }

    ref.current.geometry.attributes.position.needsUpdate = true;

    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = lerpVal(mat.opacity, c.particleBrightness);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        color={C_GLOW}
        size={0.015}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Orbital Ring with Light Rails (white/hot-white rails)                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ringVert = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uGlow;
  uniform float uPulseSpeed;
  uniform float uRotOffset;
  uniform float uBrightness;
  uniform float uRail0;
  uniform float uRail1;
  uniform float uRail2;
  uniform float uRail3;
  uniform float uRail4;
  uniform float uRail5;
  uniform float uRail6;
  uniform float uRail7;
  varying vec2 vUv;

  void main(){
    float d = abs(vUv.y - 0.5) * 2.0;
    float ring = 1.0 - smoothstep(0.0, 0.8, d);
    ring = pow(ring, 2.0);

    float pulse = sin(uTime * uPulseSpeed) * 0.15 + 1.0;

    float angle = vUv.x;

    float trailAngle = fract(uTime * 0.15 + uRotOffset);
    float trailDist = min(abs(angle - trailAngle), min(abs(angle - trailAngle + 1.0), abs(angle - trailAngle - 1.0)));
    float trail = exp(-trailDist * 8.0) * 0.6;

    // Light rails — 8 bright points
    float rails = 0.0;
    float r0 = min(abs(angle - fract(uRail0)), min(abs(angle - fract(uRail0) + 1.0), abs(angle - fract(uRail0) - 1.0)));
    rails += exp(-r0 * 60.0) * 1.2;
    float r1 = min(abs(angle - fract(uRail1)), min(abs(angle - fract(uRail1) + 1.0), abs(angle - fract(uRail1) - 1.0)));
    rails += exp(-r1 * 60.0) * 1.0;
    float r2 = min(abs(angle - fract(uRail2)), min(abs(angle - fract(uRail2) + 1.0), abs(angle - fract(uRail2) - 1.0)));
    rails += exp(-r2 * 60.0) * 0.9;
    float r3 = min(abs(angle - fract(uRail3)), min(abs(angle - fract(uRail3) + 1.0), abs(angle - fract(uRail3) - 1.0)));
    rails += exp(-r3 * 60.0) * 0.8;
    float r4 = min(abs(angle - fract(uRail4)), min(abs(angle - fract(uRail4) + 1.0), abs(angle - fract(uRail4) - 1.0)));
    rails += exp(-r4 * 55.0) * 1.1;
    float r5 = min(abs(angle - fract(uRail5)), min(abs(angle - fract(uRail5) + 1.0), abs(angle - fract(uRail5) - 1.0)));
    rails += exp(-r5 * 55.0) * 0.85;
    float r6 = min(abs(angle - fract(uRail6)), min(abs(angle - fract(uRail6) + 1.0), abs(angle - fract(uRail6) - 1.0)));
    rails += exp(-r6 * 50.0) * 0.7;
    float r7 = min(abs(angle - fract(uRail7)), min(abs(angle - fract(uRail7) + 1.0), abs(angle - fract(uRail7) - 1.0)));
    rails += exp(-r7 * 50.0) * 0.65;

    float intensity = (ring * pulse * 0.25 + trail + rails) * uGlow * uBrightness;

    // Base ring color
    vec3 col = uColor * (ring * pulse * 0.4 + trail * 0.6);
    // Light rails are WHITE / hot-white (#FDDDE1) — not red
    vec3 railColor = vec3(0.992, 0.867, 0.882); // #FDDDE1
    col += mix(railColor, vec3(1.0, 1.0, 1.0), 0.5) * rails;

    float alpha = clamp(intensity, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;

interface OrbitalRingProps {
  state: SphereState;
  amp: number;
  radius: number;
  tiltX: number;
  rotDirection: number;
  ringIndex: number; // 0, 1, or 2 to pick per-ring speed
  brightness: number;
  tubeRadius?: number;
}

function OrbitalRing({
  state, amp, radius, tiltX, rotDirection, ringIndex, brightness, tubeRadius = 0.018,
}: OrbitalRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const railSpeeds = useMemo(() => {
    const speeds: number[] = [];
    for (let i = 0; i < 8; i++) {
      speeds.push((0.2 + Math.random() * 0.6) * (Math.random() > 0.3 ? 1 : -1));
    }
    return speeds;
  }, []);

  const railOffsets = useMemo(() => {
    const offsets: number[] = [];
    for (let i = 0; i < 8; i++) {
      offsets.push(Math.random());
    }
    return offsets;
  }, []);

  const u = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: C_PRIMARY.clone() },
    uGlow: { value: 0.5 },
    uPulseSpeed: { value: 0.8 },
    uRotOffset: { value: Math.random() },
    uBrightness: { value: brightness },
    uRail0: { value: 0 },
    uRail1: { value: 0 },
    uRail2: { value: 0 },
    uRail3: { value: 0 },
    uRail4: { value: 0 },
    uRail5: { value: 0 },
    uRail6: { value: 0 },
    uRail7: { value: 0 },
  }), []);

  // Current lerped ring speed
  const curRingSpeed = useRef(0.3);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = tgt.current;
    u.uTime.value = t;
    u.uColor.value.lerp(c.coreColor, 0.05);
    u.uGlow.value = lerpVal(u.uGlow.value, c.equatorGlow + amp * 0.2);
    u.uPulseSpeed.value = lerpVal(u.uPulseSpeed.value, c.equatorPulseSpeed);
    u.uBrightness.value = lerpVal(u.uBrightness.value, brightness * c.ringBrightness);

    // Get per-ring speed
    const ringSpeedTarget = ringIndex === 0 ? c.ringSpeed1 : ringIndex === 1 ? c.ringSpeed2 : c.ringSpeed3;
    curRingSpeed.current = lerpVal(curRingSpeed.current, ringSpeedTarget);
    const ringSpd = curRingSpeed.current;

    // Rail speed: 2x faster travel (multiply by railSpeed from config)
    const railSpd = ringSpd * c.railSpeed;
    u.uRail0.value = railOffsets[0] + t * railSpeeds[0] * railSpd;
    u.uRail1.value = railOffsets[1] + t * railSpeeds[1] * railSpd;
    u.uRail2.value = railOffsets[2] + t * railSpeeds[2] * railSpd;
    u.uRail3.value = railOffsets[3] + t * railSpeeds[3] * railSpd;
    u.uRail4.value = railOffsets[4] + t * railSpeeds[4] * railSpd;
    u.uRail5.value = railOffsets[5] + t * railSpeeds[5] * railSpd;
    u.uRail6.value = railOffsets[6] + t * railSpeeds[6] * railSpd;
    u.uRail7.value = railOffsets[7] + t * railSpeeds[7] * railSpd;

    if (meshRef.current) {
      meshRef.current.rotation.y += rotDirection * ringSpd * 0.003;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI * 0.5 + tiltX, 0, 0]}>
      <torusGeometry args={[radius, tubeRadius, 16, 256]} />
      <shaderMaterial
        vertexShader={ringVert}
        fragmentShader={ringFrag}
        uniforms={u}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Background Glow                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function BackgroundGlow({ state, amp }: { state: SphereState; amp: number }) {
  const ref = useRef<THREE.Sprite>(null);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const [glowTex, setGlowTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    setGlowTex(new THREE.CanvasTexture(canvas));
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const c = tgt.current;
    const pulse = Math.sin(t * 0.5) * 0.08 + 1.0;
    const scale = 4.0 * pulse * (1.0 + amp * 0.15);
    ref.current.scale.set(scale, scale, 1);
    const mat = ref.current.material as THREE.SpriteMaterial;
    mat.color.lerp(c.coreColor, 0.02);
    mat.opacity = lerpVal(mat.opacity, c.glowIntensity + amp * 0.03, 0.03);
  });

  if (!glowTex) return null;

  return (
    <sprite ref={ref} position={[0, 0, -0.5]} scale={[4, 4, 1]} renderOrder={-2}>
      <spriteMaterial
        map={glowTex}
        color={C_PRIMARY}
        transparent
        opacity={0.08}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </sprite>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Scene Assembly                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SphereScene({ state, amplitude }: { state: SphereState; amplitude: number }) {
  return (
    <>
      <ambientLight intensity={0.05} color="#D72638" />

      <BackgroundGlow state={state} amp={amplitude} />

      <InnerPlasma state={state} amp={amplitude} />

      <FloatingParticles state={state} amp={amplitude} />

      <WhiteSparkles state={state} />

      <EquatorFlash state={state} />

      {/* Logo baked into plasma shader — rotates with globe */}

      <GlassSphereFrame state={state} />

      {/* Ring 1: Equator — 3x faster */}
      <OrbitalRing
        state={state}
        amp={amplitude}
        radius={1.15}
        tiltX={0}
        rotDirection={1}
        ringIndex={0}
        brightness={1.0}
      />

      {/* Ring 2: Tilted +30deg — 4x faster */}
      <OrbitalRing
        state={state}
        amp={amplitude}
        radius={1.2}
        tiltX={Math.PI / 6}
        rotDirection={-1}
        ringIndex={1}
        brightness={0.65}
        tubeRadius={0.015}
      />

      {/* Ring 3: Tilted -30deg — 5x faster */}
      <OrbitalRing
        state={state}
        amp={amplitude}
        radius={1.25}
        tiltX={-Math.PI / 6}
        rotDirection={1}
        ringIndex={2}
        brightness={0.4}
        tubeRadius={0.012}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Export                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SphereAnimated({ state, size = 140, audioAmplitude = 0, onClick }: SphereProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Memelli AI Sphere"
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1.5, 2.5]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.4;
        }}
      >
        <SphereScene state={state} amplitude={audioAmplitude} />
      </Canvas>
    </div>
  );
}
