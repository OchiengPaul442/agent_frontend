'use client';

import { Message } from '@/types';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/utils/helpers';

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
      className="group w-full border-b border-gray-100 py-8"
    >
      <div className="mx-auto flex max-w-3xl gap-6 px-4 sm:px-6">
        {/* Message Content */}
        <div
          className={cn('flex-1 space-y-2', isUser ? 'flex justify-end' : '')}
        >
          <div
            className={cn(
              'prose prose-sm prose-slate max-w-none',
              'prose-p:my-2 prose-p:leading-7',
              'prose-headings:mb-4 prose-headings:mt-6 prose-headings:font-semibold',
              'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
              'prose-a:font-medium prose-a:text-blue-600 prose-a:no-underline',
              'hover:prose-a:text-blue-700 hover:prose-a:underline',
              'prose-strong:font-semibold prose-strong:text-gray-900',
              'prose-code:rounded prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5',
              'prose-code:font-mono prose-code:text-sm prose-code:text-gray-900',
              'prose-code:before:content-none prose-code:after:content-none',
              'prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-gray-900 prose-pre:p-4',
              'prose-pre:text-gray-100 prose-pre:shadow-lg',
              'prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6',
              'prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6',
              'prose-li:my-1 prose-li:leading-7',
              'prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4',
              'prose-blockquote:italic prose-blockquote:text-gray-700',
              'prose-img:rounded-lg prose-img:shadow-md',
              'prose-table:border-collapse prose-table:w-full',
              'prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-gray-900',
              'prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2',
              isUser
                ? 'inline-block max-w-[85%] rounded-3xl bg-gray-200 px-5 py-3.5 text-gray-900'
                : 'w-full text-gray-900'
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 no-underline transition-colors hover:text-blue-700 hover:underline"
                  >
                    {children}
                  </a>
                ),
                code: ({
                  inline,
                  className,
                  children,
                  ...props
                }: React.ComponentPropsWithoutRef<'code'> & {
                  inline?: boolean;
                }) => {
                  if (inline) {
                    return (
                      <code
                        className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-900"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className={cn(
                        'block overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100',
                        className
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Tools used indicator */}
          {message.tools_used && message.tools_used.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.tools_used.map((tool, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
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
