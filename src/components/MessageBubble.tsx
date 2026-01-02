'use client';

import { Message } from '@/types';
import { motion } from 'framer-motion';
import { Streamdown } from 'streamdown';
import { cn } from '@/utils/helpers';
import { AqCopy01, AqCheckCircle, AqDownload01 } from '@airqo/icons-react';
import React, {
  useState,
  useRef,
  ComponentProps,
  ComponentPropsWithoutRef,
} from 'react';

interface MessageBubbleProps {
  message: Message;
}

type TableData = {
  headers: string[];
  rows: string[][];
};

const extractTableDataFromElement = (tableElement: HTMLElement): TableData => {
  const headers: string[] = [];
  const rows: string[][] = [];

  const headerCells = tableElement.querySelectorAll('thead th');
  for (const cell of headerCells) {
    headers.push(cell.textContent?.trim() || '');
  }

  const bodyRows = tableElement.querySelectorAll('tbody tr');
  for (const row of bodyRows) {
    const rowData: string[] = [];
    const cells = row.querySelectorAll('td');
    for (const cell of cells) {
      rowData.push(cell.textContent?.trim() || '');
    }
    rows.push(rowData);
  }

  return { headers, rows };
};

const tableDataToCSV = (data: TableData): string => {
  const { headers, rows } = data;
  const csvRows = [headers.join(','), ...rows.map((row) => row.join(','))];
  return csvRows.join('\n');
};

const tableDataToMarkdown = (data: TableData): string => {
  const { headers, rows } = data;
  const mdRows = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ];
  return mdRows.join('\n');
};

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

  const CustomTable = ({ children, ...props }: ComponentProps<'table'>) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const [tableCopied, setTableCopied] = useState(false);

    const handleTableCopy = async () => {
      if (!tableRef.current) return;
      const data = extractTableDataFromElement(tableRef.current);
      const md = tableDataToMarkdown(data);
      try {
        await navigator.clipboard.writeText(md);
        setTableCopied(true);
        setTimeout(() => setTableCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy table:', err);
      }
    };

    const handleTableDownload = () => {
      if (!tableRef.current) return;
      const data = extractTableDataFromElement(tableRef.current);
      const md = tableDataToMarkdown(data);
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'table.md';
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div
        className="my-4 flex flex-col space-y-2"
        data-streamdown="table-wrapper"
      >
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleTableCopy}
            className="p-1 text-gray-400 transition-colors hover:text-gray-200"
            title={tableCopied ? 'Copied!' : 'Copy table as Markdown'}
          >
            {tableCopied ? (
              <AqCheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AqCopy01 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleTableDownload}
            className="p-1 text-gray-400 transition-colors hover:text-gray-200"
            title="Download table as Markdown"
          >
            <AqDownload01 className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className="w-full border-collapse border border-gray-700"
            {...props}
          >
            {children}
          </table>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative w-full border-b border-gray-800 py-8"
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
              <div className="flex items-center gap-3 rounded-2xl border border-gray-700 bg-gray-800 p-3.5 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-900 to-blue-800">
                  <span className="text-2xl">
                    {getFileIcon(message.file.type)}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="m-0 truncate p-0 text-sm font-semibold text-gray-100">
                    {message.file.name}
                  </p>
                  <p className="m-0 p-0 text-xs text-gray-400">
                    {formatFileSize(message.file.size)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Text Content */}
          <div
            className={cn(
              'prose prose-sm prose-invert max-w-none',
              'prose-p:m-0 prose-p:leading-normal prose-p:text-gray-300',
              'prose-headings:mb-4 prose-headings:mt-6 prose-headings:font-semibold prose-headings:text-gray-100',
              'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
              'prose-a:font-medium prose-a:text-blue-400 prose-a:no-underline',
              'hover:prose-a:text-blue-300 hover:prose-a:underline',
              'prose-strong:font-semibold prose-strong:text-gray-100',
              'prose-code:rounded prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5',
              'prose-code:font-mono prose-code:text-sm prose-code:text-gray-200',
              'prose-code:before:content-none prose-code:after:content-none',
              'prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-gray-900 prose-pre:p-4',
              'prose-pre:text-gray-100 prose-pre:shadow-lg',
              'prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:text-gray-300',
              'prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-gray-300',
              'prose-li:my-1 prose-li:leading-7 prose-li:text-gray-300',
              'prose-blockquote:border-l-4 prose-blockquote:border-gray-600 prose-blockquote:pl-4',
              'prose-blockquote:italic prose-blockquote:text-gray-400',
              'prose-img:rounded-lg prose-img:shadow-md',
              'prose-table:border-collapse prose-table:w-full',
              'prose-th:border prose-th:border-gray-700 prose-th:bg-gray-800 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-gray-200',
              'prose-td:border prose-td:border-gray-700 prose-td:px-4 prose-td:py-2 prose-td:text-gray-300',
              isUser
                ? 'inline-block max-w-[85%] rounded-3xl bg-gray-700 px-5 py-3 text-gray-100'
                : 'w-full text-gray-300'
            )}
          >
            <Streamdown
              controls={false}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-400 no-underline transition-colors hover:text-blue-300 hover:underline"
                  >
                    {children}
                  </a>
                ),
                code: ({
                  inline,
                  className,
                  children,
                  ...props
                }: ComponentPropsWithoutRef<'code'> & {
                  inline?: boolean;
                }) => {
                  if (inline) {
                    return (
                      <code
                        className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-sm text-gray-200"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className={cn(
                        'block overflow-x-auto rounded-lg bg-black p-4 font-mono text-sm text-gray-100',
                        className
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                table: CustomTable,
              }}
            >
              {message.content}
            </Streamdown>
            {!isUser && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleCopy}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  title={copied ? 'Copied!' : 'Copy message'}
                >
                  {copied ? (
                    <AqCheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AqCopy01 className="h-4 w-4" />
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
