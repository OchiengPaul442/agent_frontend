'use client';

import { Message } from '@/types';
import { cn, formatDate } from '@/utils/helpers';
import { motion } from 'framer-motion';
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
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('w-full py-6', isUser ? 'bg-white' : 'bg-gray-50')}
    >
      <div className="mx-auto flex max-w-4xl gap-6 px-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-gray-800 text-white">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          ) : (
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
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 overflow-hidden">
          <div
            className={cn(
              'prose prose-sm max-w-none break-words text-gray-900',
              'prose-p:my-1 prose-p:leading-7',
              'prose-pre:bg-gray-900 prose-pre:text-gray-100',
              'prose-code:text-gray-900',
              'prose-headings:text-gray-900'
            )}
          >
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="my-1 leading-7 text-gray-900">{children}</p>
                ),
                code: (
                  props: React.ComponentProps<'code'> & { inline?: boolean }
                ) => {
                  const { inline, children, ...rest } = props;
                  return (
                    <code
                      {...rest}
                      className={cn(
                        'font-mono text-sm',
                        inline
                          ? 'rounded bg-gray-200 px-1 py-0.5 text-gray-900'
                          : 'block overflow-x-auto rounded-md bg-gray-900 p-4 text-gray-100'
                      )}
                    >
                      {children}
                    </code>
                  );
                },
                ul: ({ children }) => (
                  <ul className="my-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-7 text-gray-900">{children}</li>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Tools used indicator */}
          {message.tools_used && message.tools_used.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.tools_used.map((tool, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
