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
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  });

  const createSession = async () => {
    const newSession = await apiService.createSession();
    mutate([...(sessions || []), newSession], false);
    return newSession;
  };

  const deleteSession = async (sessionId: string) => {
    await apiService.deleteSession(sessionId);
    mutate(
      sessions?.filter((s) => s.session_id !== sessionId),
      false
    );
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
