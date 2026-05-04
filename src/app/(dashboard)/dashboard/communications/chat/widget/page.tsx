'use client';

import { useState, useCallback } from 'react';
import {
  Palette, MessageCircle, Image, ToggleLeft, ToggleRight,
  Save, Eye, RefreshCw, MessageSquare, X, Send,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabList, Tab, TabPanel } from '@memelli/ui';

interface WidgetConfig {
  enabled: boolean;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  bgColor: string;
  logoUrl: string;
  companyName: string;
  greetingMessage: string;
  offlineMessage: string;
  autoResponses: AutoResponse[];
  position: 'bottom-right' | 'bottom-left';
  borderRadius: number;
}

interface AutoResponse {
  id: string;
  trigger: string;
  response: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: WidgetConfig = {
  enabled: true,
  primaryColor: '#7c3aed',
  accentColor: '#3b82f6',
  textColor: '#ffffff',
  bgColor: '#18181b',
  logoUrl: '',
  companyName: 'Memelli',
  greetingMessage: 'Hi there! How can we help you today?',
  offlineMessage: 'We\'re currently offline. Leave a message and we\'ll get back to you soon.',
  autoResponses: [
    { id: '1', trigger: 'hours', response: 'Our support hours are Monday-Friday, 9 AM - 6 PM EST.', enabled: true },
    { id: '2', trigger: 'pricing', response: 'You can find our pricing at memelli.com/pricing. Would you like me to connect you with sales?', enabled: true },
    { id: '3', trigger: 'refund', response: 'I\'ll connect you with our billing team to help with your refund request.', enabled: false },
  ],
  position: 'bottom-right',
  borderRadius: 16,
};

export default function ChatWidgetConfigPage() {
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);

  function updateConfig<K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function updateAutoResponse(id: string, field: keyof AutoResponse, value: string | boolean) {
    setConfig((prev) => ({
      ...prev,
      autoResponses: prev.autoResponses.map((ar) =>
        ar.id === id ? { ...ar, [field]: value } : ar
      ),
    }));
  }

  function addAutoResponse() {
    const newAr: AutoResponse = {
      id: `ar-${Date.now()}`,
      trigger: '',
      response: '',
      enabled: true,
    };
    setConfig((prev) => ({ ...prev, autoResponses: [...prev.autoResponses, newAr] }));
  }

