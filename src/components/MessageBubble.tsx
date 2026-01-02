'use client';

import { Message } from '@/types';
import { motion } from 'framer-motion';
import { Streamdown } from 'streamdown';
import { cn } from '@/utils/helpers';
import { AqCopy01, AqCheckCircle } from '@airqo/icons-react';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄';
  if (
    type.includes('csv') ||
    type.includes('excel') ||
    type.includes('spreadsheet')
  )
    return '📊';
  return '📎';
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative w-full border-b border-gray-100 py-8"
    >
      <div className="mx-auto flex max-w-3xl gap-6 px-4 sm:px-6">
        {/* Message Content */}
        <div
          className={cn(
            'flex-1 space-y-3',
            isUser ? 'flex flex-col items-end' : ''
          )}
        >
          {/* File Attachment - Show above text for user messages */}
          {isUser && message.file && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[320px]"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-50 to-blue-100">
                  <span className="text-2xl">
                    {getFileIcon(message.file.type)}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="m-0 truncate p-0 text-sm font-semibold text-gray-900">
                    {message.file.name}
                  </p>
                  <p className="m-0 p-0 text-xs text-gray-500">
                    {formatFileSize(message.file.size)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Text Content */}
          <div
            className={cn(
              'prose prose-sm prose-slate max-w-none',
              'prose-p:m-0 prose-p:leading-normal',
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
                ? 'inline-block max-w-[85%] rounded-3xl bg-gray-200 px-5 py-3 text-gray-900'
                : 'w-full text-gray-900'
            )}
          >
            <Streamdown
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
            </Streamdown>
            {!isUser && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleCopy}
                  className="rounded-lg p-2 hover:bg-gray-100"
                  title={copied ? 'Copied!' : 'Copy message'}
                >
                  {copied ? (
                    <AqCheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AqCopy01 className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
