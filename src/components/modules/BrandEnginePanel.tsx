'use client';

import { useState, useCallback } from 'react';

/* =========================================================================
   Constants
   ========================================================================= */

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

/* =========================================================================
   Types
   ========================================================================= */

type AssetType =
  | 'taglines'
  | 'bio'
  | 'social_bio'
  | 'email_signature'
  | 'elevator_pitch'
  | 'brand_values';

interface AssetConfig {
  label: string;
  description: string;
  promptTemplate: (ctx: PromptContext) => string;
  outputLabel: string;
  multiResult: boolean;
}

interface PromptContext {
  brandName: string;
  industry: string;
  audience: string;
  tone: string;
  keywords: string;
}

interface GeneratedAsset {
  type: AssetType;
  content: string;
  generatedAt: string;
}

/* =========================================================================
   Asset Definitions
   ========================================================================= */

const ASSET_CONFIGS: Record<AssetType, AssetConfig> = {
  taglines: {
    label: 'Taglines',
    description: 'Punchy one-liners that capture your brand',
    outputLabel: 'Taglines',
    multiResult: true,
    promptTemplate: ({ brandName, industry, audience, tone, keywords }) =>
      `Generate 5 compelling brand taglines for "${brandName}", a ${industry} brand targeting ${audience}. Tone: ${tone}.${keywords ? ` Keywords to incorporate: ${keywords}.` : ''} Return only the taglines, one per line, no numbering or extra commentary.`,
  },
  bio: {
    label: 'Brand Bio',
    description: 'Professional brand story for about pages',
    outputLabel: 'Brand Bio',
    multiResult: false,
    promptTemplate: ({ brandName, industry, audience, tone, keywords }) =>
      `Write a compelling 2-paragraph brand bio for "${brandName}", a ${industry} brand. Target audience: ${audience}. Tone: ${tone}.${keywords ? ` Key themes: ${keywords}.` : ''} Make it authentic, engaging, and suitable for an About page.`,
  },
  social_bio: {
    label: 'Social Bios',
    description: 'Platform-optimized bios for social media',
    outputLabel: 'Social Bios',
    multiResult: true,
    promptTemplate: ({ brandName, industry, audience, tone, keywords }) =>
      `Write social media bios for "${brandName}", a ${industry} brand targeting ${audience}. Tone: ${tone}.${keywords ? ` Keywords: ${keywords}.` : ''} Provide three versions: (1) Twitter/X (max 160 chars), (2) Instagram (max 150 chars), (3) LinkedIn (max 220 chars). Label each clearly.`,
  },
  email_signature: {
    label: 'Email Signature',
    description: 'Professional email signature with brand voice',
    outputLabel: 'Email Signature',
    multiResult: false,
    promptTemplate: ({ brandName, industry, audience, tone }) =>
      `Create a professional email signature template for "${brandName}", a ${industry} company. The tone should be ${tone} and appeal to ${audience}. Include placeholder fields like [Name], [Title], [Phone], [Website]. Keep it clean and concise.`,
  },
  elevator_pitch: {
    label: 'Elevator Pitch',
    description: '30-second verbal pitch for your brand',
    outputLabel: 'Elevator Pitch',
    multiResult: false,
    promptTemplate: ({ brandName, industry, audience, tone, keywords }) =>
      `Write a 30-second elevator pitch for "${brandName}", a ${industry} brand targeting ${audience}. Tone: ${tone}.${keywords ? ` Highlight: ${keywords}.` : ''} The pitch should be conversational, memorable, and end with a clear value proposition. Around 80-90 words.`,
  },
  brand_values: {
    label: 'Brand Values',
    description: 'Core values and brand principles',
    outputLabel: 'Brand Values',
    multiResult: true,
    promptTemplate: ({ brandName, industry, audience, tone }) =>
      `Define 5 core brand values for "${brandName}", a ${industry} company. Target audience: ${audience}. Brand tone: ${tone}. For each value provide: (1) a one-word or two-word title, (2) a one-sentence description. Format as "VALUE: description", one per line.`,
  },
};

const TONE_OPTIONS = [
  'Professional',
  'Friendly',
  'Bold & Confident',
  'Minimalist',
  'Luxurious',
  'Playful',
  'Authoritative',
  'Warm & Empathetic',
];

