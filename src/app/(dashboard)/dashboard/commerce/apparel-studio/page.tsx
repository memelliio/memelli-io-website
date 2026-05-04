'use client';

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import {
  Shirt,
  Upload,
  Palette,
  Ruler,
  Type,
  Sparkles,
  Download,
  ShoppingCart,
  ChevronDown,
  X,
  RotateCcw,
  Plus,
  Minus,
  ImageIcon,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Constants & Types                                                   */
/* ------------------------------------------------------------------ */

type GarmentType = 'tshirt' | 'hoodie' | 'sweatshirt' | 'sweatpants' | 'leggings' | 'hat' | 'socks';
type ViewSide = 'front' | 'back';
type PlacementZone = 'front_center' | 'left_chest' | 'right_chest' | 'full_back' | 'left_sleeve' | 'right_sleeve';
type StudioTab = 'design' | 'text' | 'sizes' | 'order';

interface GarmentDef {
  label: string;
  icon: string;
  zones: PlacementZone[];
  hasSleeves: boolean;
  basePrice: number;
}

interface TextOverlay {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  x: number;
  y: number;
  side: ViewSide;
}

interface LogoPlacement {
  dataUrl: string;
  zone: PlacementZone;
  fileName: string;
}

interface SizeQuantity {
  size: string;
  qty: number;
}

const GARMENTS: Record<GarmentType, GarmentDef> = {
  tshirt:      { label: 'T-Shirt',      icon: 'shirt',       zones: ['front_center', 'left_chest', 'right_chest', 'full_back', 'left_sleeve', 'right_sleeve'], hasSleeves: true,  basePrice: 18 },
  hoodie:      { label: 'Hoodie',       icon: 'layers',      zones: ['front_center', 'left_chest', 'right_chest', 'full_back', 'left_sleeve', 'right_sleeve'], hasSleeves: true,  basePrice: 35 },
  sweatshirt:  { label: 'Sweatshirt',   icon: 'wind',        zones: ['front_center', 'left_chest', 'right_chest', 'full_back', 'left_sleeve', 'right_sleeve'], hasSleeves: true,  basePrice: 30 },
  sweatpants:  { label: 'Sweatpants',   icon: 'move-vertical', zones: ['front_center', 'full_back'],                                                           hasSleeves: false, basePrice: 28 },
  leggings:    { label: 'Leggings',     icon: 'move-vertical', zones: ['front_center', 'full_back'],                                                           hasSleeves: false, basePrice: 25 },
  hat:         { label: 'Hat',          icon: 'circle-dot',  zones: ['front_center'],                                                                          hasSleeves: false, basePrice: 15 },
  socks:       { label: 'Socks',        icon: 'minus',       zones: ['front_center'],                                                                          hasSleeves: false, basePrice: 10 },
};

const BRAND_COLORS = [
  { name: 'Onyx Black',    hex: '#0a0a0a' },
  { name: 'Charcoal',      hex: '#27272a' },
  { name: 'Slate',         hex: '#3f3f46' },
  { name: 'White',         hex: '#fafafa' },
  { name: 'Memelli Red',   hex: '#dc2626' },
  { name: 'Crimson',       hex: '#991b1b' },
  { name: 'Royal Blue',    hex: '#1d4ed8' },
  { name: 'Navy',          hex: '#1e3a5f' },
  { name: 'Forest',        hex: '#166534' },
  { name: 'Sand',          hex: '#d4a574' },
  { name: 'Purple',        hex: '#7c3aed' },
  { name: 'Gold',          hex: '#ca8a04' },
];

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

const SIZE_CHART: Record<string, Record<string, string>> = {
  XS:  { chest: '32-34"', length: '26"',   shoulder: '16"',   sleeve: '7.5"', waist: '26-28"' },
  S:   { chest: '35-37"', length: '27"',   shoulder: '17"',   sleeve: '8"',   waist: '28-30"' },
  M:   { chest: '38-40"', length: '28"',   shoulder: '18"',   sleeve: '8.5"', waist: '30-32"' },
  L:   { chest: '41-43"', length: '29"',   shoulder: '19"',   sleeve: '9"',   waist: '33-35"' },
  XL:  { chest: '44-46"', length: '30"',   shoulder: '20"',   sleeve: '9.5"', waist: '36-38"' },
  '2XL': { chest: '47-49"', length: '31"', shoulder: '21"',   sleeve: '10"',  waist: '39-41"' },
  '3XL': { chest: '50-53"', length: '32"', shoulder: '22"',   sleeve: '10.5"', waist: '42-45"' },
  '4XL': { chest: '54-57"', length: '33"', shoulder: '23.5"', sleeve: '11"',  waist: '46-49"' },
};

const ZONE_LABELS: Record<PlacementZone, string> = {
  front_center: 'Front Center',
  left_chest: 'Left Chest',
  right_chest: 'Right Chest',
  full_back: 'Full Back',
  left_sleeve: 'Left Sleeve',
  right_sleeve: 'Right Sleeve',
};

const FONTS = ['Inter', 'Georgia', 'Courier New', 'Impact', 'Arial Black', 'Trebuchet MS'];

function priceTier(qty: number): number {
  if (qty >= 500) return 0.55;
  if (qty >= 200) return 0.65;
  if (qty >= 100) return 0.70;
  if (qty >= 50)  return 0.75;
  if (qty >= 25)  return 0.85;
  if (qty >= 10)  return 0.90;
  return 1.0;
}

/* ------------------------------------------------------------------ */
/*  Garment SVG Drawings                                               */
/* ------------------------------------------------------------------ */

function GarmentSVG({ garment, side, color, logos, texts, selectedZone }: {
  garment: GarmentType;
  side: ViewSide;
  color: string;
  logos: LogoPlacement[];
  texts: TextOverlay[];
  selectedZone: PlacementZone | null;
}) {
  const isLight = isLightColor(color);
  const strokeColor = isLight ? '#52525b' : 'rgba(255,255,255,0.2)';

  const zonePositions: Record<PlacementZone, { x: number; y: number; w: number; h: number; side: ViewSide }> = {
    front_center:  { x: 115, y: 140, w: 70, h: 70, side: 'front' },
    left_chest:    { x: 95,  y: 110, w: 40, h: 40, side: 'front' },
    right_chest:   { x: 165, y: 110, w: 40, h: 40, side: 'front' },
    full_back:     { x: 100, y: 110, w: 100, h: 100, side: 'back' },
    left_sleeve:   { x: 40,  y: 100, w: 35, h: 50, side: 'front' },
    right_sleeve:  { x: 225, y: 100, w: 35, h: 50, side: 'front' },
  };

  return (
    <svg viewBox="0 0 300 350" className="w-full h-full max-h-[400px]">
      {/* Garment body */}
      {garment === 'tshirt' && (
        <path
          d={side === 'front'
            ? 'M75,70 L50,90 L30,140 L65,130 L65,290 L235,290 L235,130 L270,140 L250,90 L225,70 L200,55 Q175,45 150,50 Q125,45 100,55 Z'
            : 'M75,70 L50,90 L30,140 L65,130 L65,290 L235,290 L235,130 L270,140 L250,90 L225,70 L200,55 Q175,65 150,68 Q125,65 100,55 Z'
          }
          fill={color}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {garment === 'hoodie' && (
        <>
          <path
            d={side === 'front'
              ? 'M75,80 L40,100 L20,160 L60,145 L60,300 L240,300 L240,145 L280,160 L260,100 L225,80 L200,60 Q175,50 150,55 Q125,50 100,60 Z'
              : 'M75,80 L40,100 L20,160 L60,145 L60,300 L240,300 L240,145 L280,160 L260,100 L225,80 L200,60 Q175,70 150,73 Q125,70 100,60 Z'
            }
            fill={color}
            stroke={strokeColor}
            strokeWidth="2"
          />
          {side === 'front' && (
            <path
              d="M120,55 Q135,80 150,85 Q165,80 180,55"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
          )}
          {side === 'back' && (
            <path
              d="M100,60 Q120,35 150,30 Q180,35 200,60 L200,80 Q175,70 150,73 Q125,70 100,80 Z"
              fill={color}
              stroke={strokeColor}
              strokeWidth="1.5"
              filter="brightness(0.9)"
            />
          )}
        </>
      )}
      {garment === 'sweatshirt' && (
        <path
          d={side === 'front'
            ? 'M80,75 L45,95 L25,155 L65,140 L65,295 L235,295 L235,140 L275,155 L255,95 L220,75 L200,58 Q175,48 150,53 Q125,48 100,58 Z'
            : 'M80,75 L45,95 L25,155 L65,140 L65,295 L235,295 L235,140 L275,155 L255,95 L220,75 L200,58 Q175,68 150,70 Q125,68 100,58 Z'
          }
          fill={color}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {garment === 'sweatpants' && (
        <path
          d="M90,40 L80,40 L60,50 L55,120 L45,300 L120,300 L140,160 L150,140 L160,160 L180,300 L255,300 L245,120 L240,50 L220,40 L210,40 Z"
          fill={color}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {garment === 'leggings' && (
        <path
          d="M100,30 L85,30 L75,45 L68,140 L60,310 L130,310 L145,150 L150,130 L155,150 L170,310 L240,310 L232,140 L225,45 L215,30 L200,30 Z"
          fill={color}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}
      {garment === 'hat' && (
        <>
          <ellipse cx="150" cy="200" rx="110" ry="25" fill={color} stroke={strokeColor} strokeWidth="2" />
          <path
            d="M55,200 Q55,100 150,80 Q245,100 245,200"
            fill={color}
            stroke={strokeColor}
            strokeWidth="2"
          />
          {side === 'front' && (
            <path d="M40,200 Q40,210 150,220 Q260,210 260,200" fill={color} stroke={strokeColor} strokeWidth="2" />
          )}
        </>
      )}
      {garment === 'socks' && (
        <path
          d="M110,30 L100,30 L95,200 L90,250 Q80,300 130,310 L170,310 Q220,300 210,250 L205,200 L200,30 L190,30 Z"
          fill={color}
          stroke={strokeColor}
          strokeWidth="2"
        />
      )}

      {/* Placement zone indicators */}
      {GARMENTS[garment].zones
        .filter(z => zonePositions[z].side === side)
        .map(z => {
          const pos = zonePositions[z];
          const isSelected = z === selectedZone;
          const hasLogo = logos.some(l => l.zone === z);
          return (
            <g key={z}>
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.w}
                height={pos.h}
                fill={isSelected ? 'rgba(220,38,38,0.15)' : hasLogo ? 'rgba(220,38,38,0.08)' : 'transparent'}
                stroke={isSelected ? '#dc2626' : hasLogo ? '#dc2626' : 'rgba(255,255,255,0.15)'}
                strokeWidth={isSelected ? 2 : 1}
                strokeDasharray={isSelected || hasLogo ? '0' : '4,4'}
                rx="4"
              />
              {hasLogo && (
                <text
                  x={pos.x + pos.w / 2}
                  y={pos.y + pos.h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#dc2626"
                  fontSize="9"
                  fontWeight="600"
                >
                  LOGO
                </text>
              )}
            </g>
          );
        })}

      {/* Text overlays */}
      {texts
        .filter(t => t.side === side)
        .map(t => (
          <text
            key={t.id}
            x={t.x}
            y={t.y}
            fill={t.color}
            fontSize={t.fontSize}
            fontFamily={t.fontFamily}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {t.text}
          </text>
        ))}
    </svg>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ApparelStudioPage() {
  /* Core state */
  const [garment, setGarment] = useState<GarmentType>('tshirt');
  const [viewSide, setViewSide] = useState<ViewSide>('front');
  const [garmentColor, setGarmentColor] = useState('#0a0a0a');
  const [activeTab, setActiveTab] = useState<StudioTab>('design');

  /* Logo state */
  const [logos, setLogos] = useState<LogoPlacement[]>([]);
  const [selectedZone, setSelectedZone] = useState<PlacementZone | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Text state */
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [newText, setNewText] = useState('');
  const [textFont, setTextFont] = useState('Inter');
  const [textSize, setTextSize] = useState(16);
  const [textColor, setTextColor] = useState('#ffffff');

  /* Order state */
  const [sizeQtys, setSizeQtys] = useState<SizeQuantity[]>(ALL_SIZES.map(s => ({ size: s, qty: 0 })));

  /* Modals */
  const [showMockup, setShowMockup] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [garmentDropdown, setGarmentDropdown] = useState(false);

  const def = GARMENTS[garment];
  const totalQty = sizeQtys.reduce((s, q) => s + q.qty, 0);
  const tier = priceTier(totalQty);
  const unitPrice = +(def.basePrice * tier).toFixed(2);
  const totalPrice = +(unitPrice * totalQty).toFixed(2);

  /* ---- Logo handling ---- */
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const zone = selectedZone || def.zones[0];
    const reader = new FileReader();
    reader.onload = () => {
      setLogos(prev => [...prev.filter(l => l.zone !== zone), { dataUrl: reader.result as string, zone, fileName: file.name }]);
    };
    reader.readAsDataURL(file);
  }, [selectedZone, def.zones]);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  /* ---- Text handling ---- */
  const addText = () => {
    if (!newText.trim()) return;
    setTextOverlays(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: newText,
        fontFamily: textFont,
        fontSize: textSize,
        color: textColor,
        x: 150,
        y: 200,
        side: viewSide,
      },
    ]);
    setNewText('');
  };

  const removeText = (id: string) => setTextOverlays(prev => prev.filter(t => t.id !== id));

  /* ---- Size qty handling ---- */
  const setQty = (size: string, qty: number) => {
    setSizeQtys(prev => prev.map(sq => sq.size === size ? { ...sq, qty: Math.max(0, qty) } : sq));
  };

  /* ---- Tabs ---- */
  const tabs: { key: StudioTab; label: string; icon: React.ReactNode }[] = [
    { key: 'design', label: 'Design',  icon: <Palette className="h-4 w-4" /> },
    { key: 'text',   label: 'Text',    icon: <Type className="h-4 w-4" /> },
    { key: 'sizes',  label: 'Sizes',   icon: <Ruler className="h-4 w-4" /> },
    { key: 'order',  label: 'Order',   icon: <ShoppingCart className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-card">
      <div className="space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/commerce"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted border border-white/[0.06] hover:bg-muted transition-all"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Apparel Design Studio</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Design, preview, and order custom apparel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMockup(true)}
              className="flex items-center gap-2 rounded-xl bg-muted border border-white/[0.06] px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-all"
            >
              <Sparkles className="h-4 w-4 text-red-400" />
              Generate Mockup
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-all"
            >
              <Download className="h-4 w-4" />
              Export for Manufacturing
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          {/* Left: Preview */}
          <div className="space-y-4">
            {/* Garment selector bar */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card border border-white/[0.04] p-3">
              {(Object.entries(GARMENTS) as [GarmentType, GarmentDef][]).map(([key, g]) => (
                <button
                  key={key}
                  onClick={() => { setGarment(key); setSelectedZone(null); setViewSide('front'); }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    garment === key
                      ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                  }`}
                >
                  <span className="text-base">{g.icon}</span>
                  {g.label}
                </button>
              ))}
            </div>

            {/* Preview card */}
            <div className="rounded-2xl bg-card border border-white/[0.04] p-6">
              {/* View toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewSide('front')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all ${
                      viewSide === 'front'
                        ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                        : 'text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setViewSide('back')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all ${
                      viewSide === 'back'
                        ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                        : 'text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    Back
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border-2 border-white/10" style={{ backgroundColor: garmentColor }} />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{garmentColor}</span>
                </div>
              </div>

              {/* Garment drawing */}
              <div className="relative flex items-center justify-center bg-card rounded-xl border border-white/[0.04] p-8 min-h-[420px]">
                {/* Checkerboard-ish background pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
                <div className="relative w-full max-w-[300px]">
                  <GarmentSVG
                    garment={garment}
                    side={viewSide}
                    color={garmentColor}
                    logos={logos}
                    texts={textOverlays}
                    selectedZone={selectedZone}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            {/* Tab bar */}
            <div className="flex rounded-2xl bg-card border border-white/[0.04] p-1">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === t.key
                      ? 'bg-red-600/20 text-red-400'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="rounded-2xl bg-card border border-white/[0.04] p-5 space-y-5">
              {/* ========== DESIGN TAB ========== */}
              {activeTab === 'design' && (
                <>
                  {/* Color palette */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Brand Colors</h3>
                    <div className="grid grid-cols-6 gap-2">
                      {BRAND_COLORS.map(c => (
                        <button
                          key={c.hex}
                          onClick={() => setGarmentColor(c.hex)}
                          title={c.name}
                          className={`h-9 w-full rounded-lg border-2 transition-all hover:scale-110 ${
                            garmentColor === c.hex ? 'border-red-500 ring-2 ring-red-500/30' : 'border-white/[0.08]'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Custom:</label>
                      <input
                        type="color"
                        value={garmentColor}
                        onChange={e => setGarmentColor(e.target.value)}
                        className="h-7 w-10 cursor-pointer rounded border border-white/[0.08] bg-transparent"
                      />
                      <input
                        type="text"
                        value={garmentColor}
                        onChange={e => setGarmentColor(e.target.value)}
                        className="flex-1 rounded-lg border border-white/[0.08] bg-muted px-3 py-1.5 text-xs text-foreground font-mono"
                      />
                    </div>
                  </div>

                  {/* Placement zones */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Placement Zone</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {def.zones.map(z => (
                        <button
                          key={z}
                          onClick={() => setSelectedZone(selectedZone === z ? null : z)}
                          className={`rounded-lg px-3 py-2 text-xs font-medium transition-all text-left ${
                            selectedZone === z
                              ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                              : logos.some(l => l.zone === z)
                                ? 'bg-muted text-foreground border border-red-500/20'
                                : 'bg-muted text-muted-foreground border border-white/[0.06] hover:border-white/10'
                          }`}
                        >
                          {ZONE_LABELS[z]}
                          {logos.some(l => l.zone === z) && (
                            <span className="ml-1 text-[10px] text-red-400">(logo)</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo upload */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Logo Upload</h3>
                    <div
                      onDrop={onDrop}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 cursor-pointer transition-all ${
                        dragOver
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-white/[0.08] bg-muted hover:border-white/[0.15]'
                      }`}
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Drag & drop or <span className="text-red-400 font-medium">browse</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">PNG, SVG, JPG up to 5MB</p>
                      {selectedZone && (
                        <p className="text-[10px] text-red-400 font-medium mt-1">
                          Target: {ZONE_LABELS[selectedZone]}
                        </p>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />

                    {/* Logo list */}
                    {logos.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {logos.map((l, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-muted border border-white/[0.06] px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <ImageIcon className="h-3.5 w-3.5 text-red-400 shrink-0" />
                              <span className="text-xs text-foreground truncate">{l.fileName}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">{ZONE_LABELS[l.zone]}</span>
                            </div>
                            <button
                              onClick={() => setLogos(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ========== TEXT TAB ========== */}
              {activeTab === 'text' && (
                <>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Add Text Overlay</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                        placeholder="Enter text..."
                        className="w-full rounded-lg border border-white/[0.08] bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/50 focus:outline-none transition-all"
                        onKeyDown={e => e.key === 'Enter' && addText()}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Font</label>
                          <div className="relative">
                            <select
                              value={textFont}
                              onChange={e => setTextFont(e.target.value)}
                              className="w-full appearance-none rounded-lg border border-white/[0.08] bg-muted px-3 py-2 text-xs text-foreground focus:border-red-500/50 focus:outline-none"
                            >
                              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Size</label>
                          <input
                            type="number"
                            value={textSize}
                            onChange={e => setTextSize(Number(e.target.value))}
                            min={8}
                            max={48}
                            className="w-full rounded-lg border border-white/[0.08] bg-muted px-3 py-2 text-xs text-foreground focus:border-red-500/50 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={textColor}
                              onChange={e => setTextColor(e.target.value)}
                              className="h-8 w-10 cursor-pointer rounded border border-white/[0.08] bg-transparent"
                            />
                            <span className="text-xs text-muted-foreground font-mono">{textColor}</span>
                          </div>
                        </div>
                        <div className="flex-1" />
                        <button
                          onClick={addText}
                          disabled={!newText.trim()}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-4"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Text overlay list */}
                  {textOverlays.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Text Layers</h3>
                      <div className="space-y-2">
                        {textOverlays.map(t => (
                          <div key={t.id} className="flex items-center justify-between rounded-lg bg-muted border border-white/[0.06] px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Type className="h-3.5 w-3.5 text-red-400 shrink-0" />
                              <span className="text-xs text-foreground truncate" style={{ fontFamily: t.fontFamily, color: t.color }}>
                                {t.text}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0">{t.side}</span>
                            </div>
                            <button
                              onClick={() => removeText(t.id)}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {textOverlays.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Type className="h-8 w-8 mb-2" />
                      <p className="text-xs">No text overlays yet</p>
                    </div>
                  )}
                </>
              )}

              {/* ========== SIZES TAB ========== */}
              {activeTab === 'sizes' && (
                <>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Size Chart &mdash; {def.label}
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted">
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Chest</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Length</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Shoulder</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {ALL_SIZES.map(s => (
                            <tr key={s} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-3 py-2 font-semibold text-foreground">{s}</td>
                              <td className="px-3 py-2 text-muted-foreground">{SIZE_CHART[s].chest}</td>
                              <td className="px-3 py-2 text-muted-foreground">{SIZE_CHART[s].length}</td>
                              <td className="px-3 py-2 text-muted-foreground">{SIZE_CHART[s].shoulder}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Additional Measurements</h3>
                    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted">
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Sleeve</th>
                            <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Waist</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {ALL_SIZES.map(s => (
                            <tr key={s} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-3 py-2 font-semibold text-foreground">{s}</td>
                              <td className="px-3 py-2 text-muted-foreground">{SIZE_CHART[s].sleeve}</td>
                              <td className="px-3 py-2 text-muted-foreground">{SIZE_CHART[s].waist}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ========== ORDER TAB ========== */}
              {activeTab === 'order' && (
                <>
                  {/* Quantity by size */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quantity by Size</h3>
                    <div className="space-y-2">
                      {sizeQtys.map(sq => (
                        <div key={sq.size} className="flex items-center justify-between rounded-lg bg-muted border border-white/[0.06] px-3 py-2">
                          <span className="text-sm font-semibold text-foreground w-12">{sq.size}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setQty(sq.size, sq.qty - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              value={sq.qty}
                              onChange={e => setQty(sq.size, Number(e.target.value))}
                              min={0}
                              className="w-16 rounded-lg border border-white/[0.08] bg-muted px-2 py-1.5 text-center text-sm text-foreground focus:border-red-500/50 focus:outline-none"
                            />
                            <button
                              onClick={() => setQty(sq.size, sq.qty + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price calculator */}
                  <div className="rounded-xl bg-muted border border-white/[0.06] p-4 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price Calculator</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Base price ({def.label})</span>
                        <span>${def.basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Quantity discount</span>
                        <span className={tier < 1 ? 'text-emerald-400' : 'text-muted-foreground'}>
                          {tier < 1 ? `-${((1 - tier) * 100).toFixed(0)}%` : 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Unit price</span>
                        <span className="text-foreground font-medium">${unitPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total units</span>
                        <span className="text-foreground font-medium">{totalQty}</span>
                      </div>
                      <div className="border-t border-white/[0.06] pt-2 flex justify-between">
                        <span className="font-semibold text-foreground">Total</span>
                        <span className="font-bold text-lg text-red-400">${totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Tier table */}
                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Quantity Tier Pricing</p>
                      <div className="grid grid-cols-3 gap-1 text-[10px]">
                        {[
                          { label: '1-9', disc: '0%' },
                          { label: '10-24', disc: '10%' },
                          { label: '25-49', disc: '15%' },
                          { label: '50-99', disc: '25%' },
                          { label: '100-199', disc: '30%' },
                          { label: '200-499', disc: '35%' },
                          { label: '500+', disc: '45%' },
                        ].map(t => (
                          <div key={t.label} className="rounded bg-card px-2 py-1 text-center">
                            <div className="text-muted-foreground">{t.label}</div>
                            <div className="text-emerald-400 font-semibold">{t.disc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    disabled={totalQty === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Place Order &mdash; ${totalPrice.toFixed(2)}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== MOCKUP MODAL ========== */}
      {showMockup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={() => setShowMockup(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-white/[0.06] p-6 mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowMockup(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-foreground mb-1">Generated Mockup</h2>
            <p className="text-xs text-muted-foreground mb-4">Preview of your {def.label} design</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-card border border-white/[0.04] p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 text-center">Front</p>
                <GarmentSVG garment={garment} side="front" color={garmentColor} logos={logos} texts={textOverlays} selectedZone={null} />
              </div>
              <div className="rounded-xl bg-card border border-white/[0.04] p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 text-center">Back</p>
                <GarmentSVG garment={garment} side="back" color={garmentColor} logos={logos} texts={textOverlays} selectedZone={null} />
              </div>
            </div>

            <div className="rounded-xl bg-muted border border-white/[0.06] p-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Garment</span><span className="text-foreground">{def.label}</span></div>
              <div className="flex justify-between"><span>Color</span><span className="text-foreground font-mono">{garmentColor}</span></div>
              <div className="flex justify-between"><span>Logos</span><span className="text-foreground">{logos.length} placed</span></div>
              <div className="flex justify-between"><span>Text Layers</span><span className="text-foreground">{textOverlays.length}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ========== EXPORT MODAL ========== */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background backdrop-blur-sm" onClick={() => setShowExport(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-card border border-white/[0.06] p-6 mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowExport(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-foreground mb-1">Manufacturing Export Spec</h2>
            <p className="text-xs text-muted-foreground mb-5">Complete specification for production</p>

            <div className="space-y-4">
              {/* Product spec */}
              <div className="rounded-xl bg-muted border border-white/[0.06] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">Product Specification</h3>
                <div className="space-y-2 text-xs">
                  <Row label="Garment Type" value={def.label} />
                  <Row label="Base Color" value={garmentColor} mono />
                  <Row label="Available Sizes" value={ALL_SIZES.join(', ')} />
                </div>
              </div>

              {/* Print placement */}
              <div className="rounded-xl bg-muted border border-white/[0.06] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">Print Placement Map</h3>
                {logos.length === 0 && textOverlays.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No graphics or text placed</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {logos.map((l, i) => (
                      <Row key={i} label={ZONE_LABELS[l.zone]} value={`Logo: ${l.fileName}`} />
                    ))}
                    {textOverlays.map(t => (
                      <Row key={t.id} label={`Text (${t.side})`} value={`"${t.text}" - ${t.fontFamily} ${t.fontSize}px`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Order breakdown */}
              <div className="rounded-xl bg-muted border border-white/[0.06] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">Order Breakdown</h3>
                {totalQty === 0 ? (
                  <p className="text-xs text-muted-foreground">No quantities set</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {sizeQtys.filter(sq => sq.qty > 0).map(sq => (
                      <Row key={sq.size} label={`Size ${sq.size}`} value={`${sq.qty} units`} />
                    ))}
                    <div className="border-t border-white/[0.06] pt-2">
                      <Row label="Total Units" value={`${totalQty}`} bold />
                      <Row label="Unit Price" value={`$${unitPrice.toFixed(2)}`} />
                      <Row label="Total Cost" value={`$${totalPrice.toFixed(2)}`} bold />
                    </div>
                  </div>
                )}
              </div>

              {/* Export formats */}
              <div className="rounded-xl bg-muted border border-white/[0.06] p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3">Export Formats</h3>
                <div className="grid grid-cols-4 gap-2">
                  {['PDF', 'SVG', 'AI', 'PNG'].map(fmt => (
                    <button
                      key={fmt}
                      className="rounded-lg border border-white/[0.08] bg-card py-2 text-xs font-semibold text-foreground hover:border-red-500/30 hover:text-red-400 transition-all"
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Utility Components                                                 */
/* ------------------------------------------------------------------ */

function Row({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={`text-muted-foreground ${bold ? 'font-semibold text-foreground' : ''}`}>{label}</span>
      <span className={`${bold ? 'font-bold text-foreground' : 'text-foreground'} ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
