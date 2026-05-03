'use client';

import { useEffect } from 'react';
import { useAuth } from '../../contexts/auth';
import { useMelliPageContext } from '../../hooks/useMelliPageContext';
import { useUIStore } from '../../stores/ui';
import { useNotificationStore } from '../../stores/notifications';
import { useSSE } from '../../hooks/useSSE';
import { FireStickMenu } from './FireStickMenu';
import { TopBar } from './top-bar';
import { MobileNav } from './MobileNav';
import { NotificationCenter } from './NotificationCenter';
import { SlidePanel } from '@memelli/ui';
import UniversalHeader from '../universal-header';
import { SystemPulse } from '../uniscreen';
import { LoadingGlobe } from '../ui/loading-globe';
import { WorkspaceContainer } from '../workspace/workspace-container';


interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children: _children }: AppShellProps) {
  const { token, isLoading } = useAuth();
  useMelliPageContext(); // auto-detects page + feeds live data to Melli globe

  // UI store
  const notificationPanelOpen = useUIStore((s) => s.notificationPanelOpen);
  const closeNotificationPanel = () =>
    useUIStore.setState({ notificationPanelOpen: false });

  // Notifications
  const addNotification = useNotificationStore((s) => s.addNotification);
  const setSSEConnected = useNotificationStore((s) => s.setSseConnected);

  // SSE connection for real-time notifications
  const { connected } = useSSE({
    notification: (event) => {
      const payload = event.data as {
        type?: 'info' | 'success' | 'warning' | 'error';
        title?: string;
        message?: string;
        category?: string;
        actionUrl?: string;
      };
      addNotification({
        type: payload.type ?? 'info',
        title: payload.title ?? 'New notification',
        message: payload.message,
        category: payload.category,
        actionUrl: payload.actionUrl,
      });
    },
  });

  useEffect(() => {
    setSSEConnected(connected);
  }, [connected, setSSEConnected]);

  // If still loading auth state, show spinner briefly
  if (!token && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <LoadingGlobe size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* ── Universal Header ── */}
      <UniversalHeader />

      {/* ── Main content: full width (no persistent sidebar) ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />

        <WorkspaceContainer />

        <div className="border-t border-[hsl(var(--border))]">
          <SystemPulse />
        </div>
      </div>

      {/* ── Fire Stick overlay menu (slides from left) ── */}
      <FireStickMenu />

      {/* ── Notification Center ── */}
      <SlidePanel
        open={notificationPanelOpen}
        onClose={closeNotificationPanel}
        title="Notifications"
        width="md"
      >
        <NotificationCenter />
      </SlidePanel>

      {/* ── Mobile nav ── */}
      <MobileNav />

    </div>
  );
}
