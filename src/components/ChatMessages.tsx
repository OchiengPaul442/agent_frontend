'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { AqLoading01, AqAlertCircle } from '@airqo/icons-react';

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onSendMessage?: (message: string) => void;
}

export function ChatMessages({
  messages,
  isLoading = false,
  error = null,
  onRetry,
  onSendMessage,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div ref={containerRef} className="h-full overflow-y-auto bg-white">
      {messages.length === 0 && !isLoading && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <h2 className="text-3xl font-medium text-gray-800">
            What's on the agenda today?
          </h2>
        </div>
      )}

      <div>
        <AnimatePresence>
          {Array.isArray(messages) &&
            messages.map((message, index) => (
              <MessageBubble
                key={`${message.timestamp}-${index}`}
                message={message}
              />
            ))}
        </AnimatePresence>

        {isLoading && (
          <div className="w-full bg-gray-50 py-6">
            <div className="mx-auto flex max-w-4xl gap-6 px-4">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-blue-600 text-white">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-1 pt-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-gray-400"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="w-full bg-white py-6">
            <div className="mx-auto max-w-4xl px-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AqAlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">
                      Unable to process your request
                    </p>
                    <p className="mt-1 text-xs text-red-700">{error.message}</p>
                    {onRetry && (
                      <button
                        onClick={onRetry}
                        className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
