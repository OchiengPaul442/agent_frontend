'use client';

import React, { useEffect, useRef } from 'react';
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
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const lastManualScrollRef = useRef<number>(0);
  const isAutoScrolling = useRef(false);
  const wasLoadingRef = useRef(false);

  // Expose imperative methods so parent can request a scroll-to-bottom
  React.useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    },
    scrollToMessageKey: (key: string) => {
      const el = messageRefs.current[key];
      if (el && containerRef.current) {
        lastManualScrollRef.current = Date.now();
        containerRef.current.scrollTo({
          top: el.offsetTop - 12,
          behavior: 'smooth',
        });
      }
    },
  }));

  // Notify parent when scroll position changes (near bottom or not)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = () => {
      const distanceToBottom =
        el.scrollHeight - (el.scrollTop + el.clientHeight);
      const nowAtBottom = distanceToBottom < 100; // increased threshold
      if (nowAtBottom !== isAtBottom) {
        setIsAtBottom(nowAtBottom);
        onViewportChange?.(nowAtBottom);
      }
      if (!isAutoScrolling.current) {
        lastManualScrollRef.current = Date.now();
      }
    };

    el.addEventListener('scroll', handler, { passive: true });
    // initialize immediately
    handler();
    return () => el.removeEventListener('scroll', handler as EventListener);
  }, [isAtBottom, onViewportChange]);

  // Also check scroll position when messages change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      const distanceToBottom =
        el.scrollHeight - (el.scrollTop + el.clientHeight);
      const nowAtBottom = distanceToBottom < 100;
      if (nowAtBottom !== isAtBottom) {
        setIsAtBottom(nowAtBottom);
        onViewportChange?.(nowAtBottom);
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [messages.length, isAtBottom, onViewportChange]);

  useEffect(() => {
    // Scroll behavior when new messages are added
    if (!Array.isArray(messages) || messages.length === 0) return;

    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      // Always auto-scroll for new user messages (when user enters a prompt)
      if (last.role === 'user') {
        isAutoScrolling.current = true;
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => (isAutoScrolling.current = false), 1000);
        return;
      }

      // For assistant messages, only auto-scroll if streaming and user hasn't manually scrolled recently
      if (last.role === 'assistant' && last.isStreaming) {
        const timeSinceManualScroll = Date.now() - lastManualScrollRef.current;
        // Don't auto-scroll if user manually scrolled in the last 2 seconds
        if (timeSinceManualScroll > 2000) {
          isAutoScrolling.current = true;
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => (isAutoScrolling.current = false), 1000);
        }
        return;
      }

      // For other cases, only auto-scroll if the user was already near the bottom
      if (isAtBottom) {
        isAutoScrolling.current = true;
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => (isAutoScrolling.current = false), 1000);
      }
    }, 50); // Delay for DOM update

    return () => clearTimeout(timeoutId);
  }, [messages, isLoading, isAtBottom]);

  // Auto-scroll when API response completes (loading finishes and streaming stops)
  useEffect(() => {
    // Track when loading state changes from true to false
    if (wasLoadingRef.current && !isLoading) {
      // Loading just completed
      const lastMessage = messages[messages.length - 1];

      // Check if the last message has finished streaming
      if (
        lastMessage &&
        lastMessage.role === 'assistant' &&
        !lastMessage.isStreaming
      ) {
        // API response is complete and typewriter animation finished
        setTimeout(() => {
          if (isAtBottom) {
            isAutoScrolling.current = true;
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => (isAutoScrolling.current = false), 800);
          }
        }, 100); // Small delay to ensure DOM has updated with any images/charts
      }
    }

    // Update the ref for next comparison
    wasLoadingRef.current = isLoading;
  }, [isLoading, messages, isAtBottom]);

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
