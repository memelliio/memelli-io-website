'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Phone,
  Mail,
  CreditCard,
  ShieldCheck,
  Brain,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings2,
  RefreshCw,
} from 'lucide-react';
import { useApi } from '../../../../../hooks/useApi';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Modal,
  Input,
  Skeleton,
} from '@memelli/ui';

/* ---------- Types ---------- */

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: typeof Phone;
  iconColor: string;
  iconBg: string;
  category: string;
  envKeys: { key: string; label: string; placeholder: string }[];
}

interface MeResponse {
  integrations?: Record<string, { connected: boolean; lastChecked?: string }>;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'error';

/* ---------- Integration definitions ---------- */

const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Voice calls, SMS messaging, and phone number management for client communications.',
    icon: Phone,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
    category: 'Communications',
    envKeys: [
      { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
      { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', placeholder: 'Enter your Twilio auth token' },
      { key: 'TWILIO_PHONE_NUMBER', label: 'Phone Number', placeholder: '+1XXXXXXXXXX' },
      { key: 'TWILIO_WEBHOOK_BASE_URL', label: 'Webhook Base URL', placeholder: 'https://api.memelli.io/api/webhooks/twilio' },
    ],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional and marketing email delivery for automated client outreach.',
    icon: Mail,
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/10 border-sky-500/20',
    category: 'Communications',
    envKeys: [
      { key: 'SENDGRID_API_KEY', label: 'API Key', placeholder: 'SG.xxxxxxxxxxxxxxxxxxxx' },
      { key: 'SENDGRID_FROM_EMAIL', label: 'From Email', placeholder: 'noreply@yourdomain.com' },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing, subscriptions, and invoicing for client billing.',
    icon: CreditCard,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
    category: 'Payments',
    envKeys: [
      { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', placeholder: 'sk_live_xxxxxxxxxxxxxxxxxxxx' },
      { key: 'STRIPE_PUBLISHABLE_KEY', label: 'Publishable Key', placeholder: 'pk_live_xxxxxxxxxxxxxxxxxxxx' },
      { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook Secret', placeholder: 'whsec_xxxxxxxxxxxxxxxxxxxx' },
    ],
  },
  {
    id: 'smartcredit',
    name: 'SmartCredit',
    description: 'Credit monitoring, report pulls, and score tracking for client credit repair.',
    icon: ShieldCheck,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    category: 'Credit',
    envKeys: [
      { key: 'SMARTCREDIT_API_KEY', label: 'API Key', placeholder: 'Enter your SmartCredit API key' },
      { key: 'SMARTCREDIT_SECRET', label: 'API Secret', placeholder: 'Enter your SmartCredit secret' },
    ],
  },
  {
    id: 'deepgram',
    name: 'Deepgram',
    description: 'AI-powered speech-to-text (STT) and text-to-speech (TTS) for voice calls and transcription.',
    icon: Phone,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    category: 'Communications',
    envKeys: [
      { key: 'DEEPGRAM_API_KEY', label: 'API Key', placeholder: 'Enter your Deepgram API key' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-powered AI agents for dispute letter generation and client support.',
    icon: Brain,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/20',
    category: 'AI',
    envKeys: [
      { key: 'OPENAI_API_KEY', label: 'API Key', placeholder: 'sk-xxxxxxxxxxxxxxxxxxxx' },
      { key: 'OPENAI_ORG_ID', label: 'Organization ID (optional)', placeholder: 'org-xxxxxxxxxxxxxxxxxxxx' },
    ],
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Website traffic analytics, conversion tracking, and audience insights.',
    icon: BarChart3,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    category: 'Analytics',
    envKeys: [
      { key: 'GA_MEASUREMENT_ID', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' },
      { key: 'GA_API_SECRET', label: 'API Secret', placeholder: 'Enter your GA4 API secret' },
    ],
  },
];

/* ---------- Status helpers ---------- */

const STATUS_MAP: Record<ConnectionStatus, { variant: 'success' | 'error' | 'default'; icon: typeof CheckCircle2; label: string }> = {
  connected: { variant: 'success', icon: CheckCircle2, label: 'Connected' },
  disconnected: { variant: 'default', icon: XCircle, label: 'Not Connected' },
  error: { variant: 'error', icon: AlertCircle, label: 'Error' },
};

/* ---------- Page component ---------- */

export default function IntegrationsSettingsPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [configIntegration, setConfigIntegration] = useState<IntegrationConfig | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  /* Fetch current user config to check which integrations are connected */
  const { data: meData, isLoading } = useQuery<MeResponse>({
    queryKey: ['me-integrations'],
    queryFn: async () => {
      const res = await api.get<MeResponse>('/api/me');
      if (res.error || !res.data) {
        // Return empty integrations map if API unavailable
        return { integrations: {} };
      }
      return res.data;
    },
  });

  const integrationStatuses = meData?.integrations ?? {};

  function getStatus(id: string): ConnectionStatus {
    const entry = integrationStatuses[id];
    if (!entry) return 'disconnected';
    return entry.connected ? 'connected' : 'error';
  }

  /* Save configuration mutation */
  const saveMutation = useMutation({
    mutationFn: async ({ id, config }: { id: string; config: Record<string, string> }) => {
      const res = await api.patch(`/api/admin/providers/${id}`, { config, status: 'active' });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success(`${INTEGRATIONS.find((i) => i.id === vars.id)?.name ?? 'Integration'} configured successfully`);
      setConfigIntegration(null);
      setConfigValues({});
      queryClient.invalidateQueries({ queryKey: ['me-integrations'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save configuration'),
  });

  /* Health-check mutation */
  const healthMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.get(`/api/admin/providers/${id}/health`);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_, id) => {
      toast.success(`${INTEGRATIONS.find((i) => i.id === id)?.name ?? 'Integration'} health check passed`);
      queryClient.invalidateQueries({ queryKey: ['me-integrations'] });
    },
    onError: (err: Error, id) => {
      toast.error(`Health check failed for ${INTEGRATIONS.find((i) => i.id === id)?.name ?? id}: ${err.message}`);
    },
  });

  /* Open configure modal */
  function openConfig(integration: IntegrationConfig) {
    setConfigIntegration(integration);
    const vals: Record<string, string> = {};
    integration.envKeys.forEach((k) => {
      vals[k.key] = '';
    });
    setConfigValues(vals);
  }

  /* Group integrations by category */
  const grouped = INTEGRATIONS.reduce<Record<string, IntegrationConfig[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  /* ---------- Loading state ---------- */

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-5 w-80 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ---------- Render ---------- */

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader
        title="Integrations"
        subtitle="Connect Memelli OS with your tools and services to automate workflows."
        breadcrumb={[
          { label: 'Settings', href: '/dashboard/settings' },
          { label: 'Integrations' },
        ]}
      />

      <div className="max-w-3xl mt-8 space-y-8">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">
              {category}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((integration) => {
                const status = getStatus(integration.id);
                const statusCfg = STATUS_MAP[status];
                const StatusIcon = statusCfg.icon;
                const Icon = integration.icon;
                const isConnected = status === 'connected';
                const lastChecked = integrationStatuses[integration.id]?.lastChecked;

                return (
                  <div key={integration.id} className="rounded-2xl border border-white/[0.04] bg-card backdrop-blur-xl hover:border-white/[0.08] transition-all duration-200 shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
                    <div className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${integration.iconBg}`}
                          >
                            <Icon className={`h-5 w-5 ${integration.iconColor}`} />
                          </div>
                          <span className="text-sm font-medium text-white/85">{integration.name}</span>
                        </div>
                        <Badge variant={statusCfg.variant} className="text-[10px] shrink-0">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusCfg.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      <p className="text-xs text-white/30 leading-relaxed mb-4">
                        {integration.description}
                      </p>

                      {lastChecked && (
                        <p className="text-[10px] text-white/20 mb-3">
                          Last checked: {new Date(lastChecked).toLocaleString()}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={isConnected ? 'secondary' : 'primary'}
                          onClick={() => openConfig(integration)}
                          leftIcon={<Settings2 className="h-3 w-3" />}
                          className="flex-1"
                        >
                          {isConnected ? 'Configure' : 'Connect'}
                        </Button>

                        {isConnected && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => healthMutation.mutate(integration.id)}
                            title="Run health check"
                          >
                            <RefreshCw
                              className={`h-3.5 w-3.5 ${healthMutation.isPending ? 'animate-spin' : ''}`}
                            />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Request integration CTA */}
        <div className="bg-card border border-white/[0.04] rounded-2xl p-5 text-center backdrop-blur-xl">
          <p className="text-sm text-white/30">
            Need an integration not listed here?{' '}
            <a
              href="mailto:support@memelli.com"
              className="text-primary hover:text-primary/80 transition-colors duration-200"
            >
              Request it
            </a>
          </p>
        </div>
      </div>

      {/* Configure / Connect Modal */}
      <Modal
        isOpen={!!configIntegration}
        onClose={() => {
          setConfigIntegration(null);
          setConfigValues({});
        }}
        title={configIntegration ? `Connect ${configIntegration.name}` : ''}
      >
        {configIntegration && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Validate that at least one key is filled
              const hasValue = Object.values(configValues).some((v) => v.trim() !== '');
              if (!hasValue) {
                toast.error('Please fill in at least one field');
                return;
              }
              saveMutation.mutate({ id: configIntegration.id, config: configValues });
            }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`h-9 w-9 rounded-xl border flex items-center justify-center ${configIntegration.iconBg}`}
              >
                <configIntegration.icon className={`h-4 w-4 ${configIntegration.iconColor}`} />
              </div>
              <p className="text-xs text-white/40 leading-relaxed flex-1">
                {configIntegration.description}
              </p>
            </div>

            <div className="border-t border-white/[0.04] pt-4 space-y-3">
              {configIntegration.envKeys.map((envKey) => (
                <Input
                  key={envKey.key}
                  label={envKey.label}
                  type="password"
                  value={configValues[envKey.key] ?? ''}
                  onChange={(e) =>
                    setConfigValues((prev) => ({ ...prev, [envKey.key]: e.target.value }))
                  }
                  placeholder={envKey.placeholder}
                  hint={envKey.key}
                />
              ))}
            </div>

            <div className="flex gap-2 pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setConfigIntegration(null);
                  setConfigValues({});
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={saveMutation.isPending} className="flex-1">
                Save & Connect
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
