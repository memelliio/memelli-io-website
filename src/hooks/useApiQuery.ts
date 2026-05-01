'use client';

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useApi } from './useApi';

/**
 * Thin wrapper around react-query + useApi that provides a consistent
 * pattern for fetching data from the Memelli API.
 *
 * When the API call fails or returns null, `data` will be undefined
 * and `isError` will be true — callers can use this to show fallback UI.
 */
export function useApiQuery<T>(
  key: string[],
  path: string,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
) {
  const api = useApi();

  return useQuery<T, Error>({
    queryKey: key,
    queryFn: async () => {
      const res = await api.get<T>(path);
      if (res.error || res.data === null) {
        throw new Error(res.error ?? 'No data returned');
      }
      return res.data;
    },
    ...options,
  });
}

export function useApiMutation<TData, TBody>(
  path: string,
  method: 'post' | 'patch' | 'del' = 'post'
) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TBody>({
    mutationFn: async (body: TBody) => {
      let res;
      if (method === 'post') {
        res = await api.post<TData>(path, body);
      } else if (method === 'patch') {
        res = await api.patch<TData>(path, body);
      } else {
        res = await api.del<TData>(path);
      }
      if (res.error || res.data === null) {
        throw new Error(res.error ?? 'Mutation failed');
      }
      return res.data;
    },
  });
}
