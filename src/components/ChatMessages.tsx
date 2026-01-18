'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import ShimmerLoader from './ShimmerLoader';

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  onRetry?: (messageIndex: number) => void;
  onEditMessage?: (messageIndex: number, newContent: string) => void;
  onContinue?: () => void;
  onFilePreview?: (file: {
    name: string;
    size: number;
    type: string;
    fileId?: string;
  }) => void;
  onAvatarClick?: () => void;
  selectionMode?: boolean;
  selectedMessages?: Set<number>;
  onToggleSelection?: (index: number) => void;
}

export const ChatMessages = React.forwardRef(function ChatMessages(
  {
    messages,
    isLoading = false,
    onRetry,
    onEditMessage,
    onContinue,
    onFilePreview,
    onViewportChange,
    onAvatarClick,
    selectionMode = false,
    selectedMessages,
    onToggleSelection,
  }: ChatMessagesProps & { onViewportChange?: (isAtBottom: boolean) => void },
  ref
) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isAtBottomRef = useRef(true);
  const lastManualScrollTimeRef = useRef<number>(0);
  const isAutoScrollingRef = useRef(false);
  const wasLoadingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const prevMessagesLengthRef = useRef(0);

  // Check if we're at the bottom (without triggering re-renders)
  const checkIfAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return false;

    const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    return distanceToBottom < 150; // More forgiving threshold
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (isAutoScrollingRef.current) return; // Prevent overlapping auto-scrolls

    isAutoScrollingRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' });

    setTimeout(
      () => {
        isAutoScrollingRef.current = false;
      },
      behavior === 'smooth' ? 1000 : 100
    );
  }, []);

  // Expose imperative methods so parent can request a scroll-to-bottom
  React.useImperativeHandle(
    ref,
    () => ({
      scrollToBottom: () => {
        scrollToBottom('smooth');
      },
      scrollToMessageKey: (key: string) => {
        const el = messageRefs.current[key];
        if (el && containerRef.current) {
          lastManualScrollTimeRef.current = Date.now();
          containerRef.current.scrollTo({
            top: el.offsetTop - 12,
            behavior: 'smooth',
          });
        }
      },
    }),
    [scrollToBottom]
  );

  // Debounced scroll handler - only updates parent, no state changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      // Clear any pending timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Don't process scroll events during auto-scroll
      if (isAutoScrollingRef.current) return;

      // Mark as manual scroll
      lastManualScrollTimeRef.current = Date.now();

      // Debounce the check
      scrollTimeoutRef.current = window.setTimeout(() => {
        const wasAtBottom = isAtBottomRef.current;
        const nowAtBottom = checkIfAtBottom();

        // Only notify parent if state actually changed
        if (nowAtBottom !== wasAtBottom) {
          isAtBottomRef.current = nowAtBottom;
          onViewportChange?.(nowAtBottom);
        }
      }, 150); // Debounce for 150ms
    };

    el.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    const initialCheck = () => {
      isAtBottomRef.current = checkIfAtBottom();
      onViewportChange?.(isAtBottomRef.current);
    };
    initialCheck();

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [checkIfAtBottom, onViewportChange]);

  // Smart auto-scroll for new messages
  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) return;

    // Only process when new messages are added
    const messagesAdded = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (!messagesAdded) return;

    const lastMessage = messages[messages.length - 1];
    const timeSinceManualScroll = Date.now() - lastManualScrollTimeRef.current;

    // Wait for DOM to update, especially for charts/images
    const timeoutId = setTimeout(() => {
      // RULE 1: Always scroll for new user messages
      if (lastMessage.role === 'user') {
        scrollToBottom('smooth');
        return;
      }

      // RULE 2: For assistant messages while streaming
      if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
        // Only if user hasn't scrolled manually in last 3 seconds AND was at bottom
        if (timeSinceManualScroll > 3000 && isAtBottomRef.current) {
          scrollToBottom('smooth');
        }
        return;
      }

      // RULE 3: For completed assistant messages (not streaming)
      if (lastMessage.role === 'assistant' && !lastMessage.isStreaming) {
        // Only if user was at bottom when message completed
        if (isAtBottomRef.current) {
          // Longer delay for charts/images to load
          setTimeout(() => {
            if (isAtBottomRef.current) {
              scrollToBottom('smooth');
            }
          }, 200);
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, scrollToBottom]);

  // Handle loading completion (for charts/images that load after streaming)
  useEffect(() => {
    // Only trigger when loading changes from true to false
    if (!wasLoadingRef.current || isLoading) {
      wasLoadingRef.current = isLoading;
      return;
    }

    wasLoadingRef.current = isLoading;

    // Give extra time for charts/images to render
    const timeoutId = setTimeout(() => {
      const lastMessage = messages[messages.length - 1];

      // Only scroll if we have a completed assistant message and user is still at bottom
      if (
        lastMessage &&
        lastMessage.role === 'assistant' &&
        !lastMessage.isStreaming &&
        isAtBottomRef.current
      ) {
        scrollToBottom('smooth');
      }
    }, 300); // Extra delay for chart rendering

    return () => clearTimeout(timeoutId);
  }, [isLoading, messages, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className="chat-messages-container h-full overflow-y-auto pb-8"
    >
      <AnimatePresence mode="popLayout">
        {Array.isArray(messages) &&
          messages.map((message, index) => {
            const key = `${message.timestamp}-${index}`;
            const nextMessage = messages[index + 1];
            const hasNextMessage =
              nextMessage && nextMessage.role === 'assistant';
            const isCanceled =
              message.isError ||
              (message.role === 'user' && !nextMessage && !isLoading);

            return (
              <div
                key={key}
                className={`relative ${selectionMode ? 'group/select' : ''}`}
              >
                {selectionMode && (
                  <div className="absolute top-1/2 left-2 z-10 -translate-y-1/2 opacity-0 transition-opacity group-hover/select:opacity-100">
                    <label
                      className="flex h-6 w-6 cursor-pointer items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMessages?.has(index) || false}
                        onChange={() => onToggleSelection?.(index)}
                        className="border-border text-primary focus:ring-primary h-5 w-5 cursor-pointer rounded-md border-2 transition-all checked:scale-110"
                      />
                    </label>
                  </div>
                )}
                <MessageBubble
                  message={message}
                  outerRefKey={key}
                  registerRef={(k, el) => (messageRefs.current[k] = el)}
                  onEdit={onEditMessage}
                  messageIndex={index}
                  onRetry={onRetry}
                  onContinue={onContinue}
                  onFilePreview={onFilePreview}
                  hasNextMessage={hasNextMessage}
                  isCanceled={isCanceled}
                  onAvatarClick={onAvatarClick}
                  className={selectionMode ? 'ml-8' : ''}
                />
              </div>
            );
          })}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full py-4 sm:py-8"
        >
          <div className="mx-auto flex max-w-3xl gap-1 px-2 sm:gap-2 sm:px-4 lg:px-6">
            {/* Animated Avatar */}
            <div className="shrink-0">
              <motion.div
                className="bg-primary text-primary-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm font-semibold transition-transform hover:scale-110"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                onClick={onAvatarClick}
                title="Click for AI info"
              >
                A
              </motion.div>
            </div>

            {/* Loading Animation */}
            <ShimmerLoader />
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
});
