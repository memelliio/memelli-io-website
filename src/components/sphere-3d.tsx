'use client';

import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sound Engine                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

class SphereAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private getCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.1;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return { ctx: this.ctx, master: this.masterGain! };
  }

  private playTone(freq: number, dur: number, type: OscillatorType = 'sine', delay = 0) {
    const { ctx, master } = this.getCtx();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.value = 0;
    const t = ctx.currentTime + delay;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.5, t + 0.03);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(env);
    env.connect(master);
    osc.start(t);
    osc.stop(t + dur);
  }

  activate() { this.playTone(523, 0.3); this.playTone(659, 0.3, 'sine', 0.08); this.playTone(784, 0.4, 'sine', 0.16); }
  listen() { this.playTone(440, 0.15); this.playTone(554, 0.12, 'sine', 0.06); }
  think() { this.playTone(330, 0.2, 'triangle'); this.playTone(392, 0.15, 'triangle', 0.1); }
  speak() { this.playTone(523, 0.12); this.playTone(659, 0.15, 'sine', 0.05); }
  dispatch() { this.playTone(392, 0.1, 'sawtooth'); this.playTone(784, 0.2, 'triangle', 0.1); }
  error() { this.playTone(440, 0.2, 'square'); this.playTone(370, 0.3, 'square', 0.1); }
  deactivate() { this.playTone(784, 0.3); this.playTone(523, 0.4, 'sine', 0.2); }
}

const sphereAudio = typeof window !== 'undefined' ? new SphereAudio() : null;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  State Configuration                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Cfg {
  coreColor: THREE.Color;
  coreGlow: number;
  distortion: number;
  rotSpeed: number;
  ringGlow: number;
  ringSpeed: number;
  ringPulse: number;
  particleSpeed: number;
  particleGlow: number;
  bloom: number;
  flash: number;
  waveActive: boolean;
  waveSpeed: number;
  orbitActive: boolean;
  orbitSpeed: number;
}

