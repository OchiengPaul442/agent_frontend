import useSWR from 'swr';
import { apiService } from '@/services/api.service';
import type { Session } from '@/types';

export function useSessions() {
  const {
    data: sessions,
    error,
    isLoading,
    mutate,
  } = useSWR<Session[]>('sessions', () => apiService.getSessions(), {
    refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes instead of 30 seconds
    revalidateOnFocus: false, // Don't revalidate on focus to reduce API calls
    revalidateOnReconnect: true,
    dedupingInterval: 10000, // Dedupe requests within 10 seconds
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    focusThrottleInterval: 5000,
  });

  const createSession = async () => {
    try {
      const newSession = await apiService.createSession();
      // Optimistically update the cache
      mutate([...(sessions || []), newSession], false);
      return newSession;
    } catch (error) {
      // Revert optimistic update on error
      mutate();
      throw error;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      // Optimistically remove from cache
      mutate(
        sessions?.filter((s) => s.session_id !== sessionId),
        false
      );
      await apiService.deleteSession(sessionId);
    } catch (error) {
      // Revert optimistic update on error
      mutate();
      throw error;
    }
  };

  return {
    sessions: sessions || [],
    isLoading,
    error,
    createSession,
    deleteSession,
    refresh: mutate,
  };
}
