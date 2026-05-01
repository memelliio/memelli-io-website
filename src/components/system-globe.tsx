'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ======================================================================== */
/*  Types                                                                    */
/* ======================================================================== */

export interface ContactPoint {
  lat: number;   // -90 to 90
  lon: number;   // -180 to 180
  status: string; // 'active' | 'idle' | 'error' | 'spawning'
}

export interface SystemGlobeProps {
  gridCoverage: number;    // 0-100 — how much of the 10x10 grid is populated
  contactPoints: ContactPoint[];
  laneCount: number;       // number of active rail lanes
  pulseHealth: string;     // 'healthy' | 'stressed' | 'failing' | 'dead'
  bpm: number;             // heartbeat BPM (40-180)
  awakeningStatus: string; // 'dormant' | 'stirring' | 'awake' | 'transcendent'
  size?: number;
  onClick?: () => void;
}

/* ======================================================================== */
/*  Constants                                                                */
/* ======================================================================== */

const SPHERE_RADIUS = 1.0;
const GRID_ROWS = 10;
const GRID_COLS = 10;
const MAX_CONTACT_POINTS = 500;
const MAX_LANE_PARTICLES = 600;
const MAX_LANES = 12;

/* ======================================================================== */
/*  Color Palettes by Health                                                 */
/* ======================================================================== */

const PALETTE = {
  healthy: {
    primary: new THREE.Color('#10B981'),   // emerald-500
    glow:    new THREE.Color('#34D399'),   // emerald-400
    bright:  new THREE.Color('#6EE7B7'),   // emerald-300
    dim:     new THREE.Color('#065F46'),   // emerald-800
    aura:    new THREE.Color('#059669'),   // emerald-600
    white:   new THREE.Color('#ECFDF5'),   // emerald-50
  },
  stressed: {
    primary: new THREE.Color('#F59E0B'),   // amber-500
    glow:    new THREE.Color('#FBBF24'),   // amber-400
    bright:  new THREE.Color('#FDE68A'),   // amber-200
    dim:     new THREE.Color('#78350F'),   // amber-900
    aura:    new THREE.Color('#D97706'),   // amber-600
    white:   new THREE.Color('#FFFBEB'),   // amber-50
  },
  failing: {
    primary: new THREE.Color('#EF4444'),   // red-500
    glow:    new THREE.Color('#F87171'),   // red-400
    bright:  new THREE.Color('#FCA5A5'),   // red-300
    dim:     new THREE.Color('#7F1D1D'),   // red-900
    aura:    new THREE.Color('#DC2626'),   // red-600
    white:   new THREE.Color('#FEF2F2'),   // red-50
  },
  dead: {
    primary: new THREE.Color('#6B7280'),   // gray-500
    glow:    new THREE.Color('#9CA3AF'),   // gray-400
    bright:  new THREE.Color('#D1D5DB'),   // gray-300
    dim:     new THREE.Color('#1F2937'),   // gray-800
    aura:    new THREE.Color('#4B5563'),   // gray-600
    white:   new THREE.Color('#F9FAFB'),   // gray-50
  },
};

type Palette = typeof PALETTE.healthy;

function getPalette(health: string): Palette {
  if (health === 'stressed') return PALETTE.stressed;
  if (health === 'failing') return PALETTE.failing;
  if (health === 'dead') return PALETTE.dead;
  return PALETTE.healthy;
}

function getAwakeningIntensity(status: string): number {
  switch (status) {
    case 'dormant': return 0.2;
    case 'stirring': return 0.5;
    case 'awake': return 0.85;
    case 'transcendent': return 1.0;
    default: return 0.5;
  }
}

/* ======================================================================== */
/*  Helpers                                                                  */
/* ======================================================================== */

function lerpVal(current: number, target: number, speed = 0.04): number {
  return current + (target - current) * speed;
}

/** Convert lat/lon degrees to a unit-sphere vec3. */
function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  );
}

/* ======================================================================== */
/*  GLSL Noise — shared simplex 3D                                          */
/* ======================================================================== */

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

