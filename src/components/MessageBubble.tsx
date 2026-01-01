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
      transition={{ duration: 0.3 }}
      className={cn(
        'flex w-full gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md">
          <AqStar01 className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          'group relative max-w-[80%] rounded-2xl px-4 py-3 shadow-sm transition-all hover:shadow-md',
          isUser
            ? 'bg-red-500 text-white'
            : 'border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
        )}
      >
        <div
          className={cn(
            'prose prose-sm max-w-none',
            isUser ? 'prose-invert' : 'prose-slate dark:prose-invert'
          )}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {message.timestamp && (
          <div
            className={cn(
              'mt-2 text-xs',
              isUser ? 'text-red-100' : 'text-slate-500 dark:text-slate-400'
            )}
          >
            {formatDate(message.timestamp)}
          </div>
        )}

        {message.tools_used && message.tools_used.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.tools_used.map((tool, index) => (
              <span
                key={index}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-300">
          <AqUser01 className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}
