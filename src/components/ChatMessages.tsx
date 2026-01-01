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
      className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-white"
    >
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {messages.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex min-h-[500px] flex-col items-center justify-center text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl">
              <svg
                className="h-10 w-10"
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
            </div>
            <h2 className="mb-3 text-3xl font-bold text-slate-900">
              Air Quality AI Assistant
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-slate-600">
              Ask me about air quality anywhere in the world. I can provide
              real-time data, forecasts, health recommendations, and
              research-backed insights.
            </p>
            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
              {[
                "What's the air quality in Nairobi?",
                'Show me air quality forecast for London',
                'Health effects of PM2.5',
                'Compare air quality in major cities',
              ].map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onSendMessage?.(suggestion)}
                  className={cn(
                    'rounded-xl border-2 border-slate-200 bg-white px-5 py-4 text-left text-sm font-medium text-slate-700 transition-all hover:scale-105 hover:border-red-400 hover:shadow-lg active:scale-95'
                  )}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md">
              <AqLoading01 className="h-4 w-4 animate-spin" />
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-slate-400"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <AqAlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                Error sending message
              </p>
              <p className="mt-1 text-xs text-red-700">{error.message}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Try again
                </button>
              )}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
