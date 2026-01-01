import useSWR from 'swr';
import { apiService } from '@/services/api.service';
import type { SessionDetails } from '@/types';

export function useSessions() {
  const {
    data: sessions,
    error,
    isLoading,
    mutate,
  } = useSWR<SessionDetails[]>(
    'sessions',
    async () => {
      const sessionList = await apiService.getSessions();
      const sessionDetailsPromises = sessionList.map(async (session) => {
        try {
          return await apiService.getSessionDetails(session.session_id);
        } catch (error) {
          console.warn(`Failed to load session ${session.session_id}:`, error);
          return null; // Skip invalid sessions
        }
      });
      const sessionDetails = await Promise.all(sessionDetailsPromises);
      return sessionDetails.filter((s): s is SessionDetails => s !== null);
    },
    {
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      focusThrottleInterval: 5000,
    }
  );

  const createSession = async () => {
    try {
      const newSession = await apiService.createSession();
      // Create SessionDetails with empty messages
      const newSessionDetails: SessionDetails = {
        ...newSession,
        messages: [],
      };
      // Optimistically update the cache
      mutate([...(sessions || []), newSessionDetails], false);
      return newSessionDetails;
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
