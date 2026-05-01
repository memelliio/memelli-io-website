'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Globe, Phone, Mic, Radio, Zap } from 'lucide-react';

interface ChatTraceData {
  activeSessions: number;
  totalMessages: number;
  lastMessagePreview: string;
  lastMessageSource: 'web' | 'sms' | 'voice' | 'api' | null;
  sourceBreakdown: { web: number; sms: number; voice: number; api: number };
  avgResponseTimeMs: number;
  topTopics: string[];
  lastUpdated: string;
  bridge: {
    running: boolean;
    totalTraced: number;
    totalMerged: number;
    responseTimeSamples: number;
  };
}

const SOURCE_ICONS: Record<string, typeof Globe> = {
  web: Globe,
  sms: Phone,
  voice: Mic,
  api: Radio,
};

const SOURCE_COLORS: Record<string, string> = {
  web: '#3b82f6',
  sms: '#10b981',
  voice: '#f59e0b',
  api: '#10b981',
};

export function ChatTraceWidget() {
  const [data, setData] = useState<ChatTraceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/chat-trace/live`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
        setLive(true);
      }
    } catch (err: any) {
      setError(err.message);
      setLive(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div
      style={{
        background: '#0f0f0f',
        border: '1px solid #1e1e1e',
        borderRadius: 12,
        padding: 16,
        minWidth: 280,
        maxWidth: 340,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#e0e0e0',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <MessageSquare size={16} color="#3b82f6" />
        <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', color: '#ffffff' }}>
          CHAT TRACE
        </span>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: live ? '#10b981' : '#ef4444',
            boxShadow: live ? '0 0 6px #10b981' : '0 0 6px #ef4444',
            marginLeft: 'auto',
          }}
        />
      </div>

      {error && !data && (
        <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>
          Offline: {error}
        </div>
      )}

      {data && (
        <>
          {/* Active Sessions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Active Sessions</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6' }}>
                {data.activeSessions}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Avg Response</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>
                {formatMs(data.avgResponseTimeMs)}
              </div>
            </div>
          </div>

          {/* Last Message */}
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              fontSize: 12,
            }}
          >
            <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Last Message</div>
            <div
              style={{
                color: '#ccc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {data.lastMessagePreview}
            </div>
          </div>

          {/* Source Breakdown */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {(Object.entries(data.sourceBreakdown) as [string, number][]).map(([source, count]) => {
              const Icon = SOURCE_ICONS[source] || Globe;
              const color = SOURCE_COLORS[source] || '#888';
              return (
                <div
                  key={source}
                  style={{
                    flex: 1,
                    background: '#1a1a1a',
                    borderRadius: 6,
                    padding: '6px 8px',
                    textAlign: 'center',
                  }}
                >
                  <Icon size={14} color={color} style={{ marginBottom: 2 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color }}>{count}</div>
                  <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase' }}>{source}</div>
                </div>
              );
            })}
          </div>

          {/* Topics */}
          {data.topTopics.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Top Topics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {data.topTopics.slice(0, 6).map((topic) => (
                  <span
                    key={topic}
                    style={{
                      background: '#1e293b',
                      color: '#94a3b8',
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: '#555',
              borderTop: '1px solid #1e1e1e',
              paddingTop: 8,
            }}
          >
            <span>
              <Zap size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
              {data.totalMessages} total msgs
            </span>
            <span>
              {data.bridge.totalMerged} brain-merged
            </span>
          </div>
        </>
      )}

      {!data && !error && (
        <div style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: 12 }}>
          Connecting...
        </div>
      )}
    </div>
  );
}
