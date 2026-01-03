'use client';

import { Message } from '@/types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/utils/helpers';
import { sanitizeMarkdown } from '@/utils/helpers';
import {
  AqCopy01,
  AqCheckCircle,
  AqDownload01,
  AqEdit01,
  AqRefreshCw01,
} from '@airqo/icons-react';
import React, { useState, useRef, ComponentProps } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
  message: Message;
  outerRefKey?: string;
  registerRef?: (key: string, el: HTMLDivElement | null) => void;
  onEdit?: (messageIndex: number, newContent: string) => void;
  messageIndex?: number;
  onRetry?: () => void;
}

const CodeBlock = React.memo(function CodeBlock({
  inline,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  inline?: boolean;
  className?: string;
}) {
  const [codeCopied, setCodeCopied] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);
  const codeContent = String(children).replace(/\n$/, '');

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCodeCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCodeCopied(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [codeContent]);

  if (inline) {
    return (
      <code
        className="text-foreground rounded bg-transparent px-1.5 py-0.5 font-mono text-sm"
        {...props}
      >
        {children}
      </code>
    );
  }

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  return (
    <div className="not-prose my-4">
      <div className="code-block-wrapper">
        <div className="code-block-header">
          <div className="code-block-label">{language}</div>
          <div>
            <button
              onClick={handleCodeCopy}
              className="text-muted-foreground hover:text-foreground flex items-center rounded px-2 py-1 text-xs font-medium transition-colors"
              title={codeCopied ? 'Copied!' : 'Copy code'}
              type="button"
            >
              {codeCopied ? (
                <AqCheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AqCopy01 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <SyntaxHighlighter
            style={oneLight}
            language={language}
            PreTag="div"
            className="!mt-0 !mb-0"
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
            }}
            codeTagProps={{
              style: {
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              },
            }}
          >
            {codeContent}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
});

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

const getFilePreviewSrc = (file?: { type?: string; name?: string } | null) => {
  if (!file) return '/file-unknown.svg';
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (type.includes('pdf') || name.endsWith('.pdf')) return '/file-pdf.svg';
  if (type.includes('csv') || name.endsWith('.csv')) return '/file-csv.svg';
  if (
    type.includes('excel') ||
    type.includes('spreadsheet') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx')
  )
    return '/file-xlsx.svg';
  return '/file-unknown.svg';
};

export function MessageBubble({
  message,
  outerRefKey,
  registerRef,
  onEdit,
  messageIndex,
  onRetry,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const outerRef = useRef<HTMLDivElement | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const setOuterRef = (el: HTMLDivElement | null) => {
    outerRef.current = el;
    if (outerRefKey && registerRef) {
      registerRef(outerRefKey, el);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
    setTimeout(() => {
      editTextareaRef.current?.focus();
      editTextareaRef.current?.setSelectionRange(
        editTextareaRef.current.value.length,
        editTextareaRef.current.value.length
      );
    }, 0);
  };

  const handleSaveEdit = () => {
    if (
      editContent.trim() &&
      editContent !== message.content &&
      onEdit &&
      messageIndex !== undefined
    ) {
      onEdit(messageIndex, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
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
      ref={setOuterRef}
      className="group relative w-full py-4 sm:py-8"
    >
      <div className="mx-auto flex max-w-3xl gap-3 px-2 sm:gap-6 sm:px-4 lg:px-6">
        <div
          className={cn(
            'min-w-0 flex-1 space-y-3', // min-w-0 allows flex item to shrink
            isUser ? 'flex flex-col items-end' : ''
          )}
        >
          {message.file && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={cn('w-full max-w-[320px]', isUser ? '' : '')}
            >
              <div
                className={cn(
                  'border-border flex items-center gap-3 rounded-2xl border p-3.5 shadow-sm',
                  'file-preview',
                  isUser ? 'file-preview-user' : 'bg-card'
                )}
              >
                <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                  <Image
                    src={getFilePreviewSrc(message.file)}
                    alt={message.file.name || 'file'}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
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

          <div
            className={cn(
              'prose prose-sm max-w-none overflow-x-hidden',
              'prose-p:my-4 prose-p:leading-relaxed prose-p:text-foreground',
              'prose-headings:my-6 prose-headings:font-bold prose-headings:text-[var(--text-accent)]',
              'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
              'prose-a:font-medium prose-a:text-primary prose-a:no-underline',
              'hover:prose-a:text-primary/80 hover:prose-a:underline',
              'prose-strong:font-bold prose-strong:text-[var(--text-accent)]',
              'prose-code:before:content-none prose-code:after:content-none',
              'prose-pre:hidden', // Hide default pre tags since we use custom CodeBlock
              '[&_ul]:text-foreground [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6',
              '[&_ol]:text-foreground [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6',
              '[&_li]:text-foreground [&_li]:marker:text-foreground [&_li]:my-2 [&_li]:leading-7',
              '[&_ol_li]:list-decimal [&_ul_li]:list-disc',
              'prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4',
              'prose-blockquote:italic prose-blockquote:text-muted-foreground',
              'prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full',
              'prose-table:border-collapse prose-table:w-full',
              'prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground',
              'prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2 prose-td:text-foreground',
              '[&_.not-prose]:max-w-full [&_.not-prose]:overflow-x-auto',
              isUser
                ? isEditing
                  ? 'w-full rounded-3xl bg-[var(--bg-tertiary)] px-5 py-3 text-[var(--text-primary)]'
                  : 'inline-block max-w-[85%] rounded-3xl bg-[var(--bg-tertiary)] px-5 py-3 text-[var(--text-primary)]'
                : 'w-full rounded-3xl px-5 py-3 text-[var(--text-primary)]'
            )}
          >
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  ref={editTextareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full resize-none border-0 bg-transparent p-0 text-base break-words whitespace-pre-wrap focus:outline-none"
                  rows={Math.max(1, editContent.split('\n').length)}
                  style={{ minHeight: '24px', height: 'auto', width: '100%' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="text-muted-foreground hover:text-foreground text-sm underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={
                      !editContent.trim() || editContent === message.content
                    }
                    className="bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground rounded px-3 py-1 text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({
                      href,
                      children,
                      ...props
                    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 font-medium no-underline transition-colors hover:underline"
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    code: CodeBlock,
                    table: ({
                      children,
                      ...props
                    }: React.TableHTMLAttributes<HTMLTableElement>) => (
                      <CustomTable {...props}>{children}</CustomTable>
                    ),
                  }}
                >
                  {sanitizeMarkdown(message.content)}
                </ReactMarkdown>
              </>
            )}
          </div>

          {/* Action buttons outside the message bubble, on the right */}
          {!isEditing && (
            <div className="mt-2 flex items-center justify-end gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {isUser && (
                <>
                  <button
                    onClick={handleEdit}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-lg p-2 transition-colors"
                    title="Edit message"
                  >
                    <AqEdit01 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-lg p-2 transition-colors"
                    title={copied ? 'Copied!' : 'Copy message'}
                  >
                    {copied ? (
                      <AqCheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AqCopy01 className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
              {!isUser && (
                <>
                  <button
                    onClick={onRetry}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-lg p-2 transition-colors"
                    title="Retry response"
                  >
                    <AqRefreshCw01 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-lg p-2 transition-colors"
                    title={copied ? 'Copied!' : 'Copy message'}
                  >
                    {copied ? (
                      <AqCheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AqCopy01 className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
