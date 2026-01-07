'use client';

import React, { useEffect, useRef, useImperativeHandle } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  onRetry?: (messageIndex: number) => void;
  onEditMessage?: (messageIndex: number, newContent: string) => void;
  onFilePreview?: (file: {
    name: string;
    size: number;
    type: string;
    fileId?: string;
  }) => void;
}

export const ChatMessages = React.forwardRef(function ChatMessages(
  {
    messages,
    isLoading = false,
    onRetry,
    onEditMessage,
    onFilePreview,
    onViewportChange,
  }: ChatMessagesProps & { onViewportChange?: (isAtBottom: boolean) => void },
  ref
) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isAtBottom, setIsAtBottom] = React.useState(true);

  // Expose imperative methods so parent can request a scroll-to-bottom
  React.useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    },
    scrollToMessageKey: (key: string) => {
      const el = messageRefs.current[key];
      if (el && containerRef.current) {
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
    const lastKey = `${last.timestamp}-${lastIdx}`;

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      // If the assistant started streaming, always scroll that message into view
      if (last.role === 'assistant' && last.isStreaming) {
        const el = messageRefs.current[lastKey];
        if (el && containerRef.current) {
          containerRef.current.scrollTo({
            top: el.offsetTop - 12,
            behavior: 'smooth',
          });
          return;
        }
      }

      // Otherwise, only auto-scroll if the user was already near the bottom
      if (containerRef.current && isAtBottom) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [messages, isLoading, isAtBottom]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
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
                onFilePreview={onFilePreview}
                hasNextMessage={hasNextMessage}
                isCanceled={isCanceled}
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
          <div className="mx-auto max-w-3xl px-2 sm:px-4 lg:px-6">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="bg-primary h-2 w-2 rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
});
