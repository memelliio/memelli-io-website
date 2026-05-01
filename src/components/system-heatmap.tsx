'use client';

import { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

/* ======================================================================== */
/*  Types                                                                    */
/* ======================================================================== */

export interface SubsystemData {
  name: string;
  label: string;
  count: number;
  rate: number; // events per second
  intensity: number; // 0-1 normalized activity level
  is911?: boolean;
  group: string; // 'crm' | 'commerce' | 'coaching' | 'seo' | 'ai' | 'system' | 'queue' | 'auth'
}

export interface HeatmapSnapshot {
  subsystems: SubsystemData[];
  healthScore: number; // 0-100
  bpm: number;
  timestamp: number;
}

export interface SystemHeatmapProps {
  data: HeatmapSnapshot | null;
  onCellClick?: (subsystem: string) => void;
  autoRotate?: boolean;
}

/* ======================================================================== */
/*  Constants                                                                */
/* ======================================================================== */

const COLS = 8;
const ROWS = 6;
const CELL_SIZE = 0.9;
const GAP = 0.15;
const GRID_WIDTH = COLS * (CELL_SIZE + GAP) - GAP;
const GRID_DEPTH = ROWS * (CELL_SIZE + GAP) - GAP;
const MAX_HEIGHT = 3.5;
const MIN_HEIGHT = 0.08;

/* Default subsystem definitions — 48 cells covering the full system */
const DEFAULT_SUBSYSTEMS: SubsystemData[] = [
  // Row 0 — CRM
  { name: 'contact', label: 'Contact', count: 0, rate: 0, intensity: 0, group: 'crm' },
  { name: 'deal', label: 'Deal', count: 0, rate: 0, intensity: 0, group: 'crm' },
  { name: 'pipeline', label: 'Pipeline', count: 0, rate: 0, intensity: 0, group: 'crm' },
  { name: 'communication', label: 'Comms', count: 0, rate: 0, intensity: 0, group: 'crm' },
  { name: 'custom_field', label: 'Fields', count: 0, rate: 0, intensity: 0, group: 'crm' },
  { name: 'lead', label: 'Lead', count: 0, rate: 0, intensity: 0, group: 'crm' },
  { name: 'segment', label: 'Segment', count: 0, rate: 0, intensity: 0, group: 'crm' },
  { name: 'tag', label: 'Tag', count: 0, rate: 0, intensity: 0, group: 'crm' },
  // Row 1 — Commerce
  { name: 'order', label: 'Order', count: 0, rate: 0, intensity: 0, group: 'commerce' },
  { name: 'product', label: 'Product', count: 0, rate: 0, intensity: 0, group: 'commerce' },
  { name: 'store', label: 'Store', count: 0, rate: 0, intensity: 0, group: 'commerce' },
  { name: 'subscription', label: 'Sub', count: 0, rate: 0, intensity: 0, group: 'commerce' },
  { name: 'auction', label: 'Auction', count: 0, rate: 0, intensity: 0, group: 'commerce' },
  { name: 'affiliate', label: 'Affiliate', count: 0, rate: 0, intensity: 0, group: 'commerce' },
  { name: 'payment', label: 'Payment', count: 0, rate: 0, intensity: 0, group: 'commerce' },
  { name: 'invoice', label: 'Invoice', count: 0, rate: 0, intensity: 0, group: 'commerce' },
  // Row 2 — Coaching
  { name: 'program', label: 'Program', count: 0, rate: 0, intensity: 0, group: 'coaching' },
  { name: 'module', label: 'Module', count: 0, rate: 0, intensity: 0, group: 'coaching' },
  { name: 'lesson', label: 'Lesson', count: 0, rate: 0, intensity: 0, group: 'coaching' },
  { name: 'enrollment', label: 'Enroll', count: 0, rate: 0, intensity: 0, group: 'coaching' },
  { name: 'certificate', label: 'Cert', count: 0, rate: 0, intensity: 0, group: 'coaching' },
  { name: 'quiz', label: 'Quiz', count: 0, rate: 0, intensity: 0, group: 'coaching' },
  { name: 'progress', label: 'Progress', count: 0, rate: 0, intensity: 0, group: 'coaching' },
  { name: 'assignment', label: 'Assign', count: 0, rate: 0, intensity: 0, group: 'coaching' },
  // Row 3 — SEO + Content
  { name: 'keyword', label: 'Keyword', count: 0, rate: 0, intensity: 0, group: 'seo' },
  { name: 'article', label: 'Article', count: 0, rate: 0, intensity: 0, group: 'seo' },
  { name: 'ranking', label: 'Ranking', count: 0, rate: 0, intensity: 0, group: 'seo' },
  { name: 'indexnow', label: 'IndexNow', count: 0, rate: 0, intensity: 0, group: 'seo' },
  { name: 'page', label: 'Page', count: 0, rate: 0, intensity: 0, group: 'seo' },
  { name: 'media', label: 'Media', count: 0, rate: 0, intensity: 0, group: 'seo' },
  { name: 'form', label: 'Form', count: 0, rate: 0, intensity: 0, group: 'seo' },
  { name: 'automation', label: 'Auto', count: 0, rate: 0, intensity: 0, group: 'seo' },
  // Row 4 — AI + Queues
  { name: 'ai_agent', label: 'AI Agent', count: 0, rate: 0, intensity: 0, group: 'ai' },
  { name: 'ai_task', label: 'AI Task', count: 0, rate: 0, intensity: 0, group: 'ai' },
  { name: 'ai_queue', label: 'AI Queue', count: 0, rate: 0, intensity: 0, group: 'ai' },
  { name: 'work_order', label: 'WorkOrder', count: 0, rate: 0, intensity: 0, group: 'ai' },
  { name: 'content_queue', label: 'Content Q', count: 0, rate: 0, intensity: 0, group: 'queue' },
  { name: 'notify_queue', label: 'Notify Q', count: 0, rate: 0, intensity: 0, group: 'queue' },
  { name: 'commerce_queue', label: 'Comm Q', count: 0, rate: 0, intensity: 0, group: 'queue' },
  { name: 'analytics_queue', label: 'Analy Q', count: 0, rate: 0, intensity: 0, group: 'queue' },
  // Row 5 — System + Auth
  { name: 'tenant', label: 'Tenant', count: 0, rate: 0, intensity: 0, group: 'system' },
  { name: 'user', label: 'User', count: 0, rate: 0, intensity: 0, group: 'system' },
  { name: 'session', label: 'Session', count: 0, rate: 0, intensity: 0, group: 'auth' },
  { name: 'api_key', label: 'API Key', count: 0, rate: 0, intensity: 0, group: 'auth' },
  { name: 'webhook', label: 'Webhook', count: 0, rate: 0, intensity: 0, group: 'system' },
  { name: 'event_bus', label: 'EventBus', count: 0, rate: 0, intensity: 0, group: 'system' },
  { name: 'rail_lane', label: 'RailLane', count: 0, rate: 0, intensity: 0, group: 'system' },
  { name: 'heartbeat', label: 'Heartbeat', count: 0, rate: 0, intensity: 0, group: 'system' },
];

/* ======================================================================== */
/*  Color Helpers                                                            */
/* ======================================================================== */

const COLOR_COLD = new THREE.Color('#1e40af');     // blue-800
const COLOR_COOL = new THREE.Color('#3b82f6');     // blue-500
const COLOR_WARM = new THREE.Color('#eab308');     // yellow-500
const COLOR_HOT = new THREE.Color('#ef4444');      // red-500
const COLOR_911 = new THREE.Color('#ffffff');       // white glow

const GROUP_TINTS: Record<string, THREE.Color> = {
  crm: new THREE.Color('#06b6d4'),
  commerce: new THREE.Color('#3b82f6'),
  coaching: new THREE.Color('#22c55e'),
  seo: new THREE.Color('#f97316'),
  ai: new THREE.Color('#ec4899'),
  queue: new THREE.Color('#14b8a6'),
  system: new THREE.Color('#f59e0b'),
  auth: new THREE.Color('#64748b'),
};

/* Connection pairs — subsystems linked by data flow */
const CONNECTIONS: [string, string][] = [
  ['contact', 'deal'],
  ['deal', 'pipeline'],
  ['contact', 'communication'],
  ['order', 'product'],
  ['order', 'payment'],
  ['subscription', 'payment'],
  ['program', 'module'],
  ['module', 'lesson'],
  ['enrollment', 'progress'],
  ['keyword', 'article'],
  ['article', 'indexnow'],
  ['ai_agent', 'ai_task'],
  ['ai_task', 'ai_queue'],
  ['ai_agent', 'work_order'],
  ['work_order', 'ai_queue'],
  ['event_bus', 'rail_lane'],
  ['rail_lane', 'heartbeat'],
  ['tenant', 'user'],
  ['user', 'session'],
  ['automation', 'notify_queue'],
  ['ai_queue', 'content_queue'],
];

function getHeatColor(intensity: number, is911: boolean): THREE.Color {
  if (is911) return COLOR_911.clone();
  const c = new THREE.Color();
  if (intensity < 0.25) {
    c.copy(COLOR_COLD).lerp(COLOR_COOL, intensity / 0.25);
  } else if (intensity < 0.5) {
    c.copy(COLOR_COOL).lerp(COLOR_WARM, (intensity - 0.25) / 0.25);
  } else {
    c.copy(COLOR_WARM).lerp(COLOR_HOT, (intensity - 0.5) / 0.5);
  }
  return c;
}

function lerpVal(current: number, target: number, speed = 0.06): number {
  return current + (target - current) * speed;
}

/* ======================================================================== */
/*  Merge live data into the 48-cell grid                                    */
/* ======================================================================== */

function mergeData(live: SubsystemData[] | undefined): SubsystemData[] {
  if (!live || live.length === 0) return DEFAULT_SUBSYSTEMS;
  const map = new Map<string, SubsystemData>();
  for (const s of live) map.set(s.name, s);
  return DEFAULT_SUBSYSTEMS.map((def) => {
    const src = map.get(def.name);
    if (!src) return def;
    return { ...def, ...src };
  });
}

/* ======================================================================== */
/*  Tooltip state (shared via simple store to avoid re-renders)              */
/* ======================================================================== */

interface TooltipInfo {
  name: string;
  label: string;
  count: number;
  rate: number;
  intensity: number;
  is911: boolean;
  screenX: number;
  screenY: number;
}

/* ======================================================================== */
/*  Single Heat Column                                                       */
/* ======================================================================== */

function HeatColumn({
  sub,
  col,
  row,
  onHover,
  onLeave,
  onClick,
}: {
  sub: SubsystemData;
  col: number;
  row: number;
  onHover: (info: TooltipInfo) => void;
  onLeave: () => void;
  onClick?: (name: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const currentHeight = useRef(MIN_HEIGHT);
  const currentColor = useRef(new THREE.Color(COLOR_COLD));
  const targetColor = useRef(new THREE.Color(COLOR_COLD));
  const emissiveTarget = useRef(new THREE.Color(0, 0, 0));

  const x = col * (CELL_SIZE + GAP) - GRID_WIDTH / 2 + CELL_SIZE / 2;
  const z = row * (CELL_SIZE + GAP) - GRID_DEPTH / 2 + CELL_SIZE / 2;

  const { camera, size: viewportSize } = useThree();

  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current) return;
    const t = clock.getElapsedTime();

    // Target height
    const targetH = MIN_HEIGHT + sub.intensity * MAX_HEIGHT;
    currentHeight.current = lerpVal(currentHeight.current, targetH, 0.08);
    const h = currentHeight.current;

    // Animate scale
    meshRef.current.scale.set(1, h, 1);
    meshRef.current.position.set(x, h / 2, z);

    // Color
    targetColor.current.copy(getHeatColor(sub.intensity, sub.is911 ?? false));
    currentColor.current.lerp(targetColor.current, 0.05);
    matRef.current.color.copy(currentColor.current);

    // Emissive glow
    const emissiveStrength = sub.is911 ? 2.0 : sub.intensity * 0.8;
    emissiveTarget.current.copy(currentColor.current).multiplyScalar(emissiveStrength);
    matRef.current.emissive.lerp(emissiveTarget.current, 0.05);
    matRef.current.emissiveIntensity = sub.is911 ? 2.0 + Math.sin(t * 6) * 0.5 : 1.0;

    // 911 pulse
    if (sub.is911) {
      const pulse = Math.sin(t * 8) * 0.1 + 1.0;
      meshRef.current.scale.x = pulse;
      meshRef.current.scale.z = pulse;
    }

    // Point light for hot cells
    if (glowRef.current) {
      glowRef.current.position.set(x, h + 0.3, z);
      glowRef.current.intensity = lerpVal(glowRef.current.intensity, sub.intensity > 0.6 ? sub.intensity * 2 : 0, 0.05);
      glowRef.current.color.copy(currentColor.current);
    }
  });

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!meshRef.current) return;
    const pos = new THREE.Vector3(x, currentHeight.current, z);
    pos.project(camera);
    const sx = (pos.x * 0.5 + 0.5) * viewportSize.width;
    const sy = (-pos.y * 0.5 + 0.5) * viewportSize.height;
    onHover({
      name: sub.name,
      label: sub.label,
      count: sub.count,
      rate: sub.rate,
      intensity: sub.intensity,
      is911: sub.is911 ?? false,
      screenX: sx,
      screenY: sy,
    });
  }, [sub, x, camera, viewportSize, onHover]);

  const handlePointerOut = useCallback(() => {
    onLeave();
  }, [onLeave]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(sub.name);
  }, [sub.name, onClick]);

  return (
    <>
      <mesh
        ref={meshRef}
        position={[x, MIN_HEIGHT / 2, z]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[CELL_SIZE * 0.92, 1, CELL_SIZE * 0.92]} />
        <meshStandardMaterial
          ref={matRef}
          color={COLOR_COLD}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.92}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={glowRef} position={[x, 1, z]} intensity={0} distance={3} decay={2} />
    </>
  );
}

