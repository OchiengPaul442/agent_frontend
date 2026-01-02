import { useState, useCallback, useRef, useEffect } from 'react';
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

  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  // Don't load messages from API - keep them in local state only
  // This prevents loops and keeps the session stable

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
        content: file ? content : content,
        timestamp: new Date().toISOString(),
        ...(file && {
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        }),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      isLoadingRef.current = true;

      try {
        const response = await apiService.sendMessage(
          {
            message: content,
            session_id: options.sessionId,
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
    [messages, options.sessionId, options]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
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
    sessionId: options.sessionId,
    sendMessage,
    clearMessages,
    retry,
  };
}