  function removeAutoResponse(id: string) {
    setConfig((prev) => ({
      ...prev,
      autoResponses: prev.autoResponses.filter((ar) => ar.id !== id),
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    // API call would go here
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Chat Widget</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">Configure the live chat widget for your website</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Widget</span>
            <button
              onClick={() => updateConfig('enabled', !config.enabled)}
              className="transition-all duration-200"
            >
              {config.enabled ? (
                <ToggleRight className="h-7 w-7 text-primary" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-white/20" />
              )}
            </button>
            <Badge variant={config.enabled ? 'success' : 'muted'}>
              {config.enabled ? 'Live' : 'Disabled'}
            </Badge>
          </div>
          <Button onClick={handleSave} isLoading={isSaving}>
            <Save className="h-4 w-4 mr-1" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Config Panel */}
        <div className="flex-1 min-w-0">
          <Tabs defaultTab="branding" className="space-y-4">
            <TabList>
              <Tab id="branding"><Palette className="h-4 w-4" /> Branding</Tab>
              <Tab id="messages"><MessageCircle className="h-4 w-4" /> Messages</Tab>
              <Tab id="auto"><RefreshCw className="h-4 w-4" /> Auto-Responses ({config.autoResponses.filter((a) => a.enabled).length})</Tab>
            </TabList>

            {/* Branding Tab */}
            <TabPanel id="branding" className="space-y-4">
              <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Primary Color', key: 'primaryColor' as const },
                      { label: 'Accent Color', key: 'accentColor' as const },
                      { label: 'Text Color', key: 'textColor' as const },
                      { label: 'Background', key: 'bgColor' as const },
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
                            className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Company Name</label>
                    <input
                      type="text"
                      value={config.companyName}
                      onChange={(e) => updateConfig('companyName', e.target.value)}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Logo URL</label>
                    <input
                      type="text"
                      value={config.logoUrl}
                      onChange={(e) => updateConfig('logoUrl', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white/40 mb-1.5">Position</label>
                      <select
                        value={config.position}
                        onChange={(e) => updateConfig('position', e.target.value as WidgetConfig['position'])}
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/40 mb-1.5">Border Radius</label>
                      <input
                        type="range"
                        min={0}
                        max={24}
                        value={config.borderRadius}
                        onChange={(e) => updateConfig('borderRadius', parseInt(e.target.value))}
                        className="w-full accent-purple-500 mt-2"
                      />
                      <span className="text-xs text-white/30">{config.borderRadius}px</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            {/* Messages Tab */}
            <TabPanel id="messages" className="space-y-4">
              <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Welcome Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Greeting Message</label>
                    <textarea
                      value={config.greetingMessage}
                      onChange={(e) => updateConfig('greetingMessage', e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all duration-200"
                    />
                    <p className="text-[10px] text-white/20 mt-1">Shown when a visitor opens the chat widget</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Offline Message</label>
                    <textarea
                      value={config.offlineMessage}
                      onChange={(e) => updateConfig('offlineMessage', e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all duration-200"
                    />
                    <p className="text-[10px] text-white/20 mt-1">Shown when no agents are available</p>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            {/* Auto-Responses Tab */}
            <TabPanel id="auto" className="space-y-4">
              <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold tracking-tight text-foreground">Auto-Response Rules</CardTitle>
                  <Button size="sm" variant="secondary" onClick={addAutoResponse}>
                    + Add Rule
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config.autoResponses.map((ar) => (
                    <div
                      key={ar.id}
                      className={`rounded-xl border p-4 space-y-3 transition-all duration-200 ${
                        ar.enabled ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.03] bg-white/[0.01] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateAutoResponse(ar.id, 'enabled', !ar.enabled)}>
                            {ar.enabled ? (
                              <ToggleRight className="h-5 w-5 text-primary" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-white/20" />
                            )}
                          </button>
                          <Badge variant={ar.enabled ? 'success' : 'muted'}>
                            {ar.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        <button
                          onClick={() => removeAutoResponse(ar.id)}
                          className="text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/40 mb-1">Trigger keyword</label>
                        <input
                          type="text"
                          value={ar.trigger}
                          onChange={(e) => updateAutoResponse(ar.id, 'trigger', e.target.value)}
                          placeholder="e.g. pricing, hours, help"
                          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/40 mb-1">Response</label>
                        <textarea
                          value={ar.response}
                          onChange={(e) => updateAutoResponse(ar.id, 'response', e.target.value)}
                          rows={2}
                          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all duration-200"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabPanel>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="w-96 shrink-0">
          <Card className="bg-card backdrop-blur-xl border border-white/[0.04] rounded-2xl sticky top-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Widget Preview
              </CardTitle>
              <button
                onClick={() => setPreviewOpen(!previewOpen)}
                className="text-xs text-muted-foreground hover:bg-white/[0.04] transition-all duration-200"
              >
                {previewOpen ? 'Minimize' : 'Expand'}
              </button>
            </CardHeader>
            <CardContent>
              <div className="relative bg-background rounded-xl p-6 min-h-[400px] flex items-end" style={{ justifyContent: config.position === 'bottom-right' ? 'flex-end' : 'flex-start' }}>
                {/* Simulated website background */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div className="h-8 bg-white/[0.04] flex items-center px-3 gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary/80/60" />
                    <div className="h-2 w-2 rounded-full bg-amber-500/60" />
                    <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
                    <div className="flex-1 mx-8">
                      <div className="h-3 bg-white/[0.04] rounded-full max-w-[200px] mx-auto" />
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-white/[0.03] rounded w-3/4" />
                    <div className="h-3 bg-white/[0.03] rounded w-1/2" />
                    <div className="h-3 bg-white/[0.03] rounded w-2/3" />
                  </div>
                </div>

                {/* Widget */}
                {previewOpen ? (
                  <div
                    className="relative w-72 shadow-2xl border border-white/[0.06] overflow-hidden z-10"
                    style={{
                      borderRadius: `${config.borderRadius}px`,
                      backgroundColor: config.bgColor,
                    }}
                  >
                    {/* Widget header */}
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      <div className="flex items-center gap-2">
                        {config.logoUrl ? (
                          <img src={config.logoUrl} alt="" className="h-6 w-6 rounded-full" />
                        ) : (
                          <MessageSquare className="h-5 w-5" style={{ color: config.textColor }} />
                        )}
                        <span className="text-sm font-semibold" style={{ color: config.textColor }}>
                          {config.companyName}
                        </span>
                      </div>
                      <button onClick={() => setPreviewOpen(false)}>
                        <X className="h-4 w-4" style={{ color: config.textColor, opacity: 0.7 }} />
                      </button>
                    </div>

                    {/* Messages area */}
                    <div className="p-4 space-y-3 min-h-[200px]">
                      <div className="flex gap-2">
                        <div className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: config.primaryColor }}>
                          <MessageSquare className="h-3 w-3" style={{ color: config.textColor }} />
                        </div>
                        <div
                          className="rounded-xl rounded-tl-sm px-3 py-2 text-xs max-w-[80%]"
                          style={{ backgroundColor: config.accentColor + '20', color: '#e4e4e7' }}
                        >
                          {config.greetingMessage}
                        </div>
                      </div>
                    </div>

                    {/* Input area */}
                    <div className="border-t border-white/[0.06] p-3 flex items-center gap-2">
                      <div className="flex-1 rounded-xl bg-white/[0.04] px-3 py-2">
                        <span className="text-xs text-white/20">Type a message...</span>
                      </div>
                      <div
                        className="h-8 w-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        <Send className="h-3.5 w-3.5" style={{ color: config.textColor }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    className="relative h-14 w-14 rounded-full shadow-xl flex items-center justify-center z-10"
                    style={{ backgroundColor: config.primaryColor }}
                    onClick={() => setPreviewOpen(true)}
                  >
                    <MessageSquare className="h-6 w-6" style={{ color: config.textColor }} />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
