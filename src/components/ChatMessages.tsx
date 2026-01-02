'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function ChatMessages({
  messages,
  isLoading = false,
  error = null,
  onRetry,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto">
      <AnimatePresence mode="popLayout">
        {Array.isArray(messages) &&
          messages.map((message, index) => (
            <MessageBubble
              key={`${message.timestamp}-${index}`}
              message={message}
            />
          ))}
      </AnimatePresence>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full py-8"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="bg-foreground h-2 w-2 rounded-full"
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

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full py-8"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="border-destructive bg-destructive/10 rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="text-destructive mt-0.5 h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-destructive text-sm font-semibold">
                    Unable to process your request
                  </p>
                  <p className="text-destructive/80 mt-1 text-sm">
                    {error.message}
                  </p>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive mt-3 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