/* ======================================================================== */
/*  Grid Labels                                                              */
/* ======================================================================== */

function GridLabels({ subsystems }: { subsystems: SubsystemData[] }) {
  return (
    <group>
      {subsystems.map((sub, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = col * (CELL_SIZE + GAP) - GRID_WIDTH / 2 + CELL_SIZE / 2;
        const z = row * (CELL_SIZE + GAP) - GRID_DEPTH / 2 + CELL_SIZE / 2;
        return (
          <Text
            key={sub.name}
            position={[x, -0.15, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.13}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            maxWidth={CELL_SIZE * 0.85}
            font={undefined}
          >
            {sub.label}
          </Text>
        );
      })}
    </group>
  );
}

/* ======================================================================== */
/*  Connection Lines                                                         */
/* ======================================================================== */

function ConnectionLines({
  subsystems,
}: {
  subsystems: SubsystemData[];
}) {
  const groupRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    const nameToIndex = new Map<string, number>();
    subsystems.forEach((s, i) => nameToIndex.set(s.name, i));

    const result: THREE.Line[] = [];
    for (const [a, b] of CONNECTIONS) {
      const ai = nameToIndex.get(a);
      const bi = nameToIndex.get(b);
      if (ai === undefined || bi === undefined) continue;

      const colA = ai % COLS;
      const rowA = Math.floor(ai / COLS);
      const colB = bi % COLS;
      const rowB = Math.floor(bi / COLS);

      const xa = colA * (CELL_SIZE + GAP) - GRID_WIDTH / 2 + CELL_SIZE / 2;
      const za = rowA * (CELL_SIZE + GAP) - GRID_DEPTH / 2 + CELL_SIZE / 2;
      const xb = colB * (CELL_SIZE + GAP) - GRID_WIDTH / 2 + CELL_SIZE / 2;
      const zb = rowB * (CELL_SIZE + GAP) - GRID_DEPTH / 2 + CELL_SIZE / 2;

      const yA = MIN_HEIGHT + subsystems[ai].intensity * MAX_HEIGHT * 0.5;
      const yB = MIN_HEIGHT + subsystems[bi].intensity * MAX_HEIGHT * 0.5;
      const midY = Math.max(yA, yB) + 0.3;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(xa, yA, za),
        new THREE.Vector3((xa + xb) / 2, midY, (za + zb) / 2),
        new THREE.Vector3(xb, yB, zb),
      );
      const pts = curve.getPoints(24);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);

      const avgIntensity = (subsystems[ai].intensity + subsystems[bi].intensity) / 2;
      const lineColor = getHeatColor(avgIntensity, false);

      const mat = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: 0.15 + avgIntensity * 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      result.push(new THREE.Line(geo, mat));
    }
    return result;
  }, [subsystems]);

  useEffect(() => {
    if (!groupRef.current) return;
    for (const line of lines) groupRef.current.add(line);
    return () => {
      for (const line of lines) {
        groupRef.current?.remove(line);
        line.geometry.dispose();
        (line.material as THREE.LineBasicMaterial).dispose();
      }
    };
  }, [lines]);

  return <group ref={groupRef} />;
}

