'use client';

import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type BoxState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'dispatching'
  | 'error';

interface BoxProps {
  state: BoxState;
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

class BoxAudio {
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

const boxAudio = typeof window !== 'undefined' ? new BoxAudio() : null;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  State Configuration                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface Cfg {
  coreColor: THREE.Color;
  coreGlow: number;
  distortion: number;
  rotSpeed: number;
  edgeGlow: number;
  edgeSpeed: number;
  edgePulse: number;
  particleSpeed: number;
  particleGlow: number;
  bloom: number;
  flash: number;
  waveActive: boolean;
  waveSpeed: number;
  cornerActive: boolean;
  cornerSpeed: number;
}

function cfg(state: BoxState): Cfg {
  switch (state) {
    case 'idle': return {
      coreColor: C_PRIMARY.clone(), coreGlow: 1.0, distortion: 0.02, rotSpeed: 0.2,
      edgeGlow: 0.4, edgeSpeed: 0.3, edgePulse: 0.1,
      particleSpeed: 0.08, particleGlow: 0.3, bloom: 2.0, flash: 0,
      waveActive: false, waveSpeed: 0, cornerActive: false, cornerSpeed: 0,
    };
    case 'listening': return {
      coreColor: C_ENERGY.clone(), coreGlow: 1.8, distortion: 0.05, rotSpeed: 0.5,
      edgeGlow: 0.8, edgeSpeed: 0.8, edgePulse: 0.4,
      particleSpeed: 0.3, particleGlow: 0.6, bloom: 2.8, flash: 0.2,
      waveActive: true, waveSpeed: 1.5, cornerActive: true, cornerSpeed: 1.0,
    };
    case 'thinking': return {
      coreColor: C_HOT.clone(), coreGlow: 2.5, distortion: 0.1, rotSpeed: 2.0,
      edgeGlow: 1.2, edgeSpeed: 2.0, edgePulse: 0.8,
      particleSpeed: 1.0, particleGlow: 0.9, bloom: 3.5, flash: 0.5,
      waveActive: false, waveSpeed: 0, cornerActive: true, cornerSpeed: 4.0,
    };
    case 'speaking': return {
      coreColor: C_PRIMARY.clone(), coreGlow: 1.6, distortion: 0.06, rotSpeed: 0.6,
      edgeGlow: 1.0, edgeSpeed: 1.2, edgePulse: 1.0,
      particleSpeed: 0.4, particleGlow: 0.7, bloom: 3.0, flash: 0.3,
      waveActive: true, waveSpeed: 2.5, cornerActive: true, cornerSpeed: 0.8,
    };
    case 'dispatching': return {
      coreColor: C_ENERGY.clone(), coreGlow: 3.0, distortion: 0.15, rotSpeed: 3.0,
      edgeGlow: 1.5, edgeSpeed: 3.0, edgePulse: 1.0,
      particleSpeed: 1.5, particleGlow: 1.0, bloom: 4.0, flash: 0.8,
      waveActive: true, waveSpeed: 3.0, cornerActive: true, cornerSpeed: 6.0,
    };
    case 'error': return {
      coreColor: C_DEEP.clone(), coreGlow: 2.0, distortion: 0.12, rotSpeed: 0.05,
      edgeGlow: 0.6, edgeSpeed: 0.1, edgePulse: 0,
      particleSpeed: 0.03, particleGlow: 0.3, bloom: 2.5, flash: 1.0,
      waveActive: false, waveSpeed: 0, cornerActive: false, cornerSpeed: 0,
    };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GLSL — Glass Box Core (premium glassmorphic cube with baked logo)        */
/* ═══════════════════════════════════════════════════════════════════════════ */

const glassBoxVert = /* glsl */ `
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

    // Subtle noise displacement on the box surface
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

const glassBoxFrag = /* glsl */ `
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

    // ── Fresnel (glass edge glow) ──
    float fresnel = pow(1.0 - NdV, 3.5);
    float fresnelSoft = pow(1.0 - NdV, 1.8);

    // ── Glass base: translucent dark interior ──
    vec3 glassBase = vec3(0.02, 0.01, 0.015);

    // ── Internal caustics: geometric patterns inside glass cube ──
    float caustic1 = pow(abs(sin(vLocalPos.x * 8.0 + vLocalPos.y * 6.0 + uTime * 0.4)), 8.0);
    float caustic2 = pow(abs(sin(vLocalPos.y * 10.0 - vLocalPos.z * 7.0 + uTime * 0.3)), 10.0);
    float caustic3 = pow(abs(sin(vLocalPos.z * 9.0 + vLocalPos.x * 5.0 - uTime * 0.5)), 12.0);
    vec3 caustics = uColor * (caustic1 * 0.15 + caustic2 * 0.12 + caustic3 * 0.08);

    // ── Edge highlight: emphasize box edges from inside ──
    vec3 absPos = abs(vLocalPos);
    float edgeDist = max(max(absPos.x, absPos.y), absPos.z);
    float edgeFactor = smoothstep(0.35, 0.48, edgeDist);
    vec3 edgeInternalGlow = uColor * edgeFactor * 0.2;

    // ── Internal glow: soft volumetric light inside the glass ──
    float depthFactor = smoothstep(0.0, 1.0, NdV);
    vec3 internalGlow = uColor * 0.15 * depthFactor;

    // ── Plasma energy beneath glass surface ──
    float plasma = sin(vDisp * 10.0 + uTime) * 0.5 + 0.5;
    vec3 plasmaColor = mix(uColor * 0.08, uColor * 0.4, plasma);
    plasmaColor *= (1.0 - fresnel * 0.5);

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

    // ── Logo: baked into front face as holographic etching ──
    vec3 logoContribution = vec3(0.0);
    if (uLogoLoaded > 0.5) {
      // Front face detection: normal pointing toward camera (+Z)
      float frontFace = smoothstep(0.6, 1.0, N.z);

      if (frontFace > 0.01) {
        // UV mapping on the front face
        float logoU = vUv.x;
        float logoV = vUv.y;

        // Scale logo to fill ~60% of face
        float logoScale = 2.5;
        float centeredU = (logoU - 0.5) * logoScale + 0.5;
        float centeredV = (logoV - 0.5) * logoScale + 0.5;

        if (centeredU >= 0.0 && centeredU <= 1.0 && centeredV >= 0.0 && centeredV <= 1.0) {
          vec4 logoSample = texture2D(uLogoTex, vec2(centeredU, centeredV));
          float logoAlpha = logoSample.a * logoSample.r;

          // Holographic etching effect
          float etchDepth = smoothstep(0.0, 0.8, NdV);
          float holoPulse = 0.85 + sin(uTime * 0.6) * 0.15;
          float holoShimmer = 1.0 + sin(uTime * 1.5 + vLocalPos.y * 4.0) * 0.08;

          vec3 logoColor = uColor * 1.5 + vec3(0.3, 0.08, 0.06);
          logoContribution = logoColor * logoAlpha * etchDepth * holoPulse * holoShimmer * frontFace * 0.6;

          float logoGlow = smoothstep(0.0, 0.15, logoAlpha) * (1.0 - smoothstep(0.15, 0.5, logoAlpha));
          logoContribution += uColor * logoGlow * etchDepth * frontFace * 0.3;
        }
      }
    }

    // ── Displacement energy lines (subtle through glass) ──
    float energyLines = abs(vDisp) * 2.0;
    vec3 displacementGlow = uColor * energyLines * 0.3;

    // ── Compose final glass material ──
    vec3 col = glassBase;
    col += internalGlow;
    col += edgeInternalGlow;
    col += caustics;
    col += plasmaColor;
    col += subsurface;
    col += displacementGlow;
    col += logoContribution;

    // Fresnel rim: brand-colored edge glow
    col += uColor * fresnel * 0.8;
    col += vec3(1.0, 0.85, 0.85) * fresnel * 0.15;

    // Specular on top
    col += specular;

    // State flash
    col += vec3(1.0, 0.3, 0.2) * uFlash;

    // Apply glow multiplier
    col *= uGlow;

    // Glass alpha: mostly transparent center, opaque at edges
    float alpha = 0.35 + fresnel * 0.55 + energyLines * 0.1 + edgeFactor * 0.1;
    alpha = clamp(alpha, 0.25, 0.95);

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GLSL — Edge Line Shader (energy lines traveling along box edges)         */
/* ═══════════════════════════════════════════════════════════════════════════ */

const edgeLineVert = /* glsl */ `
  attribute float aLinePos;
  varying float vLinePos;
  void main(){
    vLinePos = aLinePos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const edgeLineFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uGlow;
  uniform float uPulse;
  uniform float uSpeed;
  varying float vLinePos;

  void main(){
    // Energy pulse traveling along edge
    float pulse1 = pow(sin(vLinePos * 6.28318 * 2.0 + uTime * uSpeed * 3.0) * 0.5 + 0.5, 4.0);
    float pulse2 = pow(sin(vLinePos * 6.28318 * 3.0 - uTime * uSpeed * 2.2) * 0.5 + 0.5, 6.0);

    // Base glow along edge
    float baseGlow = 0.3;

    float alpha = (baseGlow + pulse1 * 0.6 + pulse2 * 0.4) * uGlow;

    // Pulse modulation
    float mod = sin(uTime * 2.0) * 0.2 * uPulse + 1.0;
    alpha *= mod;

    vec3 col = mix(uColor, uColor * 2.5, pulse1 + pulse2);

    gl_FragColor = vec4(col * 1.8, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Glass Plasma Box Core                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

function PlasmaBoxCore({ state, amp, flash }: { state: BoxState; amp: number; flash: number }) {
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
      // Slow elegant rotation — tesseract feel
      ref.current.rotation.y += c.rotSpeed * 0.004;
      ref.current.rotation.x += Math.sin(t * 0.1) * 0.0008;
      ref.current.rotation.z += Math.cos(t * 0.08) * 0.0004;
    }
  });

  return (
    <mesh ref={ref}>
      <RoundedBox args={[1.4, 1.4, 1.4]} radius={0.12} smoothness={8}>
        <shaderMaterial
          vertexShader={glassBoxVert}
          fragmentShader={glassBoxFrag}
          uniforms={u}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
          side={THREE.FrontSide}
        />
      </RoundedBox>
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Glass Inner Box Shell (back-face refraction layer for depth)             */
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
    vec3 N = normalize(-vNorm);
    float NdV = max(dot(N, V), 0.0);

    // Inner surface: inverse fresnel
    float innerFresnel = pow(NdV, 2.0);

    // Deep internal glow
    vec3 col = uColor * 0.06 * innerFresnel;

    // Internal caustic ripples — more geometric for box shape
    float ripple = sin(vLocalPos.x * 12.0 + vLocalPos.z * 8.0 + uTime * 0.6) *
                   sin(vLocalPos.y * 10.0 - uTime * 0.4);
    col += uColor * pow(abs(ripple), 6.0) * 0.08;

    // Box-edge internal highlight
    vec3 absP = abs(vLocalPos);
    float cornerDist = length(absP - vec3(0.65));
    float cornerGlow = smoothstep(0.3, 0.0, cornerDist) * 0.1;
    col += uColor * cornerGlow;

    float alpha = 0.12 * innerFresnel + 0.03;
    col *= uGlow;

    gl_FragColor = vec4(col, alpha);
  }
`;

function GlassInnerShell({ state }: { state: BoxState }) {
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
      <RoundedBox args={[1.35, 1.35, 1.35]} radius={0.1} smoothness={6}>
        <shaderMaterial
          vertexShader={innerGlassVert}
          fragmentShader={innerGlassFrag}
          uniforms={u}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </RoundedBox>
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Edge Energy Lines — glowing lines traveling along all 12 box edges       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function EdgeEnergyLines({ state, amp }: { state: BoxState; amp: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  // 12 edges of a box
  const edgeData = useMemo(() => {
    const h = 0.72; // half size
    const edges: [THREE.Vector3, THREE.Vector3][] = [
      // Bottom face
      [new THREE.Vector3(-h, -h, -h), new THREE.Vector3(h, -h, -h)],
      [new THREE.Vector3(h, -h, -h), new THREE.Vector3(h, -h, h)],
      [new THREE.Vector3(h, -h, h), new THREE.Vector3(-h, -h, h)],
      [new THREE.Vector3(-h, -h, h), new THREE.Vector3(-h, -h, -h)],
      // Top face
      [new THREE.Vector3(-h, h, -h), new THREE.Vector3(h, h, -h)],
      [new THREE.Vector3(h, h, -h), new THREE.Vector3(h, h, h)],
      [new THREE.Vector3(h, h, h), new THREE.Vector3(-h, h, h)],
      [new THREE.Vector3(-h, h, h), new THREE.Vector3(-h, h, -h)],
      // Verticals
      [new THREE.Vector3(-h, -h, -h), new THREE.Vector3(-h, h, -h)],
      [new THREE.Vector3(h, -h, -h), new THREE.Vector3(h, h, -h)],
      [new THREE.Vector3(h, -h, h), new THREE.Vector3(h, h, h)],
      [new THREE.Vector3(-h, -h, h), new THREE.Vector3(-h, h, h)],
    ];

    return edges.map(([start, end]) => {
      const segments = 64;
      const positions = new Float32Array((segments + 1) * 3);
      const linePos = new Float32Array(segments + 1);
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        positions[i * 3] = start.x + (end.x - start.x) * t;
        positions[i * 3 + 1] = start.y + (end.y - start.y) * t;
        positions[i * 3 + 2] = start.z + (end.z - start.z) * t;
        linePos[i] = t;
      }
      return { positions, linePos, segments };
    });
  }, []);

  const uniforms = useMemo(() => edgeData.map(() => ({
    uTime: { value: 0 },
    uColor: { value: C_PRIMARY.clone() },
    uGlow: { value: 0.4 },
    uPulse: { value: 0.1 },
    uSpeed: { value: 0.3 },
  })), [edgeData]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = tgt.current;

    uniforms.forEach((u, i) => {
      u.uTime.value = t + i * 0.4; // Phase offset per edge
      u.uColor.value.lerp(c.coreColor, 0.04);
      u.uGlow.value += (c.edgeGlow - u.uGlow.value) * 0.05;
      u.uPulse.value += (c.edgePulse - u.uPulse.value) * 0.05;
      u.uSpeed.value += (c.edgeSpeed - u.uSpeed.value) * 0.05;
    });

    // Audio reactivity — subtle scale
    if (groupRef.current) {
      const audioScale = 1.0 + amp * 0.05;
      groupRef.current.scale.setScalar(audioScale);
    }
  });

  const lines = useMemo(() => edgeData.map((edge, i) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(edge.positions, 3));
    geo.setAttribute('aLinePos', new THREE.BufferAttribute(edge.linePos, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: edgeLineVert,
      fragmentShader: edgeLineFrag,
      uniforms: uniforms[i],
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(geo, mat);
  }), [edgeData, uniforms]);

  return (
    <group ref={groupRef}>
      {lines.map((ln, i) => (
        <primitive key={i} object={ln} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Corner Glow Points — glowing energy at each of the 8 box corners        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CornerGlowPoints({ state, amp }: { state: BoxState; amp: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const corners = useMemo(() => {
    const h = 0.74;
    return [
      [-h, -h, -h], [h, -h, -h], [h, -h, h], [-h, -h, h],
      [-h, h, -h], [h, h, -h], [h, h, h], [-h, h, h],
    ] as [number, number, number][];
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = tgt.current;

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;

      if (!c.cornerActive) {
        mat.opacity *= 0.92;
        return;
      }

      // Pulsing glow per corner
      const phase = t * c.cornerSpeed + i * 0.8;
      const pulse = Math.sin(phase) * 0.3 + 0.7;
      const scale = 0.04 + pulse * 0.03 + amp * 0.02;
      mesh.scale.setScalar(scale);
      mat.opacity = pulse * 0.8;
    });

    if (groupRef.current) {
      const audioScale = 1.0 + amp * 0.05;
      groupRef.current.scale.setScalar(audioScale);
    }
  });

  return (
    <group ref={groupRef}>
      {corners.map((pos, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) meshRefs.current[i] = el; }}
          position={pos}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={C_ENERGY}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Particles (floating inside the glass cube)                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function Particles({ state, amp }: { state: BoxState; amp: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 500;
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const { pos, vel } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Particles inside the box volume
      const range = i < count * 0.7 ? 0.6 : 0.9;
      p[i * 3] = (Math.random() - 0.5) * range * 2;
      p[i * 3 + 1] = (Math.random() - 0.5) * range * 2;
      p[i * 3 + 2] = (Math.random() - 0.5) * range * 2;
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

    ref.current.rotation.y = t * sp * 0.05;
    ref.current.rotation.x = Math.sin(t * 0.06) * 0.08;

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

      // Box bounds — constrain to cube
      const bound = 0.9;
      for (let axis = 0; axis < 3; axis++) {
        if (Math.abs(arr[b + axis]) > bound) {
          arr[b + axis] = (Math.random() - 0.5) * 1.2;
          vel[b + axis] *= -1;
        }
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
        size={0.018}
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
/*  Sound Wave Boxes (expanding box outlines when speaking/listening)         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SoundWaves({ state, amp }: { state: BoxState; amp: number }) {
  const meshes = useRef<THREE.LineSegments[]>([]);
  const waveCount = 5;
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  const offsets = useMemo(() => Array.from({ length: waveCount }, (_, i) => i * (Math.PI * 2 / waveCount)), []);

  // Box wireframe geometry for waves
  const waveGeo = useMemo(() => {
    const h = 0.72;
    const pts = [
      // Bottom face
      -h, -h, -h, h, -h, -h,
      h, -h, -h, h, -h, h,
      h, -h, h, -h, -h, h,
      -h, -h, h, -h, -h, -h,
      // Top face
      -h, h, -h, h, h, -h,
      h, h, -h, h, h, h,
      h, h, h, -h, h, h,
      -h, h, h, -h, h, -h,
      // Verticals
      -h, -h, -h, -h, h, -h,
      h, -h, -h, h, h, -h,
      h, -h, h, h, h, h,
      -h, -h, h, -h, h, h,
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const c = tgt.current;

    meshes.current.forEach((m, i) => {
      if (!m) return;
      const mat = m.material as THREE.LineBasicMaterial;

      if (!c.waveActive) {
        mat.opacity *= 0.9;
        if (mat.opacity < 0.005) mat.opacity = 0;
        return;
      }

      const phase = (t * c.waveSpeed + offsets[i]) % (Math.PI * 2);
      const progress = phase / (Math.PI * 2);
      const scale = 1.2 + progress * 0.5 + amp * 0.15;
      m.scale.setScalar(scale);
      mat.opacity = (1.0 - progress) * 0.25;
    });
  });

  return (
    <group>
      {Array.from({ length: waveCount }).map((_, i) => (
        <lineSegments
          key={i}
          ref={(el) => { if (el) meshes.current[i] = el as unknown as THREE.LineSegments; }}
          geometry={waveGeo}
        >
          <lineBasicMaterial
            color={C_ENERGY}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Volumetric Glow (large soft halo behind box)                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

function GlowHalo({ state, amp }: { state: BoxState; amp: number }) {
  const ref = useRef<THREE.Sprite>(null);
  const tgt = useRef(cfg(state));
  useEffect(() => { tgt.current = cfg(state); }, [state]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const c = tgt.current;
    const pulse = Math.sin(t * 0.8) * 0.06 + 0.94;
    const scale = 4.0 * pulse * (1.0 + amp * 0.2);
    ref.current.scale.set(scale, scale, 1);
    const mat = ref.current.material as THREE.SpriteMaterial;
    mat.color.lerp(c.coreColor, 0.03);
    mat.opacity = 0.07 + amp * 0.04 + c.flash * 0.03;
  });

  return (
    <sprite ref={ref} scale={[4.0, 4.0, 1]} renderOrder={-1}>
      <spriteMaterial color={C_PRIMARY} transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Core Light                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CoreLight({ state, amp }: { state: BoxState; amp: number }) {
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

function useFlash(state: BoxState) {
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

function BoxScene({ state, amplitude }: { state: BoxState; amplitude: number }) {
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

      {/* Glass plasma box core with baked logo */}
      <PlasmaBoxCore state={state} amp={amplitude} flash={flashRef.current} />

      {/* Energy lines along all 12 edges */}
      <EdgeEnergyLines state={state} amp={amplitude} />

      {/* Glowing corner points */}
      <CornerGlowPoints state={state} amp={amplitude} />

      {/* Floating particles inside the cube */}
      <Particles state={state} amp={amplitude} />

      {/* Sound wave expanding box outlines */}
      <SoundWaves state={state} amp={amplitude} />

      {/* Bloom removed — glow handled by shaders */}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Export                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function SphereBox({ state, size = 140, audioAmplitude = 0, onClick }: BoxProps) {
  const prev = useRef(state);

  useEffect(() => {
    if (prev.current === state) return;
    const p = prev.current;
    prev.current = state;
    if (!boxAudio) return;
    if (p === 'idle' && state === 'listening') boxAudio.activate();
    else if (state === 'listening') boxAudio.listen();
    else if (state === 'thinking') boxAudio.think();
    else if (state === 'speaking') boxAudio.speak();
    else if (state === 'dispatching') boxAudio.dispatch();
    else if (state === 'error') boxAudio.error();
    else if (state === 'idle' && p !== 'idle') boxAudio.deactivate();
  }, [state]);

  return (
    <div
      className="transition-all duration-300 hover:scale-105"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Memelli AI Box"
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[2, 3]}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.5;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <BoxScene state={state} amplitude={audioAmplitude} />
      </Canvas>
    </div>
  );
}
