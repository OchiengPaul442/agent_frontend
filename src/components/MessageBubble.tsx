'use client';

import { Message } from '@/types';
import { cn, formatDate } from '@/utils/helpers';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { AqUser01, AqStar01 } from '@airqo/icons-react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex w-full gap-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="from-primary-400 to-primary-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg">
          <AqStar01 className="h-5 w-5" />
        </div>
      )}

      <div
        className={cn(
          'group relative max-w-[85%] rounded-3xl px-6 py-4 shadow-lg transition-all hover:shadow-xl',
          isUser
            ? 'from-primary-500 to-primary-600 shadow-primary-500/25 bg-gradient-to-br text-white'
            : 'glass border-secondary-200/50 text-secondary-900 border bg-white/80 backdrop-blur-sm'
        )}
      >
        {/* Message content with improved typography */}
        <div
          className={cn(
            'prose prose-sm max-w-none break-words',
            isUser
              ? 'prose-invert prose-p:my-2 prose-headings:text-white prose-headings:font-semibold'
              : 'prose-secondary prose-p:my-2 prose-headings:text-secondary-900 prose-headings:font-semibold'
          )}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="leading-relaxed">{children}</p>
              ),
              code: ({ inline, children }) => (
                <code
                  className={cn(
                    'rounded-md px-1.5 py-0.5 font-mono text-sm',
                    inline
                      ? isUser
                        ? 'bg-white/20 text-white'
                        : 'bg-secondary-100 text-secondary-800'
                      : 'bg-secondary-900 text-secondary-100 block overflow-x-auto p-4'
                  )}
                >
                  {children}
                </code>
              ),
              ul: ({ children }) => <ul className="space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Timestamp with better styling */}
        {message.timestamp && (
          <div
            className={cn(
              'mt-3 text-xs opacity-70',
              isUser ? 'text-primary-100' : 'text-secondary-500'
            )}
          >
            {formatDate(message.timestamp)}
          </div>
        )}

        {/* Tools used indicator */}
        {message.tools_used && message.tools_used.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {message.tools_used.map((tool, index) => (
              <span
                key={index}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                  isUser
                    ? 'bg-white/20 text-white'
                    : 'bg-primary-100 text-primary-700'
                )}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-current opacity-60"></div>
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="bg-secondary-200 text-secondary-700 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-md">
          <AqUser01 className="h-5 w-5" />
        </div>
      )}
    </motion.div>
  );
}
