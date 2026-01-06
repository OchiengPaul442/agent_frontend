import { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '@/services/api.service';
import type { Message, ChatResponse, ResponseRole } from '@/types';
import { sanitizeMarkdown } from '@/utils/helpers';

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
  const typewriterRef = useRef<number | null>(null);
  const streamingMessageRef = useRef<string>('');

  // Cleanup typewriter animation on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current !== null) {
        cancelAnimationFrame(typewriterRef.current);
        typewriterRef.current = null;
      }
    };
  }, []);

  // Typewriter effect using requestAnimationFrame for smooth 60fps animation
  const animateTypewriter = useCallback(
    (fullText: string, timestamp?: string, tools_used?: string[]) => {
      // Cancel any existing animation
      if (typewriterRef.current !== null) {
        cancelAnimationFrame(typewriterRef.current);
        typewriterRef.current = null;
      }

      streamingMessageRef.current = '';
      let charIndex = 0;
      const charsPerFrame = 2; // Characters to add per frame (~120 chars/sec at 60fps)
      let lastTime = performance.now();
      const targetFPS = 60;
      const frameTime = 1000 / targetFPS;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - lastTime;

        // Maintain consistent frame rate
        if (elapsed >= frameTime) {
          lastTime = currentTime - (elapsed % frameTime);

          // Add characters based on charsPerFrame
          const endIndex = Math.min(charIndex + charsPerFrame, fullText.length);
          streamingMessageRef.current = fullText.slice(0, endIndex);
          charIndex = endIndex;

          // Update the last message with streaming content
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: streamingMessageRef.current,
                isStreaming: charIndex < fullText.length,
              };
            }
            return updated;
          });

          // Continue animation if not complete
          if (charIndex < fullText.length) {
            typewriterRef.current = requestAnimationFrame(animate);
          } else {
            // Animation complete - finalize message
            typewriterRef.current = null;
            streamingMessageRef.current = '';
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                updated[lastIdx] = {
                  role: 'assistant',
                  content: fullText,
                  timestamp: timestamp || new Date().toISOString(),
                  tools_used: tools_used,
                  isStreaming: false,
                };
              }
              return updated;
            });
          }
        } else {
          // Not enough time elapsed, continue to next frame
          typewriterRef.current = requestAnimationFrame(animate);
        }
      };

      // Start animation
      typewriterRef.current = requestAnimationFrame(animate);
    },
    []
  );

  // Don't load messages from API - keep them in local state only
  // This prevents loops and keeps the session stable

  const sendMessage = useCallback(
    async (
      content: string,
      file?: File,
      latitude?: number,
      longitude?: number,
      role?: ResponseRole,
      fileId?: string
    ): Promise<ChatResponse | null> => {
      if (!content.trim() && !file) return null;
      if (isLoadingRef.current) return null; // Prevent concurrent requests
      if (!options.sessionId) return null; // Ensure session ID is available

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
            fileId: fileId,
          },
        }),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      isLoadingRef.current = true;

      try {
        if (file) {
          console.log('📤 Sending message with file:', {
            message: content,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          });
        }
        const response = await apiService.sendMessage(
          {
            message: content,
            session_id: options.sessionId,
            history: messages,
            save_to_db: false,
            file,
            latitude: latitude,
            longitude: longitude,
            role: role,
          },
          { signal: controller.signal }
        );

        const sanitizedContent = sanitizeMarkdown(response.response);
        const timestamp = new Date().toISOString();

        // Add placeholder message for streaming effect
        const placeholderMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: timestamp,
          tools_used: response.tools_used,
          isStreaming: true,
        };

        setMessages((prev) => [...prev, placeholderMessage]);

        // Start typewriter animation
        animateTypewriter(sanitizedContent, timestamp, response.tools_used);

        return response;
      } catch (err) {
        // Don't handle aborted requests as errors
        if (err instanceof Error && err.name === 'AbortError') {
          return null;
        }

        const error =
          err instanceof Error ? err : new Error('Failed to send message');
        // setError(error); // Remove this to avoid showing error dialog
        options.onError?.(error);

        // Add error message instead of removing user message
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${error.message}`,
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
        return null;
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [messages, options, animateTypewriter]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Cancel any ongoing typewriter animation
    if (typewriterRef.current !== null) {
      cancelAnimationFrame(typewriterRef.current);
      typewriterRef.current = null;
    }
    streamingMessageRef.current = '';
    isLoadingRef.current = false;
  }, []);

  const editMessage = useCallback(
    async (
      messageIndex: number,
      newContent: string
    ): Promise<ChatResponse | null> => {
      if (!newContent.trim() || isLoadingRef.current) return null;

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Update the message at the specified index
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[messageIndex]) {
          updated[messageIndex] = {
            ...updated[messageIndex],
            content: newContent,
            timestamp: new Date().toISOString(),
          };
        }
        // Remove all messages after the edited one
        return updated.slice(0, messageIndex + 1);
      });

      setIsLoading(true);
      setError(null);
      isLoadingRef.current = true;

      try {
        // Get the conversation history up to the edited message
        const historyUpToEdit = messages.slice(0, messageIndex + 1);

        const response = await apiService.sendMessage(
          {
            message: newContent,
            session_id: options.sessionId,
            history: historyUpToEdit.slice(0, -1), // Exclude the current message from history as it's being sent
            save_to_db: false,
            // Note: We don't pass the file when editing as it's already been processed
          },
          { signal: controller.signal }
        );

        const sanitizedContent = sanitizeMarkdown(response.response);
        const timestamp = new Date().toISOString();

        // Add placeholder message for streaming effect
        const placeholderMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: timestamp,
          tools_used: response.tools_used,
          isStreaming: true,
        };

        setMessages((prev) => [...prev, placeholderMessage]);

        // Start typewriter animation
        animateTypewriter(sanitizedContent, timestamp, response.tools_used);

        return response;
      } catch (err) {
        // Don't handle aborted requests as errors
        if (err instanceof Error && err.name === 'AbortError') {
          return null;
        }

        const error =
          err instanceof Error ? err : new Error('Failed to send message');
        // setError(error); // Remove this to avoid showing error dialog
        options.onError?.(error);

        // Add error message instead of removing messages
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${error.message}`,
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
        return null;
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [messages, options, animateTypewriter]
  );

  const retryMessage = useCallback(
    async (messageIndex: number): Promise<ChatResponse | null> => {
      const message = messages[messageIndex];
      if (!message || isLoadingRef.current) return null;

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let targetMessageIndex = messageIndex;
      let targetMessage = message;

      // If this is an assistant message, find the preceding user message
      if (message.role === 'assistant') {
        // Find the user message that prompted this response
        for (let i = messageIndex - 1; i >= 0; i--) {
          if (messages[i].role === 'user') {
            targetMessageIndex = i;
            targetMessage = messages[i];
            break;
          }
        }
      }

      // Remove all messages after the target message
      setMessages((prev) => prev.slice(0, targetMessageIndex + 1));

      setIsLoading(true);
      setError(null);
      isLoadingRef.current = true;

      try {
        // Get the conversation history up to the target message
        const historyUpToMessage = messages.slice(0, targetMessageIndex);

        const response = await apiService.sendMessage(
          {
            message: targetMessage.content,
            session_id: options.sessionId,
            history: historyUpToMessage,
            save_to_db: false,
            // Note: We don't pass the file when retrying as it's already been processed
          },
          { signal: controller.signal }
        );

        const sanitizedContent = sanitizeMarkdown(response.response);
        const timestamp = new Date().toISOString();

        // Add placeholder message for streaming effect
        const placeholderMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: timestamp,
          tools_used: response.tools_used,
          isStreaming: true,
        };

        setMessages((prev) => [...prev, placeholderMessage]);

        // Start typewriter animation
        animateTypewriter(sanitizedContent, timestamp, response.tools_used);

        return response;
      } catch (err) {
        // Don't handle aborted requests as errors
        if (err instanceof Error && err.name === 'AbortError') {
          return null;
        }

        const error =
          err instanceof Error ? err : new Error('Failed to retry message');
        options.onError?.(error);

        // Add error message instead of removing messages
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${error.message}`,
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
        return null;
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [messages, options, animateTypewriter]
  );

  // Function to add error messages to chat without sending to API
  const addErrorMessage = useCallback((content: string) => {
    const errorMessage: Message = {
      role: 'assistant',
      content: content,
      timestamp: new Date().toISOString(),
      isError: true,
    };
    setMessages((prev) => [...prev, errorMessage]);
  }, []);

  // Function to stop ongoing AI response
  const stopResponse = useCallback(() => {
    console.log('🛑 Stopping AI response');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop typewriter animation
    if (typewriterRef.current !== null) {
      cancelAnimationFrame(typewriterRef.current);
      typewriterRef.current = null;
    }

    // Update loading state
    setIsLoading(false);
    isLoadingRef.current = false;

    // Complete any streaming message
    if (streamingMessageRef.current) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isStreaming
            ? {
                ...msg,
                content: streamingMessageRef.current,
                isStreaming: false,
              }
            : msg
        )
      );
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId: options.sessionId,
    sendMessage,
    clearMessages,
    retryMessage,
    editMessage,
    addErrorMessage,
    stopResponse,
  };
}
