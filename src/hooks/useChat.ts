import { useState, useCallback, useRef, useEffect } from 'react';
import { apiService } from '@/services/api.service';
import type { Message, ChatResponse, ResponseRole } from '@/types';
import { sanitizeMarkdown } from '@/utils/helpers';

// Typing mode for the typewriter animation:
// - 'normal': original timing
// - 'fast': reduced per-char delays for snappier typing
// - 'instant': render full response immediately (no per-char delays)
// - 'chunked': type in sentence groups for ultra-fast, formatted reveal
const TYPEWRITER_MODE: 'normal' | 'fast' | 'instant' | 'chunked' = 'fast';

export interface UseChatOptions {
  sessionId?: string;
  onError?: (error: Error) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamingMessageRef = useRef<string>('');

  // Cleanup typewriter animation on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current !== null) {
        clearTimeout(typewriterRef.current);
        typewriterRef.current = null;
      }
    };
  }, []);

  // Typewriter effect using setTimeout for stable, ChatGPT-like animation
  const animateTypewriter = useCallback(
    (fullText: string, timestamp?: string, tools_used?: string[]) => {
      // Cancel any existing animation
      if (typewriterRef.current !== null) {
        clearTimeout(typewriterRef.current);
        typewriterRef.current = null;
      }

      streamingMessageRef.current = '';
      let charIndex = 0;

      // If instant mode is enabled, render the full response immediately
      if (TYPEWRITER_MODE === 'instant') {
        // Clear any pending timeouts
        if (typewriterRef.current !== null) {
          clearTimeout(typewriterRef.current);
          typewriterRef.current = null;
        }
        streamingMessageRef.current = '';
        setIsTyping(false);
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
        return;
      }

      // Chunked mode: Type in sentence groups for ultra-fast, formatted reveal
      if (TYPEWRITER_MODE === 'chunked') {
        // Split by sentences for better formatting reveal
        const sentences = fullText.split(/(?<=[.!?])\s+/);
        let sentenceIndex = 0;

        const typeNextChunk = () => {
          if (sentenceIndex < sentences.length) {
            const sentence =
              sentences[sentenceIndex] +
              (sentenceIndex < sentences.length - 1 ? ' ' : '');
            streamingMessageRef.current += sentence;
            sentenceIndex++;

            // Update the last message with streaming content
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: streamingMessageRef.current,
                  isStreaming: sentenceIndex < sentences.length,
                };
              }
              return updated;
            });

            // Ultra-short delay between sentences for near-instant animation
            const chunkDelay = 10 + Math.random() * 10; // 10-20ms
            typewriterRef.current = setTimeout(typeNextChunk, chunkDelay);
          } else {
            // Animation complete - finalize message
            typewriterRef.current = null;
            streamingMessageRef.current = '';
            setIsTyping(false);
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
        };

        // Start the chunked animation
        typeNextChunk();
        return;
      }

      const typeNextChar = () => {
        if (charIndex < fullText.length) {
          // Add one character at a time
          streamingMessageRef.current = fullText.slice(0, charIndex + 1);
          charIndex++;

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

          // Calculate delay based on character type for natural rhythm,
          // but allow 'fast' mode to reduce timings significantly.
          const currentChar = fullText[charIndex - 1];
          let baseDelay: number;

          if (currentChar === ' ') {
            baseDelay =
              TYPEWRITER_MODE === 'fast'
                ? 1 + Math.random() * 2
                : 4 + Math.random() * 4;
          } else if (/[a-z]/.test(currentChar)) {
            baseDelay =
              TYPEWRITER_MODE === 'fast'
                ? 2 + Math.random() * 3
                : 8 + Math.random() * 4;
          } else if (/[A-Z0-9]/.test(currentChar)) {
            baseDelay =
              TYPEWRITER_MODE === 'fast'
                ? 3 + Math.random() * 3
                : 12 + Math.random() * 4;
          } else if (/[.,!?;:]/.test(currentChar)) {
            baseDelay =
              TYPEWRITER_MODE === 'fast'
                ? 6 + Math.random() * 4
                : 16 + Math.random() * 4;
          } else if (currentChar === '#') {
            baseDelay =
              TYPEWRITER_MODE === 'fast'
                ? 8 + Math.random() * 6
                : 20 + Math.random() * 8;
          } else {
            baseDelay =
              TYPEWRITER_MODE === 'fast'
                ? 3 + Math.random() * 3
                : 12 + Math.random() * 4;
          }

          typewriterRef.current = setTimeout(typeNextChar, baseDelay);
        } else {
          // Animation complete - finalize message
          typewriterRef.current = null;
          streamingMessageRef.current = '';
          setIsTyping(false);
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
      };

      // Start the animation
      typeNextChar();
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
      fileId?: string,
      image?: File,
      imageId?: string
    ): Promise<ChatResponse | null> => {
      if (!content.trim() && !file && !image) return null;
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
        content: file || image ? content : content,
        timestamp: new Date().toISOString(),
        ...(file && {
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            fileId: fileId,
          },
        }),
        ...(image && {
          image: {
            name: image.name,
            size: image.size,
            type: image.type,
            imageId: imageId,
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
        if (image) {
          console.log('📤 Sending message with image:', {
            message: content,
            imageName: image.name,
            imageSize: image.size,
            imageType: image.type,
          });
        }
        const response = await apiService.sendMessage(
          {
            message: content,
            session_id: options.sessionId,
            history: messages,
            save_to_db: false,
            file,
            image,
            latitude: latitude,
            longitude: longitude,
            role: role,
          },
          { signal: controller.signal }
        );

        const sanitizedContent = sanitizeMarkdown(response.response);
        const timestamp = new Date().toISOString();

        // Set typing state immediately when response is received to keep stop button visible
        setIsTyping(true);

        // Add placeholder message for streaming effect
        const placeholderMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: timestamp,
          tools_used: response.tools_used,
          isStreaming: true,
          thinking_steps: response.thinking_steps,
          reasoning_content: response.reasoning_content,
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
      clearTimeout(typewriterRef.current);
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

        // Set typing state immediately when response is received to keep stop button visible
        setIsTyping(true);

        // Add placeholder message for streaming effect
        const placeholderMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: timestamp,
          tools_used: response.tools_used,
          isStreaming: true,
          thinking_steps: response.thinking_steps,
          reasoning_content: response.reasoning_content,
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

        // Set typing state immediately when response is received to keep stop button visible
        setIsTyping(true);

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
      clearTimeout(typewriterRef.current);
      typewriterRef.current = null;
    }

    // Update loading state
    setIsLoading(false);
    isLoadingRef.current = false;
    setIsTyping(false);

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
    isTyping,
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
