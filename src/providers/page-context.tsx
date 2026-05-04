'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface PageContextData {
  currentRoute: string;
  pageTitle: string;
  section: string;
  selectedEntityId: string | null;
  selectedEntityType: string | null;
  uploadedFiles: UploadedFile[];
  screenshot: string | null;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface PageContextValue extends PageContextData {
  broadcastPageData: (data: Partial<PageContextData>) => void;
  setSelectedEntity: (id: string | null, type: string | null) => void;
  attachFile: (file: UploadedFile) => void;
  removeFile: (id: string) => void;
  attachScreenshot: (dataUrl: string | null) => void;
  clearAttachments: () => void;
}

const PageContext = createContext<PageContextValue | null>(null);

function deriveSection(pathname: string): string {
  if (pathname.includes('/commerce') || pathname.includes('/stores') || pathname.includes('/products') || pathname.includes('/orders')) return 'commerce';
  if (pathname.includes('/crm') || pathname.includes('/contacts') || pathname.includes('/deals') || pathname.includes('/pipelines')) return 'crm';
  if (pathname.includes('/coaching') || pathname.includes('/programs') || pathname.includes('/lessons')) return 'coaching';
  if (pathname.includes('/seo') || pathname.includes('/traffic') || pathname.includes('/articles')) return 'seo';
  if (pathname.includes('/content')) return 'content';
  if (pathname.includes('/agents') || pathname.includes('/agent-pools')) return 'agents';
  if (pathname.includes('/command-center')) return 'command-center';
  if (pathname.includes('/deploy')) return 'deploy';
  if (pathname.includes('/diagnostics')) return 'diagnostics';
  if (pathname.includes('/terminal')) return 'terminal';
  if (pathname.includes('/communications') || pathname.includes('/comms')) return 'communications';
  if (pathname.includes('/analytics')) return 'analytics';
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/dashboard')) return 'dashboard';
  if (pathname.includes('/universe')) return 'universe';
  return 'general';
}

function derivePageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return 'Dashboard';
  return last
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function PageContextProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [data, setData] = useState<PageContextData>({
    currentRoute: pathname,
    pageTitle: derivePageTitle(pathname),
    section: deriveSection(pathname),
    selectedEntityId: null,
    selectedEntityType: null,
    uploadedFiles: [],
    screenshot: null,
  });

  // Auto-update on route change
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      currentRoute: pathname,
      pageTitle: derivePageTitle(pathname),
      section: deriveSection(pathname),
      // Clear entity selection on navigation
      selectedEntityId: null,
      selectedEntityType: null,
    }));
  }, [pathname]);

  const broadcastPageData = useCallback((partial: Partial<PageContextData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const setSelectedEntity = useCallback((id: string | null, type: string | null) => {
    setData((prev) => ({ ...prev, selectedEntityId: id, selectedEntityType: type }));
  }, []);

  const attachFile = useCallback((file: UploadedFile) => {
    setData((prev) => ({ ...prev, uploadedFiles: [...prev.uploadedFiles, file] }));
  }, []);

  const removeFile = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((f) => f.id !== id),
    }));
  }, []);

  const attachScreenshot = useCallback((dataUrl: string | null) => {
    setData((prev) => ({ ...prev, screenshot: dataUrl }));
  }, []);

  const clearAttachments = useCallback(() => {
    setData((prev) => ({ ...prev, uploadedFiles: [], screenshot: null }));
  }, []);

  return (
    <PageContext.Provider
      value={{
        ...data,
        broadcastPageData,
        setSelectedEntity,
        attachFile,
        removeFile,
        attachScreenshot,
        clearAttachments,
      }}
    >
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext(): PageContextValue {
  const ctx = useContext(PageContext);
  if (!ctx) {
    // Return a safe fallback when outside the provider (e.g., in auth pages)
    return {
      currentRoute: '/',
      pageTitle: '',
      section: 'general',
      selectedEntityId: null,
      selectedEntityType: null,
      uploadedFiles: [],
      screenshot: null,
      broadcastPageData: () => {},
      setSelectedEntity: () => {},
      attachFile: () => {},
      removeFile: () => {},
      attachScreenshot: () => {},
      clearAttachments: () => {},
    };
  }
  return ctx;
}
