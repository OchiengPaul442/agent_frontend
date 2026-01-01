'use client';

import { Message } from '@/types';
import { cn, formatDate } from '@/utils/helpers';
import { motion } from 'framer-motion';
import { AqUser01 } from '@airqo/icons-react';
import ReactMarkdown from 'react-markdown';

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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg">
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
      )}

      <div
        className={cn(
          'group relative max-w-[85%] rounded-3xl px-6 py-4 shadow-lg transition-all hover:shadow-xl',
          isUser
            ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/25'
            : 'border border-slate-200/50 bg-white/80 text-slate-900 backdrop-blur-sm'
        )}
      >
        {/* Message content with improved typography */}
        <div
          className={cn(
            'prose prose-sm max-w-none break-words',
            isUser
              ? 'prose-invert prose-p:my-2 prose-headings:text-white prose-headings:font-semibold'
              : 'prose prose-p:my-2 prose-headings:text-slate-900 prose-headings:font-semibold'
          )}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="leading-relaxed">{children}</p>
              ),
              code: (
                props: React.ComponentProps<'code'> & { inline?: boolean }
              ) => {
                const { inline, children, ...rest } = props;
                return (
                  <code
                    {...rest}
                    className={cn(
                      'rounded-md px-1.5 py-0.5 font-mono text-sm',
                      inline
                        ? isUser
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-800'
                        : 'block overflow-x-auto bg-slate-900 p-4 text-slate-100'
                    )}
                  >
                    {children}
                  </code>
                );
              },
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
              isUser ? 'text-amber-100' : 'text-slate-500'
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
                    : 'bg-amber-100 text-amber-700'
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 shadow-md">
          <AqUser01 className="h-5 w-5" />
        </div>
      )}
    </motion.div>
  );
}
