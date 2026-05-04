'use client';

import { useState } from 'react';
import { Save, Palette, Award, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';

interface CoachingSettings {
  defaultTemplate: string;
  autoIssueCertificate: boolean;
  completionThreshold: number;
  certificateDesign: string;
  enableAICoach: boolean;
  aiCoachModel: string;
  requireQuizPass: boolean;
  quizPassMark: number;
}

const CERTIFICATE_DESIGNS = [
  { id: 'classic', name: 'Classic', description: 'Traditional certificate with gold border' },
  { id: 'modern', name: 'Modern', description: 'Clean, minimal design' },
  { id: 'branded', name: 'Branded', description: 'Uses your company branding' },
];

export default function CoachingSettingsPage() {
  const [settings, setSettings] = useState<CoachingSettings>({
    defaultTemplate: 'credit-repair',
    autoIssueCertificate: true,
    completionThreshold: 100,
    certificateDesign: 'modern',
    enableAICoach: true,
    aiCoachModel: 'claude-sonnet-4-6',
    requireQuizPass: true,
    quizPassMark: 70,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: keyof CoachingSettings, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Coaching Settings</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">Configure defaults and rules for your coaching engine</p>
        </div>
        <Button onClick={handleSave} size="sm" className="bg-primary hover:bg-primary rounded-xl">
          {saved ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" /> Save Settings
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Default Template</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">New programs will use this template by default.</p>
        <select
          value={settings.defaultTemplate}
          onChange={(e) => update('defaultTemplate', e.target.value)}
          className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/60 backdrop-blur-xl focus:border-primary/50 focus:outline-none"
        >
          <option value="credit-repair">Credit Repair</option>
          <option value="funding">Funding Readiness</option>
          <option value="business">Business Building</option>
          <option value="">None (blank)</option>
        </select>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Completion Rules</h3>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
            Completion Threshold (%)
          </label>
          <p className="mb-2 text-xs text-muted-foreground leading-relaxed">
            What percentage of lessons must be completed to finish a program?
          </p>
          <input
            type="number"
            min={50}
            max={100}
            value={settings.completionThreshold}
            onChange={(e) => update('completionThreshold', parseInt(e.target.value) || 100)}
            className="w-32 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl focus:border-primary/50 focus:outline-none"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={settings.requireQuizPass}
            onChange={(e) => update('requireQuizPass', e.target.checked)}
            className="rounded border-white/20 bg-white/[0.03] text-primary focus:ring-purple-500"
          />
          <div>
            <span className="text-sm text-muted-foreground">Require quiz passing</span>
            <p className="text-xs text-muted-foreground leading-relaxed">Students must pass all quizzes to complete a program</p>
          </div>
        </label>

        {settings.requireQuizPass && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Default Quiz Pass Mark (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.quizPassMark}
              onChange={(e) => update('quizPassMark', parseInt(e.target.value) || 70)}
              className="w-32 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-foreground backdrop-blur-xl focus:border-primary/50 focus:outline-none"
            />
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
          <Award className="h-5 w-5 text-primary" />
          Certificate Settings
        </h3>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoIssueCertificate}
            onChange={(e) => update('autoIssueCertificate', e.target.checked)}
            className="rounded border-white/20 bg-white/[0.03] text-primary focus:ring-purple-500"
          />
          <div>
            <span className="text-sm text-muted-foreground">Auto-issue certificates</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automatically issue certificates when students complete a program
            </p>
          </div>
        </label>

        <div>
          <label className="mb-2 block text-sm font-medium text-muted-foreground">Certificate Design</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CERTIFICATE_DESIGNS.map((design) => (
              <button
                key={design.id}
                type="button"
                onClick={() => update('certificateDesign', design.id)}
                className={`rounded-2xl border p-3 text-left transition-all duration-200 ${
                  settings.certificateDesign === design.id
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <Palette
                  className={`h-4 w-4 ${
                    settings.certificateDesign === design.id ? 'text-primary' : 'text-white/30'
                  }`}
                />
                <p className="mt-1 text-sm font-semibold tracking-tight text-foreground">{design.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{design.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/[0.04] bg-card p-5 backdrop-blur-xl transition-all duration-200">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">AI Coach Settings</h3>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={settings.enableAICoach}
            onChange={(e) => update('enableAICoach', e.target.checked)}
            className="rounded border-white/20 bg-white/[0.03] text-primary focus:ring-purple-500"
          />
          <div>
            <span className="text-sm text-muted-foreground">Enable AI coaching</span>
            <p className="text-xs text-muted-foreground leading-relaxed">Students can chat with an AI coach for each lesson</p>
          </div>
        </label>

        {settings.enableAICoach && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">AI Model</label>
            <select
              value={settings.aiCoachModel}
              onChange={(e) => update('aiCoachModel', e.target.value)}
              className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/60 backdrop-blur-xl focus:border-primary/50 focus:outline-none"
            >
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (Recommended)</option>
              <option value="claude-haiku-35">Claude Haiku 3.5 (Faster)</option>
              <option value="claude-opus-4">Claude Opus 4 (Advanced)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