function cfg(state: SphereState): Cfg {
  switch (state) {
    case 'idle': return {
      coreColor: C_PRIMARY.clone(), coreGlow: 1.0, distortion: 0.02, rotSpeed: 0.2,
      ringGlow: 0.4, ringSpeed: 0.3, ringPulse: 0.1,
      particleSpeed: 0.08, particleGlow: 0.3, bloom: 2.0, flash: 0,
      waveActive: false, waveSpeed: 0, orbitActive: false, orbitSpeed: 0,
    };
    case 'listening': return {
      coreColor: C_ENERGY.clone(), coreGlow: 1.8, distortion: 0.05, rotSpeed: 0.5,
      ringGlow: 0.8, ringSpeed: 0.8, ringPulse: 0.4,
      particleSpeed: 0.3, particleGlow: 0.6, bloom: 2.8, flash: 0.2,
      waveActive: true, waveSpeed: 1.5, orbitActive: true, orbitSpeed: 1.0,
    };
    case 'thinking': return {
      coreColor: C_HOT.clone(), coreGlow: 2.5, distortion: 0.1, rotSpeed: 2.0,
      ringGlow: 1.2, ringSpeed: 2.0, ringPulse: 0.8,
      particleSpeed: 1.0, particleGlow: 0.9, bloom: 3.5, flash: 0.5,
      waveActive: false, waveSpeed: 0, orbitActive: true, orbitSpeed: 4.0,
    };
    case 'speaking': return {
      coreColor: C_PRIMARY.clone(), coreGlow: 1.6, distortion: 0.06, rotSpeed: 0.6,
      ringGlow: 1.0, ringSpeed: 1.2, ringPulse: 1.0,
      particleSpeed: 0.4, particleGlow: 0.7, bloom: 3.0, flash: 0.3,
      waveActive: true, waveSpeed: 2.5, orbitActive: true, orbitSpeed: 0.8,
    };
    case 'dispatching': return {
      coreColor: C_ENERGY.clone(), coreGlow: 3.0, distortion: 0.15, rotSpeed: 3.0,
      ringGlow: 1.5, ringSpeed: 3.0, ringPulse: 1.0,
      particleSpeed: 1.5, particleGlow: 1.0, bloom: 4.0, flash: 0.8,
      waveActive: true, waveSpeed: 3.0, orbitActive: true, orbitSpeed: 6.0,
    };
    case 'error': return {
      coreColor: C_DEEP.clone(), coreGlow: 2.0, distortion: 0.12, rotSpeed: 0.05,
      ringGlow: 0.6, ringSpeed: 0.1, ringPulse: 0,
      particleSpeed: 0.03, particleGlow: 0.3, bloom: 2.5, flash: 1.0,
      waveActive: false, waveSpeed: 0, orbitActive: false, orbitSpeed: 0,
    };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GLSL — Glass Orb Core (premium glassmorphic sphere with baked logo)      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const glassVert = /* glsl */ `
  uniform float uTime;
  uniform float uDist;
  uniform float uAmp;
  varying vec3 vNorm;
  varying vec3 vWPos;
  varying vec2 vUv;
  varying vec3 vViewDir;
  varying float vDisp;
  varying vec3 vLocalPos;

  // Simplex noise
  vec4 pm(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 ti(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float sn(vec3 v){
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

  void main(){
    vUv = uv;
    vLocalPos = position;
    vNorm = normalize(normalMatrix * normal);

    // Multi-octave noise displacement
    float d = (sn(position * 2.0 + uTime * 0.3) * 0.5
             + sn(position * 4.0 + uTime * 0.5) * 0.25
             + sn(position * 8.0 + uTime * 0.8) * 0.125) * uDist;
    d += uAmp * sn(position * 5.0 + uTime * 3.0) * 0.15;
    vDisp = d;

    vec3 p = position + normal * d;
    vWPos = (modelMatrix * vec4(p, 1.0)).xyz;
    vViewDir = normalize(cameraPosition - vWPos);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const glassFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uGlow;
  uniform float uFlash;
  uniform sampler2D uLogoTex;
  uniform float uLogoLoaded;
  varying vec3 vNorm;
  varying vec3 vWPos;
  varying vec2 vUv;
  varying vec3 vViewDir;
  varying float vDisp;
  varying vec3 vLocalPos;

  void main(){
    vec3 N = normalize(vNorm);
    vec3 V = normalize(vViewDir);
    float NdV = max(dot(N, V), 0.0);

    // ── Fresnel (glass rim glow) ──
    float fresnel = pow(1.0 - NdV, 3.5);
    float fresnelSoft = pow(1.0 - NdV, 1.8);

    // ── Glass base: translucent dark interior with depth ──
    vec3 glassBase = vec3(0.02, 0.01, 0.015);

    // ── Internal caustics: light patterns refracting inside glass ──
    float caustic1 = pow(abs(sin(vLocalPos.x * 8.0 + vLocalPos.y * 6.0 + uTime * 0.4)), 8.0);
    float caustic2 = pow(abs(sin(vLocalPos.y * 10.0 - vLocalPos.z * 7.0 + uTime * 0.3)), 10.0);
    float caustic3 = pow(abs(sin(vLocalPos.z * 9.0 + vLocalPos.x * 5.0 - uTime * 0.5)), 12.0);
    vec3 caustics = uColor * (caustic1 * 0.15 + caustic2 * 0.12 + caustic3 * 0.08);

    // ── Internal glow: soft volumetric light inside the glass ──
    float depthFactor = smoothstep(0.0, 1.0, NdV);
    vec3 internalGlow = uColor * 0.15 * depthFactor;

    // ── Plasma energy beneath glass surface ──
    float plasma = sin(vDisp * 10.0 + uTime) * 0.5 + 0.5;
    vec3 plasmaColor = mix(uColor * 0.08, uColor * 0.4, plasma);
    plasmaColor *= (1.0 - fresnel * 0.5); // visible deeper, less at edges

    // ── Specular highlights: sharp glass reflections ──
    vec3 lightDir1 = normalize(vec3(3.0, 4.0, 5.0));
    vec3 lightDir2 = normalize(vec3(-3.0, -2.0, 3.0));
    vec3 lightDir3 = normalize(vec3(0.0, -3.0, 2.0));
    vec3 H1 = normalize(V + lightDir1);
    vec3 H2 = normalize(V + lightDir2);
    vec3 H3 = normalize(V + lightDir3);
    float spec1 = pow(max(dot(N, H1), 0.0), 128.0) * 1.2;
    float spec2 = pow(max(dot(N, H2), 0.0), 96.0) * 0.8;
    float spec3 = pow(max(dot(N, H3), 0.0), 64.0) * 0.5;
    vec3 specular = vec3(1.0, 0.92, 0.9) * (spec1 + spec2 + spec3);

    // ── Subsurface scattering approximation ──
    float sss = pow(max(dot(-N, lightDir1), 0.0), 2.0) * 0.15;
    vec3 subsurface = uColor * sss;

    // ── Logo: baked into glass as holographic etching ──
    vec3 logoContribution = vec3(0.0);
    if (uLogoLoaded > 0.5) {
      // Spherical UV: map local position to equirectangular
      vec3 nPos = normalize(vLocalPos);
      float logoU = atan(nPos.x, nPos.z) / (2.0 * 3.14159265) + 0.5;
      float logoV = asin(clamp(nPos.y, -1.0, 1.0)) / 3.14159265 + 0.5;

      // Compensate for logo artwork offset (-99px X, -106px Y in 4171x3754)
      float offsetU = -99.0 / 4171.0;
      float offsetV = 106.0 / 3754.0;

      // Scale logo to fill ~70% of sphere front face
      float logoScale = 2.8;
      float centeredU = (logoU - 0.5 + offsetU) * logoScale + 0.5;
      float centeredV = (logoV - 0.5 + offsetV) * logoScale + 0.5;

      // Only sample when in valid UV range
      if (centeredU >= 0.0 && centeredU <= 1.0 && centeredV >= 0.0 && centeredV <= 1.0) {
        vec4 logoSample = texture2D(uLogoTex, vec2(centeredU, centeredV));
        float logoAlpha = logoSample.a * logoSample.r; // white logo on transparent

        // Holographic etching effect: logo glows from inside the glass
        float etchDepth = smoothstep(0.0, 0.8, NdV); // visible from front, fades at edges
        float holoPulse = 0.85 + sin(uTime * 0.6) * 0.15; // subtle breathing
        float holoShimmer = 1.0 + sin(uTime * 1.5 + vLocalPos.y * 4.0) * 0.08; // subtle vertical shimmer

        // Logo color: brand red with internal luminance
        vec3 logoColor = uColor * 1.5 + vec3(0.3, 0.08, 0.06);
        logoContribution = logoColor * logoAlpha * etchDepth * holoPulse * holoShimmer * 0.6;

        // Add subtle glow halo around logo marks
        float logoGlow = smoothstep(0.0, 0.15, logoAlpha) * (1.0 - smoothstep(0.15, 0.5, logoAlpha));
        logoContribution += uColor * logoGlow * etchDepth * 0.3;
      }
    }

    // ── Displacement energy lines (subtle through glass) ──
    float energyLines = abs(vDisp) * 2.0;
    vec3 displacementGlow = uColor * energyLines * 0.3;

    // ── Compose final glass material ──
    vec3 col = glassBase;
    col += internalGlow;
    col += caustics;
    col += plasmaColor;
    col += subsurface;
    col += displacementGlow;
    col += logoContribution;

    // Fresnel rim: brand-colored edge glow
    col += uColor * fresnel * 0.8;
    col += vec3(1.0, 0.85, 0.85) * fresnel * 0.15; // slight white rim

    // Specular on top
    col += specular;

    // State flash
    col += vec3(1.0, 0.3, 0.2) * uFlash;

    // Apply glow multiplier
    col *= uGlow;

    // Glass alpha: mostly transparent center, opaque at edges
    float alpha = 0.35 + fresnel * 0.55 + energyLines * 0.1;
    alpha = clamp(alpha, 0.25, 0.95);

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GLSL — Ring Shader (thick glowing concentric bands)                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ringVert = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
  }
`;

const ringFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uGlow;
  uniform float uPulse;
  varying vec2 vUv;

  void main(){
    // Ring cross-section: bright center, soft falloff
    float d=abs(vUv.y-.5)*2.;
    float ring=1.-smoothstep(0.,.8,d);
    ring=pow(ring,1.5);

    // Pulse modulation
    float pulse=sin(uTime*2.+vUv.x*6.28318)*.2*uPulse+1.;

    // Energy hotspots traveling along ring
    float hotspot=pow(sin(vUv.x*12.566+uTime*3.)*.5+.5,6.)*.6;
    float hotspot2=pow(sin(vUv.x*8.283-uTime*2.2)*.5+.5,8.)*.4;

    float alpha=(ring*uGlow*pulse+hotspot+hotspot2)*uGlow;

    // Color shift along ring
    vec3 col=mix(uColor,uColor*2.,hotspot+hotspot2);

    gl_FragColor=vec4(col*1.8,alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Glass Plasma Core (premium HD glass orb with baked-in logo)              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PlasmaCore({ state, amp, flash }: { state: SphereState; amp: number; flash: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  // Load logo texture
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

  const u = useMemo(() => ({
    uTime: { value: 0 },
    uAmp: { value: 0 },
    uDist: { value: 0.02 },
    uColor: { value: C_PRIMARY.clone() },
    uGlow: { value: 1.0 },
    uFlash: { value: 0 },
    uLogoTex: { value: null as THREE.Texture | null },
    uLogoLoaded: { value: 0 },
  }), []);

  // Update logo texture uniform when loaded
  useEffect(() => {
    if (logoTex) {
      u.uLogoTex.value = logoTex;
      u.uLogoLoaded.value = 1.0;
    }
  }, [logoTex, u]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = tgt.current;
    u.uTime.value = t;
    u.uAmp.value = amp;
    u.uDist.value += (c.distortion - u.uDist.value) * 0.06;
    u.uColor.value.lerp(c.coreColor, 0.05);
    u.uGlow.value += (c.coreGlow - u.uGlow.value) * 0.05;
    u.uFlash.value = flash;
    if (ref.current) {
      ref.current.rotation.y += c.rotSpeed * 0.006;
      ref.current.rotation.x += Math.sin(t * 0.12) * 0.001;
    }
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.88, 128]} />
      <shaderMaterial
        vertexShader={glassVert}
        fragmentShader={glassFrag}
        uniforms={u}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Glass Inner Shell (back-face refraction layer for depth)                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const innerGlassVert = /* glsl */ `
  varying vec3 vNorm;
  varying vec3 vWPos;
  varying vec3 vLocalPos;

  void main(){
    vNorm = normalize(normalMatrix * normal);
    vLocalPos = position;
    vWPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const innerGlassFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uGlow;
  varying vec3 vNorm;
  varying vec3 vWPos;
  varying vec3 vLocalPos;

  void main(){
    vec3 V = normalize(cameraPosition - vWPos);
    vec3 N = normalize(-vNorm); // inward-facing normal
    float NdV = max(dot(N, V), 0.0);

    // Inner surface: inverse fresnel — glows toward center
    float innerFresnel = pow(NdV, 2.0);

    // Deep internal glow
    vec3 col = uColor * 0.06 * innerFresnel;

    // Subtle internal caustic ripples
    float ripple = sin(vLocalPos.x * 12.0 + vLocalPos.z * 8.0 + uTime * 0.6) *
                   sin(vLocalPos.y * 10.0 - uTime * 0.4);
    col += uColor * pow(abs(ripple), 6.0) * 0.08;

    float alpha = 0.12 * innerFresnel + 0.03;
    col *= uGlow;

    gl_FragColor = vec4(col, alpha);
  }
`;

function GlassInnerShell({ state }: { state: SphereState }) {
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const u = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: C_PRIMARY.clone() },
    uGlow: { value: 1.0 },
  }), []);

  useFrame(({ clock }) => {
    const c = tgt.current;
    u.uTime.value = clock.getElapsedTime();
    u.uColor.value.lerp(c.coreColor, 0.05);
    u.uGlow.value += (c.coreGlow - u.uGlow.value) * 0.05;
  });

  return (
    <mesh>
      <icosahedronGeometry args={[0.85, 96]} />
      <shaderMaterial
        vertexShader={innerGlassVert}
        fragmentShader={innerGlassFrag}
        uniforms={u}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Concentric Energy Rings — 3 thick glowing rings like the mockup           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function EnergyRings({ state, amp }: { state: SphereState; amp: number }) {
  const rings = useRef<THREE.Mesh[]>([]);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  // 3 concentric rings at different radii
  const ringConfigs = useMemo(() => [
    { radius: 1.15, tube: 0.04, tiltX: 0.08, tiltZ: 0.02, speedMul: 1.0 },
    { radius: 1.35, tube: 0.035, tiltX: -0.05, tiltZ: 0.06, speedMul: 0.7 },
    { radius: 1.55, tube: 0.025, tiltX: 0.03, tiltZ: -0.04, speedMul: 0.5 },
  ], []);

  const uniforms = useMemo(() => ringConfigs.map(() => ({
    uTime: { value: 0 },
    uColor: { value: C_PRIMARY.clone() },
    uGlow: { value: 0.4 },
    uPulse: { value: 0.1 },
  })), [ringConfigs]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = tgt.current;

    rings.current.forEach((ring, i) => {
      if (!ring) return;
      const rc = ringConfigs[i];
      const u = uniforms[i];

      u.uTime.value = t;
      u.uColor.value.lerp(c.coreColor, 0.04);
      u.uGlow.value += (c.ringGlow - u.uGlow.value) * 0.05;
      u.uPulse.value += (c.ringPulse - u.uPulse.value) * 0.05;

      // Subtle tilt wobble
      ring.rotation.x = Math.PI * 0.5 + rc.tiltX + Math.sin(t * 0.15 + i) * 0.03;
      ring.rotation.z = rc.tiltZ + Math.cos(t * 0.12 + i * 2) * 0.02;

      // Audio reactivity — rings expand when loud
      const audioScale = 1.0 + amp * 0.08 * (i + 1);
      ring.scale.setScalar(audioScale);
    });
  });

  return (
    <group>
      {ringConfigs.map((rc, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) rings.current[i] = el; }}
          rotation={[Math.PI * 0.5, 0, 0]}
        >
          <torusGeometry args={[rc.radius, rc.tube, 32, 256]} />
          <shaderMaterial
            vertexShader={ringVert}
            fragmentShader={ringFrag}
            uniforms={uniforms[i]}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Particles (floating dots around and inside sphere)                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function Particles({ state, amp }: { state: SphereState; amp: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 600;
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const { pos, vel } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      // Some inside (r < 1), some outside between rings (r 1.0-1.8)
      const r = i < count * 0.6
        ? 0.15 + Math.random() * 0.8
        : 1.0 + Math.random() * 0.8;
      p[i * 3] = r * Math.sin(ph) * Math.cos(th);
      p[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      p[i * 3 + 2] = r * Math.cos(ph);
      v[i * 3] = (Math.random() - 0.5) * 0.002;
      v[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      v[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    return { pos: p, vel: v };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const c = tgt.current;
    const sp = c.particleSpeed;

    ref.current.rotation.y = t * sp * 0.08;
    ref.current.rotation.x = Math.sin(t * 0.08) * 0.1;

    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const b = i * 3;
      arr[b] += vel[b] * sp;
      arr[b + 1] += vel[b + 1] * sp;
      arr[b + 2] += vel[b + 2] * sp;

      // Audio push
      if (amp > 0.1) {
        const dx = arr[b], dy = arr[b + 1], dz = arr[b + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0.01) {
          arr[b] += (dx / dist) * amp * 0.002;
          arr[b + 1] += (dy / dist) * amp * 0.002;
          arr[b + 2] += (dz / dist) * amp * 0.002;
        }
      }

      // Bounds
      const dx = arr[b], dy = arr[b + 1], dz = arr[b + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 2.0 || dist < 0.1) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = i < count * 0.6 ? 0.15 + Math.random() * 0.8 : 1.0 + Math.random() * 0.8;
        arr[b] = r * Math.sin(ph) * Math.cos(th);
        arr[b + 1] = r * Math.sin(ph) * Math.sin(th);
        arr[b + 2] = r * Math.cos(ph);
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;

    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity += (c.particleGlow - mat.opacity) * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        color={C_GLOW}
        size={0.02}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Sound Wave Rings (expand outward when speaking/listening)                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SoundWaves({ state, amp }: { state: SphereState; amp: number }) {
  const meshes = useRef<THREE.Mesh[]>([]);
  const waveCount = 5;
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const offsets = useMemo(() => Array.from({ length: waveCount }, (_, i) => i * (Math.PI * 2 / waveCount)), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = tgt.current;

    meshes.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.MeshBasicMaterial;

      if (!c.waveActive) {
        mat.opacity *= 0.9;
        if (mat.opacity < 0.005) mat.opacity = 0;
        return;
      }

      const phase = (t * c.waveSpeed + offsets[i]) % (Math.PI * 2);
      const progress = phase / (Math.PI * 2);
      const scale = 1.2 + progress * 0.6 + amp * 0.2;
      m.scale.setScalar(scale);
      mat.opacity = (1.0 - progress) * 0.3;
    });
  });

  return (
    <group>
      {Array.from({ length: waveCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) meshes.current[i] = el; }}
          rotation={[Math.PI * 0.5, 0, 0]}
        >
          <torusGeometry args={[1, 0.006, 8, 128]} />
          <meshBasicMaterial color={C_ENERGY} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Orbit Lines (spinning around sphere when thinking)                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function OrbitLines({ state }: { state: SphereState }) {
  const lines = useRef<THREE.LineLoop[]>([]);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const tilts = useMemo(() => [
    [0.4, 0.9, 0], [-0.7, 0.3, 0.6], [0.2, -0.5, 1.0],
  ], []);

  const geos = useMemo(() => tilts.map(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }), [tilts]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = tgt.current;

    lines.current.forEach((line, i) => {
      if (!line) return;
      const mat = line.material as THREE.LineBasicMaterial;

      if (!c.orbitActive) {
        mat.opacity *= 0.92;
        return;
      }

      line.rotation.x = tilts[i][0] + t * c.orbitSpeed * 0.3 * (i % 2 === 0 ? 1 : -1);
      line.rotation.y = tilts[i][1] + t * c.orbitSpeed * 0.5 * (i % 2 === 0 ? -0.7 : 1);
      line.rotation.z = tilts[i][2] + t * c.orbitSpeed * 0.2;
      mat.opacity += (0.35 - mat.opacity) * 0.08;
    });
  });

  return (
    <group>
      {geos.map((geo, i) => (
        <lineLoop
          key={i}
          ref={(el) => { if (el) lines.current[i] = el as unknown as THREE.LineLoop; }}
          geometry={geo}
        >
          <lineBasicMaterial color={i === 1 ? C_PRIMARY : C_ENERGY} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </lineLoop>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Volumetric Glow (large soft halo behind sphere)                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

function GlowHalo({ state, amp }: { state: SphereState; amp: number }) {
  const ref = useRef<THREE.Sprite>(null);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const c = tgt.current;
    const pulse = Math.sin(t * 0.8) * 0.06 + 0.94;
    const scale = 3.8 * pulse * (1.0 + amp * 0.2);
    ref.current.scale.set(scale, scale, 1);
    const mat = ref.current.material as THREE.SpriteMaterial;
    mat.color.lerp(c.coreColor, 0.03);
    mat.opacity = 0.08 + amp * 0.04 + c.flash * 0.03;
  });

  return (
    <sprite ref={ref} scale={[3.8, 3.8, 1]} renderOrder={-1}>
      <spriteMaterial color={C_PRIMARY} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Core Light                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CoreLight({ state, amp }: { state: SphereState; amp: number }) {
  const ref = useRef<THREE.PointLight>(null);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);
  const col = useRef(C_PRIMARY.clone());

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const c = tgt.current;
    col.current.lerp(c.coreColor, 0.04);
    ref.current.color.copy(col.current);
    ref.current.intensity = c.coreGlow * 0.8 + Math.sin(clock.getElapsedTime() * 0.8) * 0.15 + amp * 0.4;
  });

  return <pointLight ref={ref} position={[0, 0, 0]} intensity={0.8} distance={6} decay={2} />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Flash Manager                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function useFlash(state: SphereState) {
  const flash = useRef(0);
  const prev = useRef(state);
  useEffect(() => {
    if (prev.current !== state) { flash.current = 1.0; prev.current = state; }
  }, [state]);

  return useCallback(() => {
    flash.current *= 0.9;
    if (flash.current < 0.01) flash.current = 0;
    return flash.current;
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Scene Assembly                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SphereScene({ state, amplitude }: { state: SphereState; amplitude: number }) {
  const getFlash = useFlash(state);
  const flashRef = useRef(0);
  const c = cfg(state);

  useFrame(() => { flashRef.current = getFlash(); });

  return (
    <>
      {/* Premium glass aesthetic lighting */}
      <ambientLight intensity={0.08} color="#D72638" />
      <directionalLight position={[3, 4, 5]} intensity={0.4} color="#E84855" />
      <directionalLight position={[-3, -2, 3]} intensity={0.3} color="#F07080" />
      <directionalLight position={[0, -3, 2]} intensity={0.2} color="#FDDDE1" />

      <CoreLight state={state} amp={amplitude} />
      <GlowHalo state={state} amp={amplitude} />

      {/* Glass inner shell for depth/refraction */}
      <GlassInnerShell state={state} />

      {/* Glass plasma core with baked logo */}
      <PlasmaCore state={state} amp={amplitude} flash={flashRef.current} />

      {/* 3 thick concentric energy rings */}
      <EnergyRings state={state} amp={amplitude} />

      {/* Floating particles inside + between rings */}
      <Particles state={state} amp={amplitude} />

      {/* Sound wave expanding rings */}
      <SoundWaves state={state} amp={amplitude} />

      {/* Spinning orbit lines */}
      <OrbitLines state={state} />

      {/* Bloom removed — glow handled by shaders */}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Audio Analyzer                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function useAudioAmplitude() {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const [amplitude, setAmplitude] = useState(0);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const start = useCallback(async () => {
    if (activeRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      streamRef.current = stream;
      contextRef.current = ctx;
      activeRef.current = true;
      const tick = () => {
        if (!activeRef.current || !analyserRef.current || !dataRef.current) return;
        analyserRef.current.getByteFrequencyData(dataRef.current);
        setAmplitude(dataRef.current.reduce((s, v) => s + v, 0) / dataRef.current.length / 255);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch { /* mic denied */ }
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    contextRef.current?.close().catch(() => {});
    analyserRef.current = null; dataRef.current = null; streamRef.current = null; contextRef.current = null;
    setAmplitude(0);
  }, []);

  useEffect(() => () => { stop(); }, [stop]);
  return { amplitude, start, stop };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Export                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function Sphere3D({ state, size = 140, audioAmplitude = 0, onClick }: SphereProps) {
  const prev = useRef(state);

  useEffect(() => {
    if (prev.current === state) return;
    const p = prev.current;
    prev.current = state;
    if (!sphereAudio) return;
    if (p === 'idle' && state === 'listening') sphereAudio.activate();
    else if (state === 'listening') sphereAudio.listen();
    else if (state === 'thinking') sphereAudio.think();
    else if (state === 'speaking') sphereAudio.speak();
    else if (state === 'dispatching') sphereAudio.dispatch();
    else if (state === 'error') sphereAudio.error();
    else if (state === 'idle' && p !== 'idle') sphereAudio.deactivate();
  }, [state]);

  return (
    <div
      className="transition-all duration-300 hover:scale-105"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Memelli AI"
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[2, 3]}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.5;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <SphereScene state={state} amplitude={audioAmplitude} />
      </Canvas>
    </div>
  );
}
