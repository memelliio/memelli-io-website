'use client';

import { useState, useMemo } from 'react';
import {
  Palette,
  MessageCircle,
  Image,
  Monitor,
  Smartphone,
  Copy,
  Check,
  Send,
  X,
  MessageSquare,
  Clock,
  Upload,
  Eye,
  Code,
  MapPin,
  WifiOff,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface WidgetCustomization {
  primaryColor: string;
  headerColor: string;
  bubbleColor: string;
  textColor: string;
  greetingMessage: string;
  offlineMessage: string;
  avatarUrl: string;
  position: 'bottom-right' | 'bottom-left';
  autoOpenDelay: number;
  borderRadius: number;
  companyName: string;
  tagline: string;
}

type PreviewMode = 'desktop' | 'mobile';
type PanelTab = 'appearance' | 'messages' | 'behavior' | 'embed';

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const DEFAULT_CONFIG: WidgetCustomization = {
  primaryColor: '#dc2626',
  headerColor: '#18181b',
  bubbleColor: '#dc2626',
  textColor: '#ffffff',
  greetingMessage: 'Hi there! How can we help you today?',
  offlineMessage: 'We are currently offline. Leave your email and message, and we will get back to you shortly.',
  avatarUrl: '',
  position: 'bottom-right',
  autoOpenDelay: 3,
  borderRadius: 16,
  companyName: 'Memelli',
  tagline: 'We typically reply within minutes',
};

// ─────────────────────────────────────────────
// Color Presets
// ─────────────────────────────────────────────

const COLOR_PRESETS = [
  { name: 'Red', value: '#dc2626' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Slate', value: '#475569' },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function ChatWidgetCustomizerPage() {
  const [config, setConfig] = useState<WidgetCustomization>(DEFAULT_CONFIG);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [activeTab, setActiveTab] = useState<PanelTab>('appearance');
  const [previewOpen, setPreviewOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  function updateConfig<K extends keyof WidgetCustomization>(key: K, value: WidgetCustomization[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  // ─── Embed code generation ───
  const embedCode = useMemo(() => {
    return `<!-- Memelli Chat Widget -->
<script>
  (function(w,d,s){
    w.MemelliChat = w.MemelliChat || {};
    w.MemelliChat.config = ${JSON.stringify(
      {
        primaryColor: config.primaryColor,
        headerColor: config.headerColor,
        bubbleColor: config.bubbleColor,
        textColor: config.textColor,
        greeting: config.greetingMessage,
        offlineMessage: config.offlineMessage,
        avatar: config.avatarUrl,
        position: config.position,
        autoOpenDelay: config.autoOpenDelay,
        borderRadius: config.borderRadius,
        company: config.companyName,
        tagline: config.tagline,
      },
      null,
      2
    )};
    var e=d.createElement(s);
    e.async=true;
    e.src='https://cdn.memelli.com/chat-widget.js';
    d.head.appendChild(e);
  })(window,document,'script');
</script>`;
  }, [config]);

  function handleCopyEmbed() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Tab config ───
  const tabs: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageCircle className="h-4 w-4" /> },
    { id: 'behavior', label: 'Behavior', icon: <Clock className="h-4 w-4" /> },
    { id: 'embed', label: 'Embed Code', icon: <Code className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">Widget Customizer</h1>
          <p className="text-sm text-white/40 mt-1">Design and configure your embeddable chat widget</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                previewMode === 'desktop'
                  ? 'bg-red-500/20 text-red-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" /> Desktop
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                previewMode === 'mobile'
                  ? 'bg-red-500/20 text-red-400'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Panel + Right Preview */}
      <div className="flex gap-6">
        {/* ── Left Panel: Controls ── */}
        <div className="w-[420px] shrink-0 space-y-4">
          {/* Tab Navigation */}
          <div className="flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 gap-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-red-500/15 text-red-400 shadow-sm'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                }`}
              >
                {tab.icon}
                <span className="hidden xl:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── Appearance Tab ── */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Color Presets */}
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-white/90 tracking-tight flex items-center gap-2">
                  <Palette className="h-4 w-4 text-red-400" /> Quick Presets
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        updateConfig('primaryColor', preset.value);
                        updateConfig('bubbleColor', preset.value);
                      }}
                      className={`h-8 w-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        config.primaryColor === preset.value
                          ? 'border-white/60 ring-2 ring-white/20'
                          : 'border-white/[0.06]'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-white/90 tracking-tight">Custom Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Primary', key: 'primaryColor' as const },
                    { label: 'Header', key: 'headerColor' as const },
                    { label: 'Chat Bubble', key: 'bubbleColor' as const },
                    { label: 'Text', key: 'textColor' as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-white/40 mb-1.5">{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config[key]}
                          onChange={(e) => updateConfig(key, e.target.value)}
                          className="h-9 w-12 rounded-lg border border-white/[0.06] bg-white/[0.03] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config[key]}
                          onChange={(e) => updateConfig(key, e.target.value)}
                          className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-white/90 tracking-tight flex items-center gap-2">
                  <Image className="h-4 w-4 text-red-400" /> Avatar
                </h3>
                <div className="flex items-center gap-4">
                  <div
                    className="h-14 w-14 rounded-full border-2 border-dashed border-white/[0.1] flex items-center justify-center overflow-hidden bg-white/[0.03]"
                  >
                    {config.avatarUrl ? (
                      <img src={config.avatarUrl} alt="Avatar" className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <Upload className="h-5 w-5 text-white/20" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={config.avatarUrl}
                      onChange={(e) => updateConfig('avatarUrl', e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
                    />
                    <p className="text-[10px] text-white/20">Paste an image URL or upload</p>
                  </div>
                </div>
              </div>

              {/* Identity */}
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-white/90 tracking-tight">Identity</h3>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={config.companyName}
                    onChange={(e) => updateConfig('companyName', e.target.value)}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Tagline</label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => updateConfig('tagline', e.target.value)}
                    placeholder="We typically reply within minutes"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Border Radius</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={config.borderRadius}
                      onChange={(e) => updateConfig('borderRadius', parseInt(e.target.value))}
                      className="flex-1 accent-red-500"
                    />
                    <span className="text-xs text-white/40 font-mono w-8 text-right">{config.borderRadius}px</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Messages Tab ── */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-white/90 tracking-tight flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-red-400" /> Greeting Message
                </h3>
                <textarea
                  value={config.greetingMessage}
                  onChange={(e) => updateConfig('greetingMessage', e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none transition-all duration-200"
                />
                <p className="text-[10px] text-white/20">Shown when a visitor first opens the chat widget</p>
              </div>

              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-white/90 tracking-tight flex items-center gap-2">
                  <WifiOff className="h-4 w-4 text-red-400" /> Offline Message
                </h3>
                <textarea
                  value={config.offlineMessage}
                  onChange={(e) => updateConfig('offlineMessage', e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none transition-all duration-200"
                />
                <p className="text-[10px] text-white/20">Shown when no agents are available online</p>
              </div>
            </div>
          )}

          {/* ── Behavior Tab ── */}
          {activeTab === 'behavior' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-white/90 tracking-tight flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-400" /> Widget Position
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'bottom-right' as const, label: 'Bottom Right' },
                    { value: 'bottom-left' as const, label: 'Bottom Left' },
                  ].map((pos) => (
                    <button
                      key={pos.value}
                      onClick={() => updateConfig('position', pos.value)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        config.position === pos.value
                          ? 'border-red-500/40 bg-red-500/10 text-red-400'
                          : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="h-6 w-10 rounded border border-current/30 relative">
                        <div
                          className={`absolute h-2 w-2 rounded-sm bg-current ${
                            pos.value === 'bottom-right' ? 'bottom-0.5 right-0.5' : 'bottom-0.5 left-0.5'
                          }`}
                        />
                      </div>
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-white/90 tracking-tight flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-400" /> Auto-Open Delay
                </h3>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={config.autoOpenDelay}
                    onChange={(e) => updateConfig('autoOpenDelay', parseInt(e.target.value))}
                    className="flex-1 accent-red-500"
                  />
                  <span className="text-sm text-white/60 font-mono w-12 text-right">
                    {config.autoOpenDelay === 0 ? 'Off' : `${config.autoOpenDelay}s`}
                  </span>
                </div>
                <p className="text-[10px] text-white/20">
                  {config.autoOpenDelay === 0
                    ? 'Widget will not auto-open. Visitors must click to open.'
                    : `Widget will automatically open ${config.autoOpenDelay} seconds after page load.`}
                </p>
              </div>
            </div>
          )}

          {/* ── Embed Code Tab ── */}
          {activeTab === 'embed' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white/90 tracking-tight flex items-center gap-2">
                    <Code className="h-4 w-4 text-red-400" /> Embed Code
                  </h3>
                  <button
                    onClick={handleCopyEmbed}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      copied
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="rounded-xl border border-white/[0.06] bg-background p-4 text-xs text-white/60 font-mono overflow-x-auto whitespace-pre leading-relaxed max-h-[400px] overflow-y-auto">
                  {embedCode}
                </pre>
                <p className="text-[10px] text-white/20">
                  Paste this code before the closing &lt;/body&gt; tag on every page where you want the chat widget to appear.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: Live Preview ── */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-xl sticky top-6">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
              <h3 className="text-sm font-medium text-white/90 flex items-center gap-2 tracking-tight">
                <Eye className="h-4 w-4 text-red-400" /> Live Preview
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">
                  {previewMode === 'desktop' ? '1440 x 900' : '375 x 812'}
                </span>
              </div>
            </div>

            {/* Preview Area */}
            <div className="p-6 flex items-center justify-center">
              <div
                className={`relative bg-background rounded-xl overflow-hidden border border-white/[0.06] transition-all duration-300 ${
                  previewMode === 'desktop' ? 'w-full h-[560px]' : 'w-[375px] h-[680px] rounded-3xl'
                }`}
              >
                {/* Fake browser chrome */}
                <div className="h-8 bg-white/[0.04] flex items-center px-3 gap-1.5 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-red-500/60" />
                  <div className="h-2 w-2 rounded-full bg-amber-500/60" />
                  <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
                  <div className="flex-1 mx-8">
                    <div className="h-3.5 bg-white/[0.04] rounded-full max-w-[240px] mx-auto flex items-center px-2">
                      <span className="text-[8px] text-white/20 truncate">https://yourwebsite.com</span>
                    </div>
                  </div>
                </div>

                {/* Fake page content */}
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-white/[0.03] rounded w-1/3" />
                  <div className="h-3 bg-white/[0.02] rounded w-3/4" />
                  <div className="h-3 bg-white/[0.02] rounded w-1/2" />
                  <div className="h-3 bg-white/[0.02] rounded w-2/3" />
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="h-20 bg-white/[0.02] rounded-lg" />
                    <div className="h-20 bg-white/[0.02] rounded-lg" />
                    <div className="h-20 bg-white/[0.02] rounded-lg" />
                  </div>
                  <div className="h-3 bg-white/[0.02] rounded w-2/3 mt-4" />
                  <div className="h-3 bg-white/[0.02] rounded w-1/2" />
                </div>

                {/* Chat Widget Preview */}
                <div
                  className={`absolute bottom-4 z-10 ${
                    config.position === 'bottom-right' ? 'right-4' : 'left-4'
                  }`}
                >
                  {previewOpen ? (
                    <div
                      className="shadow-2xl border border-white/[0.08] overflow-hidden transition-all duration-300"
                      style={{
                        borderRadius: `${config.borderRadius}px`,
                        width: previewMode === 'desktop' ? '320px' : '280px',
                      }}
                    >
                      {/* Widget Header */}
                      <div
                        className="px-4 py-3 flex items-center justify-between"
                        style={{ backgroundColor: config.headerColor }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-9 w-9 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/10"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            {config.avatarUrl ? (
                              <img src={config.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <MessageSquare className="h-4 w-4" style={{ color: config.textColor }} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: config.textColor }}>
                              {config.companyName}
                            </p>
                            <p className="text-[10px] opacity-60" style={{ color: config.textColor }}>
                              {config.tagline}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => setPreviewOpen(false)} className="opacity-60 hover:opacity-100 transition-opacity">
                          <X className="h-4 w-4" style={{ color: config.textColor }} />
                        </button>
                      </div>

                      {/* Messages Area */}
                      <div className="bg-card p-4 space-y-3" style={{ minHeight: previewMode === 'desktop' ? '240px' : '200px' }}>
                        {/* Bot message */}
                        <div className="flex gap-2 items-end">
                          <div
                            className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            {config.avatarUrl ? (
                              <img src={config.avatarUrl} alt="" className="h-full w-full object-cover rounded-full" />
                            ) : (
                              <MessageSquare className="h-3 w-3" style={{ color: config.textColor }} />
                            )}
                          </div>
                          <div
                            className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs max-w-[80%] leading-relaxed"
                            style={{ backgroundColor: config.bubbleColor + '18', color: '#e4e4e7' }}
                          >
                            {config.greetingMessage}
                          </div>
                        </div>

                        {/* Visitor message */}
                        <div className="flex justify-end">
                          <div
                            className="rounded-2xl rounded-br-sm px-3.5 py-2.5 text-xs max-w-[80%] leading-relaxed"
                            style={{ backgroundColor: config.primaryColor, color: config.textColor }}
                          >
                            Hi, I have a question about pricing.
                          </div>
                        </div>

                        {/* Bot reply */}
                        <div className="flex gap-2 items-end">
                          <div
                            className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            {config.avatarUrl ? (
                              <img src={config.avatarUrl} alt="" className="h-full w-full object-cover rounded-full" />
                            ) : (
                              <MessageSquare className="h-3 w-3" style={{ color: config.textColor }} />
                            )}
                          </div>
                          <div
                            className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs max-w-[80%] leading-relaxed"
                            style={{ backgroundColor: config.bubbleColor + '18', color: '#e4e4e7' }}
                          >
                            Of course! I would be happy to help. What plan are you interested in?
                          </div>
                        </div>
                      </div>

                      {/* Input Area */}
                      <div className="bg-card border-t border-white/[0.06] p-3 flex items-center gap-2">
                        <div className="flex-1 rounded-xl bg-white/[0.04] px-3 py-2.5">
                          <span className="text-xs text-white/20">Type a message...</span>
                        </div>
                        <button
                          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          <Send className="h-4 w-4" style={{ color: config.textColor }} />
                        </button>
                      </div>

                      {/* Powered by */}
                      <div className="bg-card border-t border-white/[0.04] py-1.5 text-center">
                        <span className="text-[9px] text-white/15">Powered by Memelli</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPreviewOpen(true)}
                      className="h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-transform duration-200 hover:scale-105"
                      style={{ backgroundColor: config.bubbleColor }}
                    >
                      <MessageSquare className="h-6 w-6" style={{ color: config.textColor }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