/* ======================================================================== */
/*  Globe Surface Shader — grid lines + health coloring                     */
/* ======================================================================== */

const globeSurfaceVert = /* glsl */ `
  varying vec3 vNorm;
  varying vec3 vPos;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main(){
    vUv = uv;
    vPos = position;
    vNorm = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const globeSurfaceFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uPrimary;
  uniform vec3 uDim;
  uniform vec3 uGlow;
  uniform float uGridCoverage;   // 0-1
  uniform float uIntensity;      // awakening intensity 0-1
  uniform float uPulseScale;     // heartbeat-driven scale factor (passed from JS)

  varying vec3 vNorm;
  varying vec3 vPos;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  ${noiseGLSL}

  void main(){
    vec3 N = normalize(vNorm);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float NdV = max(dot(N, V), 0.0);

    // Compute spherical coordinates for grid
    vec3 p = normalize(vPos);
    float lat = asin(p.y);                       // -PI/2 to PI/2
    float lon = atan(p.z, p.x);                  // -PI to PI

    // 10x10 grid lines on the sphere
    float latLines = abs(fract(lat / 3.14159 * 10.0 + 0.5) - 0.5) * 2.0;
    float lonLines = abs(fract(lon / 6.28318 * 10.0 + 0.5) - 0.5) * 2.0;

    float gridLine = 1.0 - smoothstep(0.0, 0.06, min(latLines, lonLines));

    // Grid coverage: fade out grid cells beyond coverage threshold
    float cellLat = floor((lat / 3.14159 + 0.5) * 10.0) / 10.0;
    float cellLon = floor((lon / 6.28318 + 0.5) * 10.0) / 10.0;
    float cellHash = fract(sin(cellLat * 127.1 + cellLon * 311.7) * 43758.5453);
    float cellActive = step(cellHash, uGridCoverage);

    // Noise-driven surface energy
    float surfaceNoise = snoise(vPos * 3.0 + uTime * 0.2) * 0.5 + 0.5;
    float energyPulse = pow(surfaceNoise, 3.0) * cellActive;

    // Fresnel rim
    float fresnel = pow(1.0 - NdV, 3.5);

    // Assemble color
    vec3 gridColor = mix(uDim, uPrimary, gridLine * 0.7) * cellActive;
    vec3 energyColor = uGlow * energyPulse * 0.4 * uIntensity;
    vec3 rimColor = uPrimary * fresnel * 0.6 * uIntensity;

    vec3 col = gridColor * 0.3 + energyColor + rimColor;

    // Grid line highlight
    col += uGlow * gridLine * cellActive * 0.25 * uIntensity;

    // Subtle time-based shimmer along grid lines
    float shimmer = sin(uTime * 2.0 + lat * 8.0 + lon * 6.0) * 0.5 + 0.5;
    col += uPrimary * gridLine * shimmer * 0.15 * uIntensity;

    float alpha = fresnel * 0.5 + gridLine * cellActive * 0.4 + energyPulse * 0.3;
    alpha *= uIntensity;
    alpha = clamp(alpha, 0.0, 0.85);

    gl_FragColor = vec4(col, alpha);
  }
`;

/* ======================================================================== */
/*  Globe Surface Component                                                  */
/* ======================================================================== */