/* ======================================================================== */
/*  Ground Plane — sci-fi grid with lane flow                                */
/* ======================================================================== */

const groundVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const groundFrag = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv * 16.0;
    float gridX = abs(fract(uv.x) - 0.5) * 2.0;
    float gridY = abs(fract(uv.y) - 0.5) * 2.0;
    float gridLine = 1.0 - smoothstep(0.0, 0.06, min(gridX, gridY));

    // Lane flow — horizontal scan lines
    float scan = sin(uv.y * 3.14159 + uTime * 1.5) * 0.5 + 0.5;
    scan = pow(scan, 8.0) * 0.15;

    // Pulse effect
    float pulseFx = sin(uTime * uPulse * 0.1) * 0.5 + 0.5;

    vec3 gridColor = vec3(0.1, 0.2, 0.4) * gridLine * 0.4;
    vec3 scanColor = vec3(0.05, 0.3, 0.5) * scan;
    vec3 pulseColor = vec3(0.0, 0.1, 0.2) * pulseFx * 0.2;

    vec3 col = gridColor + scanColor + pulseColor;
    float alpha = gridLine * 0.3 + scan + pulseFx * 0.05;
    alpha = clamp(alpha, 0.0, 0.5);

    gl_FragColor = vec4(col, alpha);
  }
