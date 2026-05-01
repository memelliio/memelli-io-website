'use client';

import { useCallback, useState } from 'react';
import { useApi } from './useApi';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UniversalApplication {
  id: string;
  tenantId: string;
  contactId: string;
  applicationType: string;
  status: string;
  onboardingStep: string | null;
  onboardingComplete: boolean;
  fundingGoal: string | null;
  fundingAmount: number | null;
  fundingPurpose: string | null;
  fundingUrgency: string | null;
  serviceInterest: string[];
  businessVsPersonal: string | null;
  creditRepairGoal: string | null;
  disputeStrategy: string | null;
  coachingGoal: string | null;
  programInterest: string | null;
  currentStage: string | null;
  completedSteps: any[];
  stageHistory: any[];
  applicationData: Record<string, any>;
  notes: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: { id: string; firstName: string; lastName: string; email: string };
}

export interface CreateApplicationInput {
  contactId: string;
  applicationType?: string;
  fundingGoal?: string;
  fundingAmount?: number;
  fundingPurpose?: string;
  serviceInterest?: string[];
  businessVsPersonal?: string;
  creditRepairGoal?: string;
  coachingGoal?: string;
  programInterest?: string;
  applicationData?: Record<string, any>;
  notes?: string;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useUniversalApplication() {
  const api = useApi();
  const [applications, setApplications] = useState<UniversalApplication[]>([]);
  const [current, setCurrent] = useState<UniversalApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async (filters?: { contactId?: string; type?: string; status?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.contactId) params.set('contactId', filters.contactId);
      if (filters?.type) params.set('type', filters.type);
      if (filters?.status) params.set('status', filters.status);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<any>(`/api/universal/applications${query}`);
      const payload = (res?.data as any)?.data || res?.data;
      setApplications(Array.isArray(payload) ? payload : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const get = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/api/universal/applications/${id}`);
      const payload = (res?.data as any)?.data || res?.data;
      setCurrent(payload);
      return payload;
    } catch (err: any) {
      setError(err?.message || 'Not found');
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const create = useCallback(async (input: CreateApplicationInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<any>('/api/universal/applications', input);
      const payload = (res?.data as any)?.data || res?.data;
      setCurrent(payload);
      return payload;
    } catch (err: any) {
      setError(err?.message || 'Create failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const update = useCallback(async (id: string, updates: Partial<UniversalApplication>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch<any>(`/api/universal/applications/${id}`, updates);
      const payload = (res?.data as any)?.data || res?.data;
      setCurrent(payload);
      return payload;
    } catch (err: any) {
      setError(err?.message || 'Update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  return { applications, current, loading, error, list, get, create, update };
}