/* =========================================================================
   Helpers
   ========================================================================= */

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    ''
  );
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function extractResponse(json: any): string {
  // /api/ai/command returns { success, data: { response, status, ... } }
  if (json?.data?.response) return json.data.response;
  if (json?.data?.text) return json.data.text;
  if (typeof json?.data === 'string') return json.data;
  if (json?.response) return json.response;
  return JSON.stringify(json, null, 2);
}

/* =========================================================================
   Asset Card
   ========================================================================= */

interface AssetCardProps {
  asset: GeneratedAsset;
  onCopy: (text: string) => void;
  onRegenerate: (type: AssetType) => void;
  generating: boolean;
}

function AssetCard({ asset, onCopy, onRegenerate, generating }: AssetCardProps) {
  const config = ASSET_CONFIGS[asset.type];
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(asset.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      onCopy(asset.content);
    });
  }

  const timeStr = new Date(asset.generatedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #dc2626, #f97316)',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            {config.outputLabel}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            Generated at {timeStr}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onRegenerate(asset.type)}
            disabled={generating}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: generating ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)',
              fontSize: 11,
              fontWeight: 500,
              cursor: generating ? 'not-allowed' : 'pointer',
            }}
          >
            Regenerate
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid rgba(249,115,22,0.3)',
              background: copied ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.07)',
              color: copied ? '#f97316' : 'rgba(249,115,22,0.8)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Content */}
      <pre style={{
        margin: 0,
        padding: '14px 16px',
        fontSize: 13,
        lineHeight: 1.65,
        color: 'rgba(255,255,255,0.85)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {asset.content}
      </pre>
    </div>
  );
}

/* =========================================================================
   Asset Type Selector Button
   ========================================================================= */

interface AssetBtnProps {
  type: AssetType;
  selected: boolean;
  onClick: () => void;
}

function AssetBtn({ type, selected, onClick }: AssetBtnProps) {
  const config = ASSET_CONFIGS[type];
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: 9,
        border: selected
          ? '1px solid rgba(220,38,38,0.45)'
          : '1px solid rgba(255,255,255,0.07)',
        background: selected
          ? 'linear-gradient(135deg, rgba(220,38,38,0.12), rgba(249,115,22,0.12))'
          : 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        width: '100%',
      }}
    >
      <div style={{
        fontSize: 12,
        fontWeight: 600,
        color: selected ? '#f97316' : 'rgba(255,255,255,0.8)',
        marginBottom: 2,
      }}>
        {config.label}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
        {config.description}
      </div>
    </button>
  );
}

/* =========================================================================
   Main Panel
   ========================================================================= */

