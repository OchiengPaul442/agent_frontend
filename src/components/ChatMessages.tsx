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
}

export function ChatMessages({
  messages,
  isLoading = false,
  error = null,
  onRetry,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (error) {
      setShowErrorDialog(true);
    }
  }, [error]);

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