function GlobeSurface({
  palette,
  gridCoverage,
  intensity,
  bpm,
}: {
  palette: Palette;
  gridCoverage: number;
  intensity: number;
  bpm: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const u = useMemo(() => ({
    uTime:         { value: 0 },
    uPrimary:      { value: palette.primary.clone() },
    uDim:          { value: palette.dim.clone() },
    uGlow:         { value: palette.glow.clone() },
    uGridCoverage: { value: gridCoverage / 100 },
    uIntensity:    { value: intensity },
    uPulseScale:   { value: 1.0 },
  }), []);

  const tgtPrimary = useRef(palette.primary.clone());
  const tgtDim = useRef(palette.dim.clone());
  const tgtGlow = useRef(palette.glow.clone());

  useEffect(() => {
    tgtPrimary.current.copy(palette.primary);
    tgtDim.current.copy(palette.dim);
    tgtGlow.current.copy(palette.glow);
  }, [palette]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    u.uTime.value = t;
    u.uGridCoverage.value = lerpVal(u.uGridCoverage.value, gridCoverage / 100);
    u.uIntensity.value = lerpVal(u.uIntensity.value, intensity);
    u.uPrimary.value.lerp(tgtPrimary.current, 0.03);
    u.uDim.value.lerp(tgtDim.current, 0.03);
    u.uGlow.value.lerp(tgtGlow.current, 0.03);

    // Heartbeat pulse — sphere breathes
    const bps = bpm / 60;
    const heartbeat = Math.sin(t * bps * Math.PI * 2);
    const pulseStrength = 0.02 + intensity * 0.03;
    const scale = 1.0 + heartbeat * pulseStrength;
    u.uPulseScale.value = scale;

    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale);
      meshRef.current.rotation.y += 0.001 * intensity;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[SPHERE_RADIUS, 48]} />
      <shaderMaterial
        vertexShader={globeSurfaceVert}
        fragmentShader={globeSurfaceFrag}
        uniforms={u}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ======================================================================== */
/*  Contact Points — Instanced Meshes (hundreds of glowing dots)             */
/* ======================================================================== */

const CONTACT_STATUS_COLORS: Record<string, THREE.Color> = {
  active:   new THREE.Color('#34D399'),
  idle:     new THREE.Color('#6B7280'),
  error:    new THREE.Color('#EF4444'),
  spawning: new THREE.Color('#FBBF24'),
};

function ContactPointsLayer({
  points,
  intensity,
  bpm,
}: {
  points: ContactPoint[];
  intensity: number;
  bpm: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArr = useMemo(() => new Float32Array(MAX_CONTACT_POINTS * 3), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const bps = bpm / 60;
    const count = Math.min(points.length, MAX_CONTACT_POINTS);
    meshRef.current.count = count;

    for (let i = 0; i < count; i++) {
      const cp = points[i];
      const pos = latLonToVec3(cp.lat, cp.lon, SPHERE_RADIUS * 1.005);

      // Pulsing scale per point
      const phase = (cp.lat * 0.1 + cp.lon * 0.07);
      const pulse = 1.0 + Math.sin(t * bps * Math.PI * 2 + phase) * 0.3;
      const baseScale = cp.status === 'active' ? 0.018 : 0.012;
      const s = baseScale * pulse * (0.6 + intensity * 0.4);

      dummy.position.copy(pos);
      dummy.scale.setScalar(s);
      dummy.lookAt(0, 0, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color by status
      const col = CONTACT_STATUS_COLORS[cp.status] || CONTACT_STATUS_COLORS.idle;
      // Glow: brighten active points
      const glow = cp.status === 'active' ? 1.5 + Math.sin(t * 3 + phase) * 0.5 : 0.6;
      colorArr[i * 3]     = col.r * glow;
      colorArr[i * 3 + 1] = col.g * glow;
      colorArr[i * 3 + 2] = col.b * glow;
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    const cAttr = meshRef.current.geometry.getAttribute('color');
    if (cAttr) {
      (cAttr.array as Float32Array).set(colorArr.subarray(0, count * 3));
      cAttr.needsUpdate = true;
    }
  });

  // Instanced geometry with per-instance color attribute
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 2);
    const instanceColorBuffer = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_CONTACT_POINTS * 3).fill(1),
      3,
    );
    geo.setAttribute('color', instanceColorBuffer);
    return geo;
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, MAX_CONTACT_POINTS]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ======================================================================== */
/*  Rail Lanes — Great Circles with Flowing Particles                        */
/* ======================================================================== */

