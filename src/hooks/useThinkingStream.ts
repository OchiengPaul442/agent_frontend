/**
 * React Hook for consuming AI reasoning/thinking streams
 *
 * Supports real-time streaming of AI thinking steps and responses
 * from reasoning models like DeepSeek R1, Nemotron-3-nano, and Gemini 2.5 Flash
 *
 * @example
 * ```typescript
 * const { thinking, content, isStreaming, error, sendMessage } =
 *   useThinkingStream();
 *
 * // Send message
 * await sendMessage({ message: 'What is the air quality in Kampala?' });
 *
 * // Display thinking steps
 * {thinking.map((step, i) => (
 *   <div key={i}>{step}</div>
 * ))}
 * ```
 */

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '@/config';

const API_BASE = `${config.api.baseUrl}/api/${config.api.version}`;

/**
 * State for thinking stream
 */
interface ThinkingState {
  /** Array of thinking/reasoning steps from the AI */
  thinking: string[];

  /** Final response content from the AI */
  content: string;

  /** Whether stream is currently active */
  isStreaming: boolean;

  /** Error message if stream failed */
  error: string | null;

  /** Session ID for conversation continuity */
  sessionId: string | null;

  /** Tools/APIs called during response */
  toolsUsed: string[];

  /** Duration of thinking process in milliseconds */
  duration: number;
}

/**
 * Options for sending a message
 */
interface SendMessageOptions {
  /** User message text */
  message: string;

  /** Optional session ID for conversation continuity */
  sessionId?: string;

  /** Optional file upload */
  file?: File;

  /** Optional GPS coordinates */
  latitude?: number;
  longitude?: number;

  /** Optional agent role/style */
  role?: 'general' | 'executive' | 'technical' | 'simple' | 'policy';
}

/**
 * Hook for consuming AI reasoning streams
 *
 * @returns Thinking state and sendMessage function
 */
export function useThinkingStream() {
  const [state, setState] = useState<ThinkingState>({
    thinking: [],
    content: '',
    isStreaming: false,
    error: null,
    sessionId: null,
    toolsUsed: [],
    duration: 0,
  });

  const bufferRef = useRef<string>('');
  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Buffer updates every 50ms for performance - proper cleanup
  useEffect(() => {
    if (!state.isStreaming) {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }

    updateIntervalRef.current = setInterval(() => {
      if (bufferRef.current) {
        setState((prev) => ({
          ...prev,
          thinking: [...prev.thinking, bufferRef.current],
          duration: Date.now() - startTimeRef.current,
        }));
        bufferRef.current = '';
      }
    }, 50);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [state.isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  /**
   * Send a message and start streaming response
   */
  const sendMessage = useCallback(async (options: SendMessageOptions) => {
    // Abort previous stream if any
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    startTimeRef.current = Date.now();

    // Reset state
    setState({
      thinking: [],
      content: '',
      isStreaming: true,
      error: null,
      sessionId: options.sessionId || null,
      toolsUsed: [],
      duration: 0,
    });

    // Build form data
    const formData = new FormData();
    formData.append('message', options.message);

    if (options.sessionId) {
      formData.append('session_id', options.sessionId);
    }

    if (options.file) {
      formData.append('file', options.file);
    }

    if (options.latitude !== undefined) {
      formData.append('latitude', options.latitude.toString());
    }

    if (options.longitude !== undefined) {
      formData.append('longitude', options.longitude.toString());
    }

    if (options.role) {
      formData.append('role', options.role);
    }

    try {
      await fetchEventSource(`${API_BASE}/agent/chat/stream`, {
        method: 'POST',
        body: formData,
        signal: abortRef.current.signal,

        onmessage(ev: { event?: string; data: string }) {
          const data = JSON.parse(ev.data);

          if (ev.event === 'start') {
            // Stream started
            console.log('Stream started');
          } else if (ev.event === 'thinking') {
            // AI thinking step - buffer for performance
            bufferRef.current += data.content || '';
          } else if (ev.event === 'content') {
            // Response content chunk
            setState((prev) => ({
              ...prev,
              content: prev.content + (data.content || ''),
              duration: Date.now() - startTimeRef.current,
            }));
          } else if (ev.event === 'tools') {
            // Tool execution notification
            setState((prev) => ({
              ...prev,
              toolsUsed: [...prev.toolsUsed, data.tool_name],
            }));
          } else if (ev.event === 'done') {
            // Stream complete - flush any remaining buffer
            if (bufferRef.current) {
              setState((prev) => ({
                ...prev,
                thinking: [...prev.thinking, bufferRef.current],
                isStreaming: false,
                sessionId: data.session_id || prev.sessionId,
                toolsUsed: data.tools_used || prev.toolsUsed,
                duration: Date.now() - startTimeRef.current,
              }));
              bufferRef.current = '';
            } else {
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                sessionId: data.session_id || prev.sessionId,
                toolsUsed: data.tools_used || prev.toolsUsed,
                duration: Date.now() - startTimeRef.current,
              }));
            }
          }
        },

        onerror(err: Error) {
          console.error('Stream error:', err);
          setState((prev) => ({
            ...prev,
            error: err.message || 'Stream error occurred',
            isStreaming: false,
            duration: Date.now() - startTimeRef.current,
          }));
          throw err; // Stop retrying
        },

        onclose() {
          console.log('Stream closed');
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to connect to stream',
          isStreaming: false,
          duration: Date.now() - startTimeRef.current,
        }));
      }
    }
  }, []);

  /**
   * Stop the current stream
   */
  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      duration: Date.now() - startTimeRef.current,
    }));
  }, []);

  /**
   * Clear current state
   */
  const clear = useCallback(() => {
    setState({
      thinking: [],
      content: '',
      isStreaming: false,
      error: null,
      sessionId: null,
      toolsUsed: [],
      duration: 0,
    });
    bufferRef.current = '';
  }, []);

  return {
    ...state,
    sendMessage,
    stopStream,
    clear,
  };
}

/**
 * Format duration in human-readable format
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Calculate thinking complexity/depth from steps
 *
 * @param thinkingSteps - Array of thinking steps
 * @returns Complexity score (0-1)
 */
export function calculateThinkingComplexity(thinkingSteps: string[]): number {
  if (thinkingSteps.length === 0) return 0;

  // More steps = higher complexity (capped at 10 steps for max score)
  const stepScore = Math.min(thinkingSteps.length / 10, 1);

  // Longer steps = more detailed thinking
  const avgLength =
    thinkingSteps.reduce((sum, step) => sum + step.length, 0) /
    thinkingSteps.length;
  const lengthScore = Math.min(avgLength / 200, 1);

  return (stepScore + lengthScore) / 2;
}
