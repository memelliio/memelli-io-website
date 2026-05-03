'use client';

import { useCallback, useState } from 'react';
import { useApi } from './useApi';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MasterClientRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  type: string;
  source: string | null;
  tags: string[];

  // Extended profile
  dateOfBirth: string | null;
  employer: string | null;
  jobTitle: string | null;
  monthlyIncome: number | null;
  annualIncome: number | null;
  incomeVerified: boolean;

  // Business
  isBusinessOwner: boolean;
  businessName: string | null;
  businessType: string | null;
  ein: string | null;
  businessState: string | null;

  // SmartCredit
  smartcreditEmail: string | null;
  smartcreditConnected: boolean;
  smartcreditVerified: boolean;
  smartcreditLastPull: string | null;

  // Nested
  emails: any[];
  phones: any[];
  addresses: any[];

  // Application
  latestApplication: any | null;
  applicationCount: number;

  // Credit
  creditProfile: CreditProfileSummary | null;
  latestCreditReport: any | null;

  // Documents
  documents: DocumentSummary[];
  documentCount: number;

  // Activity
  recentActivity: any[];
  dealCount: number;
  enrollmentCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface CreditProfileSummary {
  equifaxScore: number | null;
  experianScore: number | null;
  transunionScore: number | null;
  latestScore: number | null;
  scoreCategory: string | null;
  fundingReady: boolean;
  lastPullAt: string | null;
  latestDecisionTier: string | null;
  issueCount: number;
  pullCount: number;
}

export interface DocumentSummary {
  id: string;
  docType: string;
  fileName: string;
  status: string;
  createdAt: string;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useMasterClientRecord(contactId: string | null) {
  const api = useApi();
  const [data, setData] = useState<MasterClientRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ success: boolean; data: MasterClientRecord }>(`/api/universal/client/${contactId}`);
      const payload = (res?.data as any)?.data || res?.data;
      if (payload?.id) {
        setData(payload);
      } else {
        setError('Client not found');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch client');
    } finally {
      setLoading(false);
    }
  }, [api, contactId]);

  const update = useCallback(async (updates: Partial<MasterClientRecord>) => {
    if (!contactId) return;
    setLoading(true);
    try {
      const res = await api.patch<any>(`/api/universal/client/${contactId}`, updates);
      if (res?.data) {
        await fetch(); // Refresh full record
      }
      return res;
    } catch (err: any) {
      setError(err?.message || 'Update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, contactId, fetch]);

  return { data, loading, error, fetch, update, refetch: fetch };
}

// ─── Convenience hooks ──────────────────────────────────────────────────────

export function useClientDocuments(contactId: string | null) {
  const api = useApi();
  const [documents, setDocuments] = useState<any[]>([]);
  const [byType, setByType] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const res = await api.get<any>(`/api/universal/documents/${contactId}`);
      const payload = (res?.data as any)?.data || res?.data;
      setDocuments(payload?.documents || []);
      setByType(payload?.byType || {});
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [api, contactId]);

  const checkDocument = useCallback(async (docType: string) => {
    if (!contactId) return { exists: false, needsUpload: true };
    try {
      const res = await api.get<any>(`/api/universal/documents/${contactId}/check/${docType}`);
      return (res?.data as any)?.data || { exists: false, needsUpload: true };
    } catch {
      return { exists: false, needsUpload: true };
    }
  }, [api, contactId]);

  return { documents, byType, loading, fetch, checkDocument };
}

export function useLatestCreditProfile(contactId: string | null) {
  const api = useApi();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const res = await api.get<any>(`/api/universal/credit/${contactId}`);
      const payload = (res?.data as any)?.data || res?.data;
      setProfile(payload);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [api, contactId]);

  const triggerPull = useCallback(async () => {
    if (!contactId) return null;
    setLoading(true);
    try {
      const res = await api.post<any>(`/api/universal/credit/${contactId}/pull`, {});
      const payload = (res?.data as any)?.data || res?.data;
      await fetch(); // Refresh profile
      return payload;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, contactId, fetch]);

  return { profile, loading, fetch, triggerPull };
}

export function useClientContext(contactId: string | null) {
  const api = useApi();
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const res = await api.get<any>(`/api/universal/context/${contactId}`);
      const payload = (res?.data as any)?.data || res?.data;
      setContext(payload);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [api, contactId]);

  return { context, loading, fetch };
}
