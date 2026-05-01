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

interface SphereCustomProps {
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  State Configuration                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface StateCfg {
  coreColor: THREE.Color;
  glowIntensity: number;
  rotSpeed: number;
  energyIntensity: number;
  particleSpeed: number;
  ringBrightness: number;
  flash: number;
}

function getStateCfg(state: SphereState): StateCfg {
  switch (state) {
    case 'idle': return {
      coreColor: C_PRIMARY.clone(), glowIntensity: 1.0, rotSpeed: 0.15,
      energyIntensity: 0.6, particleSpeed: 0.06, ringBrightness: 0.5, flash: 0,
    };
    case 'listening': return {
      coreColor: C_ENERGY.clone(), glowIntensity: 1.6, rotSpeed: 0.4,
      energyIntensity: 1.0, particleSpeed: 0.25, ringBrightness: 0.9, flash: 0.15,
    };
    case 'thinking': return {
      coreColor: C_HOT.clone(), glowIntensity: 2.2, rotSpeed: 1.8,
      energyIntensity: 1.5, particleSpeed: 0.9, ringBrightness: 1.3, flash: 0.4,
    };
    case 'speaking': return {
      coreColor: C_PRIMARY.clone(), glowIntensity: 1.5, rotSpeed: 0.5,
      energyIntensity: 1.2, particleSpeed: 0.35, ringBrightness: 1.1, flash: 0.2,
    };
    case 'dispatching': return {
      coreColor: C_ENERGY.clone(), glowIntensity: 2.8, rotSpeed: 2.5,
      energyIntensity: 2.0, particleSpeed: 1.3, ringBrightness: 1.6, flash: 0.7,
    };
    case 'error': return {
      coreColor: C_DEEP.clone(), glowIntensity: 1.8, rotSpeed: 0.04,
      energyIntensity: 0.8, particleSpeed: 0.02, ringBrightness: 0.4, flash: 0.9,
    };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Shared Simplex Noise GLSL                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const NOISE_GLSL = /* glsl */ `
  vec4 pm(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 ti(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0,.5,1,2);
    vec3 i=floor(v+dot(v,C.yyy)),x0=v-i+dot(i,C.xxx),g=step(x0.yzx,x0.xyz),l=1.-g;
    vec3 i1=min(g,l.zxy),i2=max(g,l.zxy),x1=x0-i1+C.xxx,x2=x0-i2+C.yyy,x3=x0-D.yyy;
    i=mod(i,289.);vec4 p=pm(pm(pm(i.z+vec4(0,i1.z,i2.z,1))+i.y+vec4(0,i1.y,i2.y,1))+i.x+vec4(0,i1.x,i2.x,1));
    float n_=1./7.;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z),y_=floor(j-7.*x_),x=x_*ns.x+ns.yyyy,y=y_*ns.x+ns.yyyy,h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy),b1=vec4(x.zw,y.zw),s0=floor(b0)*2.+1.,s1=floor(b1)*2.+1.,sh=-step(h,vec4(0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy,a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x),p1=vec3(a0.zw,h.y),p2=vec3(a1.xy,h.z),p3=vec3(a1.zw,h.w);
    vec4 norm=ti(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GLSL — Glass Plasma Core Shader (the main sphere)                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const coreVert = /* glsl */ `
  uniform float uTime;
  uniform float uDistortion;
  uniform float uAmp;
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying vec3 vViewDir;
  varying float vDisplacement;
  varying vec3 vLocalPos;

  ${NOISE_GLSL}

  void main(){
    vUv = uv;
    vLocalPos = position;
    vNorm = normalize(normalMatrix * normal);

    // Multi-octave displacement for organic surface
    float n1 = snoise(position * 2.0 + uTime * 0.25) * 0.5;
    float n2 = snoise(position * 4.5 + uTime * 0.4) * 0.25;
    float n3 = snoise(position * 9.0 + uTime * 0.7) * 0.125;
    float d = (n1 + n2 + n3) * uDistortion;
    d += uAmp * snoise(position * 6.0 + uTime * 2.5) * 0.12;
    vDisplacement = d;

    vec3 displaced = position + normal * d;
    vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
    vViewDir = normalize(cameraPosition - vWorldPos);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const coreFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uGlow;
  uniform float uFlash;
  uniform float uEnergyIntensity;
  uniform sampler2D uLogoTex;
  uniform float uLogoLoaded;
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  varying vec3 vViewDir;
  varying float vDisplacement;
  varying vec3 vLocalPos;

  ${NOISE_GLSL}

  void main(){
    vec3 N = normalize(vNorm);
    vec3 V = normalize(vViewDir);
    float NdV = max(dot(N, V), 0.0);

    // ── Fresnel: glass rim glow (bright edges, transparent center) ──
    float fresnelHard = pow(1.0 - NdV, 4.0);
    float fresnelSoft = pow(1.0 - NdV, 2.0);

    // ── Dark glass base ──
    vec3 glass = vec3(0.015, 0.008, 0.012);

    // ── Red plasma energy wisps (animated noise tendrils) ──
    float tendril1 = snoise(vLocalPos * 3.0 + vec3(uTime * 0.3, uTime * 0.15, -uTime * 0.2));
    float tendril2 = snoise(vLocalPos * 5.0 + vec3(-uTime * 0.4, uTime * 0.25, uTime * 0.35));
    float tendril3 = snoise(vLocalPos * 8.0 + vec3(uTime * 0.5, -uTime * 0.3, uTime * 0.15));

    // Shape tendrils into wispy plasma strands
    float wisp1 = pow(max(tendril1, 0.0), 2.5) * 0.7;
    float wisp2 = pow(max(tendril2, 0.0), 3.0) * 0.5;
    float wisp3 = pow(max(tendril3, 0.0), 4.0) * 0.4;
    float plasmaField = (wisp1 + wisp2 + wisp3) * uEnergyIntensity;

    // Plasma is visible deeper inside, less at glass edges
    float depthVisibility = smoothstep(0.0, 0.7, NdV);
    vec3 plasmaColor = uColor * plasmaField * depthVisibility * 1.4;

    // Hot core tendrils — brighter streaks
    float hotTendril = pow(max(snoise(vLocalPos * 6.0 + uTime * vec3(0.6, -0.3, 0.4)), 0.0), 6.0);
    vec3 hotStreak = vec3(1.0, 0.4, 0.3) * hotTendril * depthVisibility * uEnergyIntensity * 0.5;

    // ── Internal caustic patterns (light refracting inside glass) ──
    float c1 = pow(abs(sin(vLocalPos.x * 7.0 + vLocalPos.y * 5.0 + uTime * 0.35)), 10.0);
    float c2 = pow(abs(sin(vLocalPos.y * 9.0 - vLocalPos.z * 6.0 + uTime * 0.28)), 12.0);
    vec3 caustics = uColor * (c1 * 0.1 + c2 * 0.07) * depthVisibility;

    // ── Deep volumetric glow (soft inner illumination) ──
    float volumetric = pow(NdV, 1.5) * 0.12;
    vec3 innerGlow = uColor * volumetric;

    // ── Subsurface scattering ──
    vec3 lightDir = normalize(vec3(3.0, 4.0, 5.0));
    float sss = pow(max(dot(-N, lightDir), 0.0), 2.0) * 0.12;
    vec3 subsurface = uColor * sss;

    // ── Specular highlights (glass reflections) ──
    vec3 L1 = normalize(vec3(3.0, 4.0, 5.0));
    vec3 L2 = normalize(vec3(-4.0, -1.0, 3.0));
    vec3 L3 = normalize(vec3(1.0, -3.0, 2.0));
    vec3 H1 = normalize(V + L1);
    vec3 H2 = normalize(V + L2);
    vec3 H3 = normalize(V + L3);
    float s1 = pow(max(dot(N, H1), 0.0), 180.0) * 1.4;
    float s2 = pow(max(dot(N, H2), 0.0), 120.0) * 0.9;
    float s3 = pow(max(dot(N, H3), 0.0), 80.0) * 0.5;
    vec3 specular = vec3(1.0, 0.93, 0.92) * (s1 + s2 + s3);

    // ── Logo holographic etching ──
    vec3 logoContrib = vec3(0.0);
    if (uLogoLoaded > 0.5) {
      vec3 nPos = normalize(vLocalPos);
      float logoU = atan(nPos.x, nPos.z) / (2.0 * 3.14159265) + 0.5;
      float logoV = asin(clamp(nPos.y, -1.0, 1.0)) / 3.14159265 + 0.5;

      // Artwork offset compensation (-99px X, -106px Y in 4171x3754)
      float offsetU = -99.0 / 4171.0;
      float offsetV = 106.0 / 3754.0;

      float logoScale = 2.8;
      float centeredU = (logoU - 0.5 + offsetU) * logoScale + 0.5;
      float centeredV = (logoV - 0.5 + offsetV) * logoScale + 0.5;

      if (centeredU >= 0.0 && centeredU <= 1.0 && centeredV >= 0.0 && centeredV <= 1.0) {
        vec4 logoSample = texture2D(uLogoTex, vec2(centeredU, centeredV));
        float logoAlpha = logoSample.a * logoSample.r;

        float etchDepth = smoothstep(0.0, 0.75, NdV);
        float holoPulse = 0.88 + sin(uTime * 0.5) * 0.12;
        float holoShimmer = 1.0 + sin(uTime * 1.2 + vLocalPos.y * 5.0) * 0.06;

        vec3 logoColor = uColor * 1.6 + vec3(0.35, 0.1, 0.08);
        logoContrib = logoColor * logoAlpha * etchDepth * holoPulse * holoShimmer * 0.55;

        // Glow halo around logo edges
        float edgeGlow = smoothstep(0.0, 0.12, logoAlpha) * (1.0 - smoothstep(0.12, 0.45, logoAlpha));
        logoContrib += uColor * edgeGlow * etchDepth * 0.25;
      }
    }

    // ── Compose ──
    vec3 col = glass;
    col += innerGlow;
    col += caustics;
    col += plasmaColor;
    col += hotStreak;
    col += subsurface;
    col += logoContrib;

    // Fresnel rim: brand-colored edge glow
    col += uColor * fresnelHard * 0.9;
    col += vec3(1.0, 0.88, 0.88) * fresnelHard * 0.12;

    // Secondary soft rim for glass depth
    col += uColor * 0.08 * fresnelSoft;

    // Specular on top
    col += specular;

    // State flash
    col += vec3(1.0, 0.35, 0.25) * uFlash;

    // Glow multiplier
    col *= uGlow;

    // Glass alpha: transparent center, more opaque at edges + energy
    float alpha = 0.3 + fresnelHard * 0.55 + plasmaField * 0.15;
    alpha = clamp(alpha, 0.2, 0.95);

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GLSL — Outer Glow Shell (fake bloom via additive blended larger sphere)  */
/* ═══════════════════════════════════════════════════════════════════════════ */

const outerGlowVert = /* glsl */ `
  varying vec3 vNorm;
  varying vec3 vWorldPos;

  void main(){
    vNorm = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const outerGlowFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGlow;
  varying vec3 vNorm;
  varying vec3 vWorldPos;

  void main(){
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 N = normalize(vNorm);
    float NdV = max(dot(N, V), 0.0);

    // Inverse fresnel: glow at edges, fade toward center
    float rim = pow(1.0 - NdV, 2.5);

    // Very soft atmospheric glow
    vec3 col = uColor * rim * 1.2;
    float alpha = rim * 0.18 * uGlow;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GLSL — Inner Shell (back-face depth layer)                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

const innerShellVert = /* glsl */ `
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main(){
    vNorm = normalize(normalMatrix * normal);
    vLocalPos = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const innerShellFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uGlow;
  varying vec3 vNorm;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main(){
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 N = normalize(-vNorm);
    float NdV = max(dot(N, V), 0.0);

    float innerFresnel = pow(NdV, 2.0);
    vec3 col = uColor * 0.05 * innerFresnel;

    // Internal ripple caustics
    float ripple = sin(vLocalPos.x * 11.0 + vLocalPos.z * 7.0 + uTime * 0.5) *
                   sin(vLocalPos.y * 9.0 - uTime * 0.35);
    col += uColor * pow(abs(ripple), 7.0) * 0.06;

    float alpha = 0.1 * innerFresnel + 0.02;
    col *= uGlow;

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GLSL — Equator Ring Shader                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

const eqRingVert = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const eqRingFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBrightness;
  varying vec2 vUv;

  void main(){
    // Ring cross-section brightness
    float d = abs(vUv.y - 0.5) * 2.0;
    float ring = 1.0 - smoothstep(0.0, 0.7, d);
    ring = pow(ring, 1.8);

    // Pulse
    float pulse = sin(uTime * 1.8 + vUv.x * 6.28318) * 0.15 + 1.0;

    // Traveling energy hotspots
    float hot1 = pow(sin(vUv.x * 12.566 + uTime * 2.5) * 0.5 + 0.5, 7.0) * 0.5;
    float hot2 = pow(sin(vUv.x * 9.42 - uTime * 1.8) * 0.5 + 0.5, 9.0) * 0.35;

    float alpha = (ring * pulse + hot1 + hot2) * uBrightness;
    vec3 col = mix(uColor, uColor * 2.2, hot1 + hot2);

    gl_FragColor = vec4(col * 1.6, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Plasma Core (main glass sphere with energy wisps and logo)               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PlasmaCore({ state, amp }: { state: SphereState; amp: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const target = useRef(getStateCfg(state));
  const flashVal = useRef(0);
  const prevState = useRef(state);

  useEffect(() => {
    target.current = getStateCfg(state);
    if (prevState.current !== state) {
      flashVal.current = 1.0;
      prevState.current = state;
    }
  }, [state]);

  // Load logo
  const [logoTex, setLogoTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    new THREE.TextureLoader().load('/memelli-logo-white.png', (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.anisotropy = 16;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      setLogoTex(t);
    });
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAmp: { value: 0 },
    uDistortion: { value: 0.02 },
    uColor: { value: C_PRIMARY.clone() },
    uGlow: { value: 1.0 },
    uFlash: { value: 0 },
    uEnergyIntensity: { value: 0.6 },
    uLogoTex: { value: null as THREE.Texture | null },
    uLogoLoaded: { value: 0 },
  }), []);

  useEffect(() => {
    if (logoTex) {
      uniforms.uLogoTex.value = logoTex;
      uniforms.uLogoLoaded.value = 1.0;
    }
  }, [logoTex, uniforms]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = target.current;
    const u = uniforms;

    u.uTime.value = t;
    u.uAmp.value = amp;
    u.uDistortion.value += (c.energyIntensity * 0.06 - u.uDistortion.value) * 0.05;
    u.uColor.value.lerp(c.coreColor, 0.04);
    u.uGlow.value += (c.glowIntensity - u.uGlow.value) * 0.04;
    u.uEnergyIntensity.value += (c.energyIntensity - u.uEnergyIntensity.value) * 0.05;

    flashVal.current *= 0.92;
    if (flashVal.current < 0.005) flashVal.current = 0;
    u.uFlash.value = flashVal.current;

    if (meshRef.current) {
      meshRef.current.rotation.y += c.rotSpeed * 0.005;
      meshRef.current.rotation.x += Math.sin(t * 0.1) * 0.0008;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.88, 128]} />
      <shaderMaterial
        vertexShader={coreVert}
        fragmentShader={coreFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Outer Glow Shell (fake bloom — slightly larger additive sphere)          */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OuterGlowShell({ state }: { state: SphereState }) {
  const target = useRef(getStateCfg(state));
  useEffect(() => { target.current = getStateCfg(state); }, [state]);

  const uniforms = useMemo(() => ({
    uColor: { value: C_PRIMARY.clone() },
    uGlow: { value: 1.0 },
  }), []);

  useFrame(() => {
    const c = target.current;
    uniforms.uColor.value.lerp(c.coreColor, 0.04);
    uniforms.uGlow.value += (c.glowIntensity - uniforms.uGlow.value) * 0.04;
  });

  return (
    <mesh>
      <icosahedronGeometry args={[0.98, 64]} />
      <shaderMaterial
        vertexShader={outerGlowVert}
        fragmentShader={outerGlowFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Second Outer Glow (even larger, softer atmospheric haze)                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const atmoGlowFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGlow;
  varying vec3 vNorm;
  varying vec3 vWorldPos;

  void main(){
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 N = normalize(vNorm);
    float NdV = max(dot(N, V), 0.0);
    float rim = pow(1.0 - NdV, 3.5);

    vec3 col = uColor * rim * 0.6;
    float alpha = rim * 0.08 * uGlow;

    gl_FragColor = vec4(col, alpha);
  }
`;

function AtmosphericGlow({ state }: { state: SphereState }) {
  const target = useRef(getStateCfg(state));
  useEffect(() => { target.current = getStateCfg(state); }, [state]);

  const uniforms = useMemo(() => ({
    uColor: { value: C_PRIMARY.clone() },
    uGlow: { value: 1.0 },
  }), []);

  useFrame(() => {
    const c = target.current;
    uniforms.uColor.value.lerp(c.coreColor, 0.04);
    uniforms.uGlow.value += (c.glowIntensity - uniforms.uGlow.value) * 0.04;
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1.12, 48]} />
      <shaderMaterial
        vertexShader={outerGlowVert}
        fragmentShader={atmoGlowFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Inner Glass Shell (back-face layer for depth)                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function InnerGlassShell({ state }: { state: SphereState }) {
  const target = useRef(getStateCfg(state));
  useEffect(() => { target.current = getStateCfg(state); }, [state]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: C_PRIMARY.clone() },
    uGlow: { value: 1.0 },
  }), []);

  useFrame(({ clock }) => {
    const c = target.current;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uColor.value.lerp(c.coreColor, 0.04);
    uniforms.uGlow.value += (c.glowIntensity - uniforms.uGlow.value) * 0.04;
  });

  return (
    <mesh>
      <icosahedronGeometry args={[0.84, 96]} />
      <shaderMaterial
        vertexShader={innerShellVert}
        fragmentShader={innerShellFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Equator Ring (thin glowing ring around the equator)                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function EquatorRing({ state, amp }: { state: SphereState; amp: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const target = useRef(getStateCfg(state));
  useEffect(() => { target.current = getStateCfg(state); }, [state]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: C_PRIMARY.clone() },
    uBrightness: { value: 0.5 },
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = target.current;
    uniforms.uTime.value = t;
    uniforms.uColor.value.lerp(c.coreColor, 0.04);
    uniforms.uBrightness.value += (c.ringBrightness - uniforms.uBrightness.value) * 0.05;

    if (meshRef.current) {
      // Subtle wobble
      meshRef.current.rotation.x = Math.PI * 0.5 + Math.sin(t * 0.12) * 0.02;
      meshRef.current.rotation.z = Math.cos(t * 0.1) * 0.015;
      // Audio reactivity
      const s = 1.0 + amp * 0.06;
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI * 0.5, 0, 0]}>
      <torusGeometry args={[0.95, 0.018, 24, 256]} />
      <shaderMaterial
        vertexShader={eqRingVert}
        fragmentShader={eqRingFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Ring Glow Sprite (additive sprite behind equator ring for bloom effect)  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function RingGlowSprite({ state }: { state: SphereState }) {
  const ref = useRef<THREE.Sprite>(null);
  const target = useRef(getStateCfg(state));
  useEffect(() => { target.current = getStateCfg(state); }, [state]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const c = target.current;
    const pulse = Math.sin(t * 0.6) * 0.04 + 0.96;
    const s = 2.4 * pulse;
    ref.current.scale.set(s, s * 0.15, 1);
    const mat = ref.current.material as THREE.SpriteMaterial;
    mat.color.lerp(c.coreColor, 0.03);
    mat.opacity = 0.06 * c.ringBrightness;
  });

  return (
    <sprite ref={ref} scale={[2.4, 0.36, 1]} renderOrder={-2}>
      <spriteMaterial
        color={C_PRIMARY}
        transparent
        opacity={0.04}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Internal Floating Particles                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function InternalParticles({ state, amp }: { state: SphereState; amp: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 400;
  const target = useRef(getStateCfg(state));
  useEffect(() => { target.current = getStateCfg(state); }, [state]);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      // All particles inside the sphere
      const r = 0.1 + Math.random() * 0.72;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      vel[i * 3]     = (Math.random() - 0.5) * 0.0015;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.0015;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.0015;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const c = target.current;
    const sp = c.particleSpeed;

    ref.current.rotation.y = t * sp * 0.06;
    ref.current.rotation.x = Math.sin(t * 0.06) * 0.08;

    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const b = i * 3;
      arr[b]     += velocities[b] * sp;
      arr[b + 1] += velocities[b + 1] * sp;
      arr[b + 2] += velocities[b + 2] * sp;

      // Audio push outward
      if (amp > 0.08) {
        const dx = arr[b], dy = arr[b + 1], dz = arr[b + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0.01) {
          arr[b]     += (dx / dist) * amp * 0.0015;
          arr[b + 1] += (dy / dist) * amp * 0.0015;
          arr[b + 2] += (dz / dist) * amp * 0.0015;
        }
      }

      // Keep particles inside sphere
      const dx = arr[b], dy = arr[b + 1], dz = arr[b + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 0.82 || dist < 0.05) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 0.1 + Math.random() * 0.65;
        arr[b]     = r * Math.sin(phi) * Math.cos(theta);
        arr[b + 1] = r * Math.sin(phi) * Math.sin(theta);
        arr[b + 2] = r * Math.cos(phi);
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;

    const mat = ref.current.material as THREE.PointsMaterial;
    const targetOpacity = 0.2 + c.glowIntensity * 0.15;
    mat.opacity += (targetOpacity - mat.opacity) * 0.04;
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
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Volumetric Halo Sprite (soft backglow behind everything)                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function VolumetricHalo({ state, amp }: { state: SphereState; amp: number }) {
  const ref = useRef<THREE.Sprite>(null);
  const target = useRef(getStateCfg(state));
  useEffect(() => { target.current = getStateCfg(state); }, [state]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const c = target.current;
    const pulse = Math.sin(t * 0.7) * 0.05 + 0.95;
    const s = 3.6 * pulse * (1.0 + amp * 0.15);
    ref.current.scale.set(s, s, 1);
    const mat = ref.current.material as THREE.SpriteMaterial;
    mat.color.lerp(c.coreColor, 0.03);
    mat.opacity = 0.06 + amp * 0.03 + c.flash * 0.02;
  });

  return (
    <sprite ref={ref} scale={[3.6, 3.6, 1]} renderOrder={-3}>
      <spriteMaterial
        color={C_PRIMARY}
        transparent
        opacity={0.06}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Core Point Light                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CoreLight({ state, amp }: { state: SphereState; amp: number }) {
  const ref = useRef<THREE.PointLight>(null);
  const target = useRef(getStateCfg(state));
  useEffect(() => { target.current = getStateCfg(state); }, [state]);
  const col = useRef(C_PRIMARY.clone());

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const c = target.current;
    col.current.lerp(c.coreColor, 0.04);
    ref.current.color.copy(col.current);
    ref.current.intensity = c.glowIntensity * 0.7 +
      Math.sin(clock.getElapsedTime() * 0.7) * 0.12 + amp * 0.3;
  });

  return <pointLight ref={ref} position={[0, 0, 0]} intensity={0.7} distance={5} decay={2} />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Scene Assembly — NO EffectComposer, NO Bloom                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SphereScene({ state, amplitude }: { state: SphereState; amplitude: number }) {
  return (
    <>
      {/* Subtle ambient + directional lighting for glass feel */}
      <ambientLight intensity={0.06} color="#D72638" />
      <directionalLight position={[3, 4, 5]} intensity={0.35} color="#E84855" />
      <directionalLight position={[-3, -2, 3]} intensity={0.25} color="#F07080" />
      <directionalLight position={[0, -3, 2]} intensity={0.15} color="#FDDDE1" />

      {/* Core illumination from center */}
      <CoreLight state={state} amp={amplitude} />

      {/* Volumetric halo (farthest back) */}
      <VolumetricHalo state={state} amp={amplitude} />

      {/* Atmospheric glow shell (second layer of fake bloom) */}
      <AtmosphericGlow state={state} />

      {/* Outer glow shell (primary fake bloom layer) */}
      <OuterGlowShell state={state} />

      {/* Inner glass shell (back-face depth) */}
      <InnerGlassShell state={state} />

      {/* Main glass plasma core with energy wisps and logo */}
      <PlasmaCore state={state} amp={amplitude} />

      {/* Equator ring glow sprite (behind ring) */}
      <RingGlowSprite state={state} />

      {/* Thin equator ring */}
      <EquatorRing state={state} amp={amplitude} />

      {/* Internal floating particles */}
      <InternalParticles state={state} amp={amplitude} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Export                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SphereCustom({
  state,
  size = 140,
  audioAmplitude = 0,
  onClick,
}: SphereCustomProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Memelli AI Sphere"
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1.5, 2.5]}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.4;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <SphereScene state={state} amplitude={audioAmplitude} />
      </Canvas>
    </div>
  );
}
