'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  onRetry?: () => void;
  onEditMessage?: (messageIndex: number, newContent: string) => void;
}

export function ChatMessages({
  messages,
  isLoading = false,
  onRetry,
  onEditMessage,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Scroll to bottom when new messages are added or loading state changes
    if (!Array.isArray(messages) || messages.length === 0) return;

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto">
      <AnimatePresence mode="popLayout">
        {Array.isArray(messages) &&
          messages.map((message, index) => {
            const key = `${message.timestamp}-${index}`;
            return (
              <MessageBubble
                key={key}
                message={message}
                outerRefKey={key}
                registerRef={(k, el) => (messageRefs.current[k] = el)}
                onEdit={onEditMessage}
                messageIndex={index}
                onRetry={onRetry}
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
}
