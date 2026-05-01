'use client';

import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

interface Entitlement {
  featureKey: string;
  productSlug?: string;
  enabled: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
}

interface EntitlementsPayload {
  planSlug: string | null;
  products: string[];
  entitlements: Entitlement[];
}

export function useEntitlements() {
  const api = useApi();

  const { data, isLoading } = useQuery<EntitlementsPayload>({
    queryKey: ['entitlements'],
    queryFn: async () => {
      const res = await api.get<EntitlementsPayload>('/api/entitlements');
      if (res.error || !res.data) {
        throw new Error(res.error ?? 'Failed to fetch entitlements');
      }
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const find = (featureKey: string): Entitlement | undefined =>
    data?.entitlements?.find((e) => e.featureKey === featureKey);

  /** True if the tenant's plan includes this product */
  const hasProduct = (productSlug: string): boolean => {
    return data?.products?.includes(productSlug) ?? false;
  };

  /** True if the tenant has access to this feature key */
  const hasFeature = (featureKey: string): boolean => {
    const ent = find(featureKey);
    return ent?.enabled ?? false;
  };

  /** Returns the numeric limit for a feature, or null if unlimited */
  const getLimit = (limitKey: string): number | null => {
    return find(limitKey)?.limit ?? null;
  };

  /** True if the product is NOT in the tenant's active products (locked behind upgrade) */
  const isLocked = (productSlug: string): boolean => {
    return !hasProduct(productSlug);
  };

  /** True if the product is locked — use to conditionally render upgrade prompts */
  const shouldShowUpgrade = (productSlug: string): boolean => {
    return isLocked(productSlug);
  };

  /** Returns the current plan/tier name, or 'free' if none */
  const tierName = (): string => {
    return data?.planSlug ?? 'free';
  };

  return {
    hasProduct,
    hasFeature,
    getLimit,
    isLocked,
    shouldShowUpgrade,
    tierName,
    isLoading,
  };
}
