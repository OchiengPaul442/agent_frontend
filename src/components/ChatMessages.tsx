'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';
import { cn } from '@/utils/helpers';
import { AqLoading01, AqAlertCircle } from '@airqo/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div
      ref={containerRef}
      className="from-secondary-50/50 to-primary-50/20 flex-1 overflow-y-auto bg-gradient-to-br via-white"
    >
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        {messages.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[60vh] flex-col items-center justify-center text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="from-primary-400 via-primary-500 to-primary-600 mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-2xl"
            >
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="gradient-text mb-4 text-4xl font-bold">
                Air Quality AI Assistant
              </h2>
              <p className="text-secondary-600 mx-auto mb-12 max-w-2xl text-lg leading-relaxed">
                Get real-time air quality data, health insights, and expert
                analysis for any location worldwide. Upload documents for
                specialized analysis or ask questions about air pollution
                trends.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid max-w-3xl gap-4 sm:grid-cols-2"
            >
              {[
                "What's the air quality in Nairobi right now?",
                'Show me PM2.5 trends for London this week',
                'Health effects of ozone pollution',
                'Compare air quality in major US cities',
              ].map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  onClick={() => onSendMessage?.(suggestion)}
                  className="group border-secondary-200 text-secondary-700 hover:border-primary-300 hover:bg-primary-50/50 focus-ring rounded-2xl border-2 bg-white p-6 text-left text-sm font-medium shadow-sm transition-all hover:scale-105 hover:shadow-xl"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary-100 text-primary-600 group-hover:bg-primary-200 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <span className="leading-relaxed">{suggestion}</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-12 text-center"
            >
              <p className="text-secondary-500 text-sm">
                💡 <strong>Pro tip:</strong> Upload CSV or Excel files for
                detailed analysis
              </p>
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
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
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-4"
          >
            <div className="from-primary-400 to-primary-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg">
              <AqLoading01 className="h-5 w-5 animate-spin" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="bg-primary-400 h-3 w-3 rounded-full"
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
              <p className="text-secondary-500 text-sm">
                Analyzing air quality data...
              </p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50/50 p-6 backdrop-blur-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AqAlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="mb-2 text-base font-semibold text-red-900">
                Unable to process your request
              </p>
              <p className="mb-4 text-sm text-red-700">{error.message}</p>
              {onRetry && (
                <motion.button
                  onClick={onRetry}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="focus-ring rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700"
                >
                  Try Again
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
