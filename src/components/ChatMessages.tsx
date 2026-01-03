'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ConfirmDialog } from './ConfirmDialog';
import { Message } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onEditMessage?: (messageIndex: number, newContent: string) => void;
}

export function ChatMessages({
  messages,
  isLoading = false,
  error = null,
  onRetry,
  onEditMessage,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Smooth scroll helper that animates scroll to target over `duration` ms.
  const smoothScrollTo = (
    el: HTMLElement | null,
    duration = 800,
    offset = 20
  ) => {
    if (!el || !containerRef.current) return;
    const container = containerRef.current;
    const start = container.scrollTop;
    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const target = start + rect.top - containerRect.top - offset;
    const distance = target - start;
    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now: number) => {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const progress = easeInOutCubic(elapsed);
      container.scrollTo(0, Math.round(start + distance * progress));
      if (elapsed < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

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

  useEffect(() => {
    if (error) {
      setShowErrorDialog(true);
    }
  }, [error]);

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
              />
            );
          })}
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

      {error && (
        <ConfirmDialog
          isOpen={showErrorDialog}
          onClose={() => setShowErrorDialog(false)}
          onConfirm={onRetry || (() => setShowErrorDialog(false))}
          title="Unable to process your request"
          message={error.message}
          confirmText={onRetry ? 'Try Again' : 'OK'}
          cancelText="Close"
          type="danger"
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
