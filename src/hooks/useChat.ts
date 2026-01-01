import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { apiService } from '@/services/api.service';
import type { Message, ChatResponse } from '@/types';

export interface UseChatOptions {
  sessionId?: string;
  onError?: (error: Error) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    options.sessionId
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  const prevSessionIdRef = useRef<string | undefined>(options.sessionId);

  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(
    () => options,
    [options.sessionId, options.onError]
  );

  useEffect(() => {
    const loadMessages = async () => {
      // Prevent loading if already loading or if sessionId hasn't changed
      if (
        isLoadingRef.current ||
        options.sessionId === prevSessionIdRef.current
      ) {
        return;
      }

      if (options.sessionId && options.sessionId !== prevSessionIdRef.current) {
        prevSessionIdRef.current = options.sessionId;

        try {
          isLoadingRef.current = true;
          setIsLoading(true);
          setError(null);

          const sessionMessages = await apiService.getSessionMessages(
            options.sessionId
          );
          setMessages(sessionMessages);
          setCurrentSessionId(options.sessionId);
        } catch (err) {
          const error =
            err instanceof Error ? err : new Error('Failed to load messages');
          setError(error);
          options.onError?.(error);
        } finally {
          setIsLoading(false);
          isLoadingRef.current = false;
        }
      }
    };

    loadMessages();

    // Cleanup function to cancel any ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [options.sessionId, memoizedOptions]);

  const sendMessage = useCallback(
    async (content: string, file?: File): Promise<ChatResponse | null> => {
      if (!content.trim() && !file) return null;
      if (isLoadingRef.current) return null; // Prevent concurrent requests

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMessage: Message = {
        role: 'user',
        content: file ? `${content} [File: ${file.name}]` : content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      isLoadingRef.current = true;

      try {
        const response = await apiService.sendMessage(
          {
            message: content,
            session_id: currentSessionId,
            history: messages,
            save_to_db: false,
            file,
          },
          { signal: controller.signal }
        );

        const assistantMessage: Message = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          tools_used: response.tools_used,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentSessionId(response.session_id);

        return response;
      } catch (err) {
        // Don't handle aborted requests as errors
        if (err instanceof Error && err.name === 'AbortError') {
          return null;
        }

        const error =
          err instanceof Error ? err : new Error('Failed to send message');
        setError(error);
        options.onError?.(error);

        // Remove the user message on error
        setMessages((prev) => prev.slice(0, -1));
        return null;
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [messages, currentSessionId, memoizedOptions]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(undefined);
    setError(null);
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isLoadingRef.current = false;
  }, []);

  const retry = useCallback(() => {
    if (messages.length > 0 && !isLoadingRef.current) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'user');
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content);
      }
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    sessionId: currentSessionId,
    sendMessage,
    clearMessages,
    retry,
  };
}