function RailLanes({
  laneCount,
  palette,
  intensity,
}: {
  laneCount: number;
  palette: Palette;
  intensity: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  // Pre-generate lane definitions (great circles with random tilts)
  const laneData = useMemo(() => {
    const lanes: { tiltX: number; tiltZ: number; speed: number; direction: number }[] = [];
    for (let i = 0; i < MAX_LANES; i++) {
      lanes.push({
        tiltX: (Math.random() - 0.5) * Math.PI * 0.8,
        tiltZ: (Math.random() - 0.5) * Math.PI * 0.8,
        speed: 0.3 + Math.random() * 0.7,
        direction: Math.random() > 0.5 ? 1 : -1,
      });
    }
    return lanes;
  }, []);

  // Particle positions and per-particle data
  const { positions, meta } = useMemo(() => {
    const pos = new Float32Array(MAX_LANE_PARTICLES * 3);
    const met = new Float32Array(MAX_LANE_PARTICLES * 3); // laneIndex, phaseOffset, brightness
    const particlesPerLane = Math.floor(MAX_LANE_PARTICLES / MAX_LANES);

    for (let i = 0; i < MAX_LANE_PARTICLES; i++) {
      const laneIdx = Math.floor(i / particlesPerLane) % MAX_LANES;
      met[i * 3]     = laneIdx;
      met[i * 3 + 1] = Math.random() * Math.PI * 2; // phase offset
      met[i * 3 + 2] = 0.4 + Math.random() * 0.6;    // brightness
    }
    return { positions: pos, meta: met };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const activeLanes = Math.min(laneCount, MAX_LANES);
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const particlesPerLane = Math.floor(MAX_LANE_PARTICLES / MAX_LANES);

    for (let i = 0; i < MAX_LANE_PARTICLES; i++) {
      const laneIdx = meta[i * 3];
      if (laneIdx >= activeLanes) {
        // Hide inactive lane particles
        arr[i * 3] = 0;
        arr[i * 3 + 1] = 100; // far away = invisible
        arr[i * 3 + 2] = 0;
        continue;
      }

      const lane = laneData[laneIdx];
      const phase = meta[i * 3 + 1];
      const angle = phase + t * lane.speed * lane.direction * intensity;

      // Great circle: rotate a point on the equator by the lane's tilt
      const r = SPHERE_RADIUS * 1.02;
      let x = Math.cos(angle) * r;
      let y = 0;
      let z = Math.sin(angle) * r;

      // Tilt around X
      const cosX = Math.cos(lane.tiltX);
      const sinX = Math.sin(lane.tiltX);
      const ny = y * cosX - z * sinX;
      const nz = y * sinX + z * cosX;
      y = ny;
      z = nz;

      // Tilt around Z
      const cosZ = Math.cos(lane.tiltZ);
      const sinZ = Math.sin(lane.tiltZ);
      const nx = x * cosZ - y * sinZ;
      const ny2 = x * sinZ + y * cosZ;
      x = nx;
      y = ny2;

      arr[i * 3]     = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Animate size and opacity
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = lerpVal(mat.opacity, intensity * 0.9);
    mat.size = lerpVal(mat.size, 0.012 + intensity * 0.008);
    mat.color.lerp(palette.bright, 0.03);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={MAX_LANE_PARTICLES} />
      </bufferGeometry>
      <pointsMaterial
        color={palette.bright}
        size={0.015}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/* ======================================================================== */
/*  Rail Lane Lines — Visible Great Circles as Glowing Lines of Light       */
/* ======================================================================== */

function RailLaneLines({
  laneCount,
  palette,
  intensity,
}: {
  laneCount: number;
  palette: Palette;
  intensity: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Build Three.js Line objects imperatively (avoids JSX <line> = SVG conflict)
  const lines = useMemo(() => {
    const result: THREE.Line[] = [];
    const segments = 128;

    for (let l = 0; l < MAX_LANES; l++) {
      const tiltX = (Math.random() - 0.5) * Math.PI * 0.8;
      const tiltZ = (Math.random() - 0.5) * Math.PI * 0.8;
      const pts: THREE.Vector3[] = [];

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const r = SPHERE_RADIUS * 1.015;
        let x = Math.cos(angle) * r;
        let y = 0;
        let z = Math.sin(angle) * r;

        const cosX = Math.cos(tiltX);
        const sinX = Math.sin(tiltX);
        const ny = y * cosX - z * sinX;
        const nz = y * sinX + z * cosX;
        y = ny;
        z = nz;

        const cosZ = Math.cos(tiltZ);
        const sinZ = Math.sin(tiltZ);
        const nx = x * cosZ - y * sinZ;
        const ny2 = x * sinZ + y * cosZ;
        x = nx;
        y = ny2;

        pts.push(new THREE.Vector3(x, y, z));
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: palette.glow.clone(),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      result.push(new THREE.Line(geo, mat));
    }
    return result;
  }, []);

  // Add lines to group on mount
  useEffect(() => {
    if (!groupRef.current) return;
    lines.forEach((line) => groupRef.current!.add(line));
    return () => {
      lines.forEach((line) => {
        groupRef.current?.remove(line);
        line.geometry.dispose();
        (line.material as THREE.LineBasicMaterial).dispose();
      });
    };
  }, [lines]);

  const curOpacity = useRef(0);

  useFrame(() => {
    const activeLanes = Math.min(laneCount, MAX_LANES);
    const targetOp = intensity * 0.25;
    curOpacity.current = lerpVal(curOpacity.current, targetOp);

    lines.forEach((line, i) => {
      const mat = line.material as THREE.LineBasicMaterial;
      if (i < activeLanes) {
        mat.opacity = curOpacity.current;
        mat.color.lerp(palette.glow, 0.03);
      } else {
        mat.opacity = lerpVal(mat.opacity, 0, 0.05);
      }
    });
  });

  return <group ref={groupRef} />;
}

/* ======================================================================== */
/*  Aura Glow — background radial halo                                      */
/* ======================================================================== */

function AuraGlow({
  palette,
  intensity,
  bpm,
}: {
  palette: Palette;
  intensity: number;
  bpm: number;
}) {
  const ref = useRef<THREE.Sprite>(null);

  const glowTex = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const bps = bpm / 60;
    const heartbeat = Math.sin(t * bps * Math.PI * 2);
    const pulse = 1.0 + heartbeat * 0.05 * intensity;
    const scale = 3.5 * pulse * (0.8 + intensity * 0.4);
    ref.current.scale.set(scale, scale, 1);

    const mat = ref.current.material as THREE.SpriteMaterial;
    mat.color.lerp(palette.aura, 0.02);
    mat.opacity = lerpVal(mat.opacity, 0.08 + intensity * 0.12, 0.02);
  });

  return (
    <sprite ref={ref} position={[0, 0, -0.5]} scale={[3.5, 3.5, 1]} renderOrder={-2}>
      <spriteMaterial
        map={glowTex}
        color={palette.aura}
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </sprite>
  );
}

/* ======================================================================== */
/*  Inner Energy Core — dim noise-driven glow at center                     */
/* ======================================================================== */

const coreVert = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNorm;
  void main(){
    vPos = position;
    vNorm = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coreFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vPos;
  varying vec3 vNorm;

  ${noiseGLSL}

  void main(){
    float n = snoise(vPos * 4.0 + uTime * 0.3) * 0.5 + 0.5;
    float n2 = snoise(vPos * 8.0 - uTime * 0.5) * 0.5 + 0.5;
    float energy = pow(n * n2, 2.0);

    vec3 N = normalize(vNorm);
    float fresnel = pow(1.0 - abs(dot(N, vec3(0.0, 0.0, 1.0))), 2.5);

    vec3 col = uColor * (energy * 0.6 + fresnel * 0.4) * uIntensity;
    float alpha = (energy * 0.3 + fresnel * 0.4) * uIntensity;
    alpha = clamp(alpha, 0.0, 0.6);

    gl_FragColor = vec4(col, alpha);
  }
`;

function InnerCore({
  palette,
  intensity,
}: {
  palette: Palette;
  intensity: number;
}) {
  const u = useMemo(() => ({
    uTime:      { value: 0 },
    uColor:     { value: palette.primary.clone() },
    uIntensity: { value: intensity },
  }), []);

  useFrame(({ clock }) => {
    u.uTime.value = clock.getElapsedTime();
    u.uIntensity.value = lerpVal(u.uIntensity.value, intensity);
    u.uColor.value.lerp(palette.primary, 0.03);
  });

  return (
    <mesh>
      <icosahedronGeometry args={[SPHERE_RADIUS * 0.75, 32]} />
      <shaderMaterial
        vertexShader={coreVert}
        fragmentShader={coreFrag}
        uniforms={u}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/* ======================================================================== */
/*  Data Flow Sparkles — bright flashes along the surface                   */
/* ======================================================================== */

function DataSparkles({
  palette,
  intensity,
  gridCoverage,
}: {
  palette: Palette;
  intensity: number;
  gridCoverage: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const count = 30;

  const { positions, phases, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const sp = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const lat = (Math.random() - 0.5) * 180;
      const lon = (Math.random() - 0.5) * 360;
      const v = latLonToVec3(lat, lon, SPHERE_RADIUS * 1.01);
      pos[i * 3]     = v.x;
      pos[i * 3 + 1] = v.y;
      pos[i * 3 + 2] = v.z;
      ph[i] = Math.random() * Math.PI * 2;
      sp[i] = 1.5 + Math.random() * 3.0;
    }
    return { positions: pos, phases: ph, speeds: sp };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const flash = Math.pow(Math.max(Math.sin(t * speeds[i] + phases[i]), 0.0), 12.0);
      if (flash < 0.01) {
        // Relocate when dark
        const lat = (Math.random() - 0.5) * 180;
        const lon = (Math.random() - 0.5) * 360;
        const v = latLonToVec3(lat, lon, SPHERE_RADIUS * 1.01);
        arr[i * 3]     = v.x;
        arr[i * 3 + 1] = v.y;
        arr[i * 3 + 2] = v.z;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;

    const mat = ref.current.material as THREE.PointsMaterial;
    const targetSize = 0.035 * intensity * (gridCoverage / 100);
    mat.size = lerpVal(mat.size, targetSize);
    mat.opacity = lerpVal(mat.opacity, intensity * 0.9 * (gridCoverage / 100));
    mat.color.lerp(palette.white, 0.03);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        color={palette.white}
        size={0.02}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/* ======================================================================== */
/*  Scene Assembly                                                           */
/* ======================================================================== */

function SystemGlobeScene({
  gridCoverage,
  contactPoints,
  laneCount,
  pulseHealth,
  bpm,
  awakeningStatus,
}: Omit<SystemGlobeProps, 'size' | 'onClick'>) {
  const palette = getPalette(pulseHealth);
  const intensity = getAwakeningIntensity(awakeningStatus);

  return (
    <>
      <ambientLight intensity={0.02} color={palette.dim.getHex()} />

      <AuraGlow palette={palette} intensity={intensity} bpm={bpm} />

      <InnerCore palette={palette} intensity={intensity} />

      <GlobeSurface
        palette={palette}
        gridCoverage={gridCoverage}
        intensity={intensity}
        bpm={bpm}
      />

      <ContactPointsLayer
        points={contactPoints}
        intensity={intensity}
        bpm={bpm}
      />

      <RailLaneLines
        laneCount={laneCount}
        palette={palette}
        intensity={intensity}
      />

      <RailLanes
        laneCount={laneCount}
        palette={palette}
        intensity={intensity}
      />

      <DataSparkles
        palette={palette}
        intensity={intensity}
        gridCoverage={gridCoverage}
      />
    </>
  );
}

/* ======================================================================== */
/*  Export — Canvas Wrapper                                                   */
/* ======================================================================== */

export default function SystemGlobe({
  gridCoverage,
  contactPoints,
  laneCount,
  pulseHealth,
  bpm,
  awakeningStatus,
  size = 400,
  onClick,
}: SystemGlobeProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Memelli System Globe"
      style={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.0], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1.5, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.3;
        }}
      >
        <SystemGlobeScene
          gridCoverage={gridCoverage}
          contactPoints={contactPoints}
          laneCount={laneCount}
          pulseHealth={pulseHealth}
          bpm={bpm}
          awakeningStatus={awakeningStatus}
        />
      </Canvas>
    </div>
  );
}