export function BrandEnginePanel() {
  // Brand context inputs
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('Professional');
  const [keywords, setKeywords] = useState('');

  // Asset selection
  const [selectedTypes, setSelectedTypes] = useState<Set<AssetType>>(new Set(['taglines']));

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<AssetType | null>(null);
  const [error, setError] = useState('');

  // Results
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);

  function toggleType(type: AssetType) {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  const generateAsset = useCallback(async (type: AssetType) => {
    if (!brandName.trim()) { setError('Please enter a brand name.'); return; }
    if (!industry.trim()) { setError('Please enter your industry.'); return; }
    if (!audience.trim()) { setError('Please describe your target audience.'); return; }
    setError('');

    const ctx: PromptContext = {
      brandName: brandName.trim(),
      industry: industry.trim(),
      audience: audience.trim(),
      tone,
      keywords: keywords.trim(),
    };

    const config = ASSET_CONFIGS[type];
    const prompt = config.promptTemplate(ctx);

    setGeneratingType(type);

    try {
      const res = await fetch(`${API}/api/ai/command`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          inputText: prompt,
          inputMode: 'text',
          engine: 'core',
          async: false,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Generation failed');

      const content = extractResponse(json);

      setAssets(prev => {
        // Remove any existing asset of the same type, add new one at top
        const filtered = prev.filter(a => a.type !== type);
        return [
          { type, content, generatedAt: new Date().toISOString() },
          ...filtered,
        ];
      });
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setGeneratingType(null);
    }
  }, [brandName, industry, audience, tone, keywords]);

  async function handleGenerateAll() {
    if (!brandName.trim()) { setError('Please enter a brand name.'); return; }
    if (!industry.trim()) { setError('Please enter your industry.'); return; }
    if (!audience.trim()) { setError('Please describe your target audience.'); return; }
    setError('');
    setGenerating(true);

    const types = Array.from(selectedTypes);
    for (const type of types) {
      await generateAsset(type);
    }

    setGenerating(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    padding: '9px 12px',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 6,
  };

  const allTypes = Object.keys(ASSET_CONFIGS) as AssetType[];
  const isGeneratingAny = generating || generatingType !== null;

  return (
    <div style={{
      background: 'rgba(10,10,10,0.97)',
      borderRadius: 16,
      padding: '24px 20px',
      minHeight: 520,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#fff',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Brand Engine
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Generate professional brand copy using AI — taglines, bios, social profiles, and more
        </p>
      </div>

      {/* Two-column layout on wider screens */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 220px',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Left: Form + Results */}
        <div>
          {/* Brand context form */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            padding: '18px 16px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'grid', gap: 14 }}>
              {/* Brand name */}
              <div>
                <label style={labelStyle}>Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="e.g. Memelli"
                  style={inputStyle}
                />
              </div>

              {/* Industry + Audience row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    placeholder="e.g. Real Estate Tech"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Target Audience</label>
                  <input
                    type="text"
                    value={audience}
                    onChange={e => setAudience(e.target.value)}
                    placeholder="e.g. First-time homebuyers"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Tone + Keywords row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Brand Tone</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    style={{ ...inputStyle, appearance: 'none' }}
                  >
                    {TONE_OPTIONS.map(t => (
                      <option key={t} value={t} style={{ background: '#111' }}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Keywords <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={e => setKeywords(e.target.value)}
                    placeholder="e.g. trust, growth, clarity"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: 12,
                padding: '8px 12px',
                background: 'rgba(239,68,68,0.09)',
                border: '1px solid rgba(239,68,68,0.22)',
                borderRadius: 8,
                color: '#f87171',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateAll}
              disabled={isGeneratingAny}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px 0',
                borderRadius: 9,
                border: 'none',
                background: isGeneratingAny
                  ? 'rgba(220,38,38,0.3)'
                  : 'linear-gradient(135deg, #dc2626, #f97316)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: isGeneratingAny ? 'not-allowed' : 'pointer',
                letterSpacing: '0.01em',
                transition: 'opacity 0.15s',
              }}
            >
              {isGeneratingAny
                ? generatingType
                  ? `Generating ${ASSET_CONFIGS[generatingType].label}...`
                  : 'Generating...'
                : `Generate ${selectedTypes.size} Asset${selectedTypes.size !== 1 ? 's' : ''}`}
            </button>
          </div>

          {/* Generated results */}
          {assets.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 2,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Generated Assets
                </span>
                <button
                  onClick={() => setAssets([])}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Clear all
                </button>
              </div>
              {assets.map(asset => (
                <AssetCard
                  key={asset.type}
                  asset={asset}
                  onCopy={() => {}}
                  onRegenerate={type => generateAsset(type)}
                  generating={isGeneratingAny}
                />
              ))}
            </div>
          )}

          {assets.length === 0 && !isGeneratingAny && (
            <div style={{
              textAlign: 'center',
              padding: '40px 0 20px',
              color: 'rgba(255,255,255,0.25)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.5 }}>&#9670;</div>
              <div style={{ fontSize: 13 }}>Fill in your brand details and generate assets</div>
            </div>
          )}
        </div>

        {/* Right: Asset type selector */}
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            Asset Types
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allTypes.map(type => (
              <AssetBtn
                key={type}
                type={type}
                selected={selectedTypes.has(type)}
                onClick={() => toggleType(type)}
              />
            ))}
          </div>
          <div style={{
            marginTop: 12,
            padding: '8px 10px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            lineHeight: 1.5,
          }}>
            Select one or more asset types, then click Generate. You can regenerate individual assets after.
          </div>
        </div>
      </div>
    </div>
  );
}