`;

function GroundPlane({ bpm }: { bpm: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPulse: { value: bpm },
  }), []);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    matRef.current.uniforms.uPulse.value = bpm;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[GRID_WIDTH + 4, GRID_DEPTH + 4]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={groundVert}
        fragmentShader={groundFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ======================================================================== */
/*  System Heartbeat Pulse — entire grid pulses                              */
/* ======================================================================== */

function HeartbeatPulse({ bpm, groupRef }: { bpm: number; groupRef: React.RefObject<THREE.Group | null> }) {
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const bps = Math.max(bpm, 40) / 60;
    const heartbeat = Math.sin(t * bps * Math.PI * 2);
    const scale = 1.0 + heartbeat * 0.008;
    groupRef.current.scale.setScalar(scale);
  });
  return null;
}

/* ======================================================================== */
/*  Row Group Labels                                                         */
/* ======================================================================== */

const ROW_LABELS = ['CRM', 'COMMERCE', 'COACHING', 'SEO / CONTENT', 'AI / QUEUES', 'SYSTEM'];

function RowLabels() {
  return (
    <group>
      {ROW_LABELS.map((label, row) => {
        const z = row * (CELL_SIZE + GAP) - GRID_DEPTH / 2 + CELL_SIZE / 2;
        const x = -GRID_WIDTH / 2 - 0.8;
        return (
          <Text
            key={label}
            position={[x, 0.05, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.16}
            color="#64748b"
            anchorX="right"
            anchorY="middle"
            font={undefined}
          >
            {label}
          </Text>
        );
      })}
    </group>
  );
}

/* ======================================================================== */
/*  Scene Assembly                                                           */
/* ======================================================================== */

function HeatmapScene({
  data,
  onCellClick,
  autoRotate = true,
}: SystemHeatmapProps) {
  const gridGroupRef = useRef<THREE.Group>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const subsystems = useMemo(() => mergeData(data?.subsystems), [data]);
  const bpm = data?.bpm ?? 60;

  const handleHover = useCallback((info: TooltipInfo) => {
    setTooltip(info);
  }, []);

  const handleLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} color="#1e293b" />
      <directionalLight position={[5, 8, 5]} intensity={0.4} color="#cbd5e1" />
      <directionalLight position={[-3, 6, -3]} intensity={0.2} color="#3b82f6" />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#60a5fa" distance={15} decay={2} />

      {/* Controls */}
      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={0.4}
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI * 0.45}
        minPolarAngle={Math.PI * 0.15}
        minDistance={4}
        maxDistance={18}
      />

      {/* Heartbeat pulse */}
      <HeartbeatPulse bpm={bpm} groupRef={gridGroupRef} />

      <group ref={gridGroupRef}>
        {/* Ground plane */}
        <GroundPlane bpm={bpm} />

        {/* Heat columns */}
        {subsystems.map((sub, i) => (
          <HeatColumn
            key={sub.name}
            sub={sub}
            col={i % COLS}
            row={Math.floor(i / COLS)}
            onHover={handleHover}
            onLeave={handleLeave}
            onClick={onCellClick}
          />
        ))}

        {/* Grid labels */}
        <GridLabels subsystems={subsystems} />

        {/* Row labels */}
        <RowLabels />

        {/* Connection lines */}
        <ConnectionLines subsystems={subsystems} />
      </group>

      {/* Tooltip via HTML overlay */}
      {tooltip && (
        <Html
          position={[0, 0, 0]}
          style={{
            position: 'fixed',
            left: tooltip.screenX,
            top: tooltip.screenY - 90,
            pointerEvents: 'none',
            zIndex: 999,
          }}
          center
          zIndexRange={[999, 1000]}
        >
          <div
            className="pointer-events-none rounded-lg border px-3 py-2 text-xs shadow-xl backdrop-blur-sm"
            style={{
              background: 'rgba(2, 6, 23, 0.9)',
              borderColor: tooltip.is911 ? '#fff' : '#334155',
              color: '#e2e8f0',
              minWidth: 140,
            }}
          >
            <div className="mb-1 font-bold" style={{ color: tooltip.is911 ? '#fff' : '#60a5fa' }}>
              {tooltip.label}
              {tooltip.is911 && (
                <span className="ml-2 rounded px-1 text-[10px] font-bold" style={{ background: '#dc2626', color: '#fff' }}>
                  911
                </span>
              )}
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Count</span>
              <span className="font-mono">{tooltip.count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Rate</span>
              <span className="font-mono">{tooltip.rate.toFixed(1)}/s</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Heat</span>
              <span className="font-mono">{(tooltip.intensity * 100).toFixed(0)}%</span>
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

/* ======================================================================== */
/*  Export — Canvas Wrapper                                                   */
/* ======================================================================== */

export default function SystemHeatmap({
  data,
  onCellClick,
  autoRotate = true,
}: SystemHeatmapProps) {
  return (
    <div className="h-full w-full" style={{ minHeight: 400, background: '#020617' }}>
      <Canvas
        camera={{ position: [0, 7, 9], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x020617, 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <HeatmapScene
          data={data}
          onCellClick={onCellClick}
          autoRotate={autoRotate}
        />
      </Canvas>
    </div>
  );
}
