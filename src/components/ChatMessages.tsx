'use client';

import React, { useEffect, useRef, useImperativeHandle } from 'react';
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
      if (containerRef.current) {
        lastManualScrollRef.current = Date.now();
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
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
        if (containerRef.current) {
          isAutoScrolling.current = true;
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth',
          });
          setTimeout(() => (isAutoScrolling.current = false), 1000);
        }
        return;
      }

      // For assistant messages, only auto-scroll if streaming and user hasn't manually scrolled recently and is at bottom
      if (last.role === 'assistant' && last.isStreaming) {
        const timeSinceManualScroll = Date.now() - lastManualScrollRef.current;
        // Don't auto-scroll if user manually scrolled in the last 2 seconds or not at bottom
        if (timeSinceManualScroll > 2000 && isAtBottom) {
          if (containerRef.current) {
            isAutoScrolling.current = true;
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: 'smooth', // Smooth scroll during streaming
            });
            setTimeout(() => (isAutoScrolling.current = false), 1000);
          }
        }
        return;
      }

      // For other cases, only auto-scroll if the user was already near the bottom
      if (containerRef.current && isAtBottom) {
        isAutoScrolling.current = true;
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth', // Use 'smooth' for final scroll
        });
        setTimeout(() => (isAutoScrolling.current = false), 1000);
      }
    }, 10); // Reduced delay for faster response

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
          if (containerRef.current && isAtBottom) {
            isAutoScrolling.current = true;
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: 'smooth',
            });
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
              <MessageBubble
                key={key}
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
              />
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
