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
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
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
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            title="Download table as Markdown"
          >
            <AqDownload01 className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            className="border-border w-full border-collapse border"
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
      className="group relative w-full py-8"
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
              <div className="border-border bg-card flex items-center gap-3 rounded-2xl border p-3.5 shadow-sm">
                <div className="bg-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                  <span className="text-2xl">
                    {getFileIcon(message.file.type)}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-card-foreground m-0 truncate p-0 text-sm font-semibold">
                    {message.file.name}
                  </p>
                  <p className="text-muted-foreground m-0 p-0 text-xs">
                    {formatFileSize(message.file.size)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Text Content */}
          <div
            className={cn(
              'prose prose-sm max-w-none',
              'prose-p:my-4 prose-p:leading-relaxed prose-p:text-foreground',
              'prose-headings:my-6 prose-headings:font-bold prose-headings:text-[var(--text-accent)]',
              'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
              'prose-a:font-medium prose-a:text-primary prose-a:no-underline',
              'hover:prose-a:text-primary/80 hover:prose-a:underline',
              'prose-strong:font-bold prose-strong:text-[var(--text-accent)]',
              'prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5',
              'prose-code:font-mono prose-code:text-sm prose-code:text-foreground',
              'prose-code:before:content-none prose-code:after:content-none',
              'prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-muted prose-pre:p-4',
              'prose-pre:text-foreground prose-pre:shadow-lg',
              '[&_ul]:text-foreground [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6',
              '[&_ol]:text-foreground [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6',
              '[&_li]:text-foreground [&_li]:marker:text-foreground [&_li]:my-2 [&_li]:leading-7',
              '[&_ol_li]:list-decimal [&_ul_li]:list-disc',
              'prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4',
              'prose-blockquote:italic prose-blockquote:text-muted-foreground',
              'prose-img:rounded-lg prose-img:shadow-md',
              'prose-table:border-collapse prose-table:w-full',
              'prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground',
              'prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-foreground',
              isUser
                ? 'inline-block max-w-[85%] rounded-3xl bg-[var(--bg-tertiary)] px-5 py-3 text-[var(--text-primary)]'
                : 'w-full rounded-3xl px-5 py-3 text-[var(--text-primary)]'
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
                    className="text-primary hover:text-primary/80 font-medium no-underline transition-colors hover:underline"
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
                        className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code
                      className={cn(
                        'bg-muted text-foreground block overflow-x-auto rounded-lg p-4 font-mono text-sm',
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
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors"
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
