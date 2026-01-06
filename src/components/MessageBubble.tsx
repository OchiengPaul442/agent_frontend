'use client';

import { Message } from '@/types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/utils/helpers';
import { sanitizeMarkdown, stripMarkdown } from '@/utils/helpers';
import {
  AqCopy01,
  AqCheckCircle,
  AqEdit01,
  AqRefreshCw01,
  AqDownload01,
} from '@airqo/icons-react';
import React, { useState, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneLight,
  oneDark,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ThinkingDisplay } from './ThinkingDisplay';

interface MessageBubbleProps {
  message: Message;
  outerRefKey?: string;
  registerRef?: (key: string, el: HTMLDivElement | null) => void;
  onEdit?: (messageIndex: number, newContent: string) => void;
  messageIndex?: number;
  onRetry?: (messageIndex: number) => void;
  onFilePreview?: (file: {
    name: string;
    size: number;
    type: string;
    fileId?: string;
  }) => void;
  hasNextMessage?: boolean;
  isCanceled?: boolean;
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

  const [isDark, setIsDark] = React.useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  React.useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    try {
      mq.addEventListener('change', handler);
    } catch {
      mq.addListener(handler);
    }
    setIsDark(mq.matches);
    return () => {
      try {
        mq.removeEventListener('change', handler);
      } catch {
        mq.removeListener(handler);
      }
    };
  }, []);

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
      <div className="code-block-wrapper" style={{ paddingTop: '0.25rem' }}>
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

        <div className="overflow-x-auto" style={{ maxHeight: '60vh' }}>
          <SyntaxHighlighter
            style={isDark ? oneDark : oneLight}
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
  onFilePreview,
  hasNextMessage = false,
  isCanceled = false,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const outerRef = useRef<HTMLDivElement | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const copyTimeoutRef = useRef<number | null>(null);

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
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = async () => {
    try {
      // PDF configuration with professional layout
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;
      let pageNumber = 1;

      // Helper to add header on each page
      const addHeader = () => {
        pdf.setFontSize(9);
        pdf.setFont('times', 'normal');
        pdf.setTextColor(107, 114, 128); // #6b7280
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(now);
        pdf.text(formatted, pageWidth - margin, 15, { align: 'right' });
        return 25; // Start content after header
      };

      // Helper to add footer on each page
      const addFooter = () => {
        pdf.setFontSize(9);
        pdf.setFont('times', 'normal');
        pdf.setTextColor(107, 114, 128);
        pdf.text('Aeris-AQ', margin, pageHeight - 10);
        pdf.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 10, {
          align: 'right',
        });
      };

      // Helper to check if we need a new page
      const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - 25) {
          addFooter();
          pdf.addPage();
          pageNumber++;
          yPosition = addHeader();
        }
      };

      // Helper to safely render text with proper encoding
      const renderText = (
        text: string,
        x: number,
        y: number,
        maxWidth?: number,
        options?: { align?: 'left' | 'center' | 'right' }
      ) => {
        // Clean and normalize text to prevent encoding issues
        const cleanText = text
          .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();

        if (maxWidth) {
          const lines = pdf.splitTextToSize(cleanText, maxWidth);
          lines.forEach((line: string, index: number) => {
            pdf.text(line, x, y + index * 6, options);
          });
          return lines.length;
        } else {
          pdf.text(cleanText, x, y, options);
          return 1;
        }
      };

      // Parse markdown to structured content
      const parseMarkdown = (content: string) => {
        const lines = content.split('\n');
        const blocks: Array<{
          type: string;
          content: string;
          level?: number;
          items?: string[];
          language?: string;
          headers?: string[];
          rows?: string[][];
        }> = [];

        let i = 0;
        while (i < lines.length) {
          const line = lines[i];

          // Code blocks
          if (line.startsWith('```')) {
            const language = line.slice(3).trim() || 'text';
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
              codeLines.push(lines[i]);
              i++;
            }
            blocks.push({
              type: 'code',
              content: codeLines.join('\n'),
              language,
            });
            i++;
            continue;
          }

          // Tables
          if (
            line.includes('|') &&
            i + 1 < lines.length &&
            lines[i + 1].match(/^[\s]*\|[\s]*[-:]+[\s]*\|/)
          ) {
            const headers = line
              .split('|')
              .map((cell) => cell.trim())
              .filter((cell) => cell);
            const separator = lines[i + 1];
            if (headers.length > 0 && separator.includes('|')) {
              const tableRows: string[][] = [headers];
              i += 2; // Skip header and separator
              while (
                i < lines.length &&
                lines[i].includes('|') &&
                !lines[i].match(/^[\s]*\|[\s]*[-:]+[\s]*\|/)
              ) {
                const row = lines[i]
                  .split('|')
                  .map((cell) => cell.trim())
                  .filter((cell) => cell);
                if (row.length === headers.length) {
                  tableRows.push(row);
                }
                i++;
              }
              blocks.push({
                type: 'table',
                content: '',
                headers,
                rows: tableRows.slice(1), // Exclude headers from rows
              });
              continue;
            }
          }

          // Headers
          const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
          if (headerMatch) {
            blocks.push({
              type: 'header',
              level: headerMatch[1].length,
              content: headerMatch[2],
            });
            i++;
            continue;
          }

          // Lists
          if (line.match(/^[\s]*[-*+]\s+/) || line.match(/^[\s]*\d+\.\s+/)) {
            const listItems: string[] = [];
            while (
              i < lines.length &&
              (lines[i].match(/^[\s]*[-*+]\s+/) ||
                lines[i].match(/^[\s]*\d+\.\s+/))
            ) {
              const itemContent = lines[i]
                .replace(/^[\s]*[-*+]\s+/, '')
                .replace(/^[\s]*\d+\.\s+/, '');
              listItems.push(itemContent);
              i++;
            }
            blocks.push({ type: 'list', content: '', items: listItems });
            continue;
          }

          // Empty line
          if (line.trim() === '') {
            i++;
            continue;
          }

          // Regular paragraph
          let paragraph = line;
          i++;
          while (
            i < lines.length &&
            lines[i].trim() !== '' &&
            !lines[i].match(/^#{1,6}\s/) &&
            !lines[i].match(/^[\s]*[-*+]\s+/) &&
            !lines[i].match(/^[\s]*\d+\.\s+/) &&
            !lines[i].startsWith('```') &&
            !lines[i].includes('|')
          ) {
            paragraph += ' ' + lines[i];
            i++;
          }
          blocks.push({ type: 'paragraph', content: paragraph });
        }

        return blocks;
      };

      // Render content
      const blocks = parseMarkdown(message.content);
      yPosition = addHeader();

      for (const block of blocks) {
        switch (block.type) {
          case 'header': {
            checkNewPage(15);
            const fontSize =
              block.level === 1 ? 16 : block.level === 2 ? 14 : 12;
            pdf.setFontSize(fontSize);
            pdf.setFont('times', 'bold');
            pdf.setTextColor(17, 24, 39);

            const cleanText = stripMarkdown(block.content);
            const lineCount = renderText(
              cleanText,
              margin,
              yPosition,
              contentWidth
            );
            yPosition += lineCount * (block.level === 1 ? 8 : 7) + 3;
            break;
          }

          case 'paragraph': {
            checkNewPage(10);
            pdf.setFontSize(11);
            pdf.setFont('times', 'normal');
            pdf.setTextColor(55, 65, 81);

            const cleanText = stripMarkdown(block.content);
            const lineCount = renderText(
              cleanText,
              margin,
              yPosition,
              contentWidth
            );
            yPosition += lineCount * 6 + 2;
            break;
          }

          case 'list': {
            checkNewPage(10);
            pdf.setFontSize(11);
            pdf.setFont('times', 'normal');
            pdf.setTextColor(55, 65, 81);

            block.items?.forEach((item) => {
              const cleanText = stripMarkdown(item);
              const lines = pdf.splitTextToSize(cleanText, contentWidth - 6);
              checkNewPage(6 * lines.length);

              lines.forEach((line: string, idx: number) => {
                if (idx === 0) {
                  pdf.text('•', margin, yPosition);
                }
                pdf.text(line, margin + 6, yPosition);
                yPosition += 6;
              });
            });
            yPosition += 2;
            break;
          }

          case 'code': {
            const codeLines = block.content.split('\n');
            const estimatedHeight = codeLines.length * 5 + 15;
            checkNewPage(estimatedHeight);

            // Code block header
            pdf.setFillColor(249, 250, 251);
            pdf.rect(margin, yPosition - 3, contentWidth, 8, 'F');
            pdf.setFontSize(9);
            pdf.setFont('times', 'bold');
            pdf.setTextColor(75, 85, 99);
            pdf.text(block.language || 'code', margin + 2, yPosition + 2);
            yPosition += 8;

            // Code content
            pdf.setFillColor(249, 250, 251);
            const codeBlockHeight = codeLines.length * 5 + 4;
            pdf.rect(margin, yPosition - 2, contentWidth, codeBlockHeight, 'F');

            pdf.setFontSize(9);
            pdf.setFont('courier', 'normal');
            pdf.setTextColor(17, 24, 39);

            codeLines.forEach((codeLine) => {
              checkNewPage(5);
              const displayLine = codeLine.substring(0, 90);
              renderText(displayLine, margin + 2, yPosition);
              yPosition += 5;
            });
            yPosition += 6;
            break;
          }

          case 'table': {
            if (block.headers && block.rows) {
              checkNewPage(20);

              const tableData = block.rows.map((row) =>
                row.map((cell) => stripMarkdown(cell))
              );

              autoTable(pdf, {
                head: [block.headers.map((h) => stripMarkdown(h))],
                body: tableData,
                startY: yPosition,
                margin: { left: margin, right: margin },
                styles: {
                  font: 'times',
                  fontSize: 9,
                  cellPadding: 2,
                  lineColor: [229, 231, 235],
                  lineWidth: 0.1,
                },
                headStyles: {
                  fillColor: [243, 244, 246],
                  textColor: [17, 24, 39],
                  fontStyle: 'bold',
                  halign: 'left',
                },
                bodyStyles: {
                  textColor: [55, 65, 81],
                },
                alternateRowStyles: {
                  fillColor: [249, 250, 251],
                },
                theme: 'grid',
              });

              yPosition = (pdf as any).lastAutoTable.finalY + 5;
            }
            break;
          }
        }
      }

      // Add footer to last page
      addFooter();

      // Save the PDF
      pdf.save('aeris-aq-response.pdf');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      // Fallback download as plain text
      try {
        const blob = new Blob([message.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aeris-aq-response.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (fallbackErr) {
        console.error('Fallback download failed:', fallbackErr);
      }
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
                  'border-border hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 shadow-sm transition-colors',
                  'file-preview',
                  isUser ? 'file-preview-user' : 'bg-card'
                )}
                onClick={() => onFilePreview && onFilePreview(message.file!)}
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
              'prose-p:my-3 prose-p:leading-relaxed prose-p:text-foreground prose-p:text-sm',
              'prose-headings:my-4 prose-headings:font-semibold prose-headings:text-foreground',
              'prose-h1:text-lg prose-h1:mt-6 prose-h1:mb-4',
              'prose-h2:text-base prose-h2:mt-5 prose-h2:mb-3',
              'prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2',
              'prose-a:font-medium prose-a:text-primary prose-a:no-underline',
              'hover:prose-a:text-primary/80 hover:prose-a:underline',
              'prose-strong:font-semibold prose-strong:text-foreground',
              'prose-code:before:content-none prose-code:after:content-none',
              'prose-pre:hidden', // Hide default pre tags since we use custom CodeBlock
              '[&_ul]:text-foreground [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-sm',
              '[&_ol]:text-foreground [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ol]:text-sm',
              '[&_li]:text-foreground [&_li]:marker:text-foreground [&_li]:leading-relaxed',
              '[&_ol_li]:list-decimal [&_ul_li]:list-disc',
              'prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:my-3',
              'prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:text-sm',
              'prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full',
              'prose-table:border-collapse prose-table:w-full prose-table:text-sm',
              'prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground',
              'prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-foreground',
              '[&_.not-prose]:max-w-full [&_.not-prose]:overflow-x-auto',
              message.isError && 'text-red-600! dark:text-red-400!',
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
                      <div className="my-4 overflow-x-auto">
                        <table
                          className="border-border w-full border-collapse border text-sm"
                          {...props}
                        >
                          {children}
                        </table>
                      </div>
                    ),
                  }}
                >
                  {sanitizeMarkdown(message.content)}
                </ReactMarkdown>

                {/* Display thinking steps if available */}
                {!isUser &&
                  message.thinking_steps &&
                  message.thinking_steps.length > 0 && (
                    <div className="mt-4">
                      <ThinkingDisplay
                        thinking={message.thinking_steps}
                        isStreaming={message.isStreaming}
                        duration={message.thinking_duration || 0}
                        defaultExpanded={true}
                      />
                    </div>
                  )}

                {/* Streaming cursor indicator */}
                {message.isStreaming && (
                  <span className="bg-foreground ml-0.5 inline-block h-5 w-0.5 animate-pulse align-middle" />
                )}
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
                  {(hasNextMessage || isCanceled) && (
                    <button
                      onClick={() => onRetry?.(messageIndex!)}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-lg p-2 transition-colors"
                      title="Retry message"
                    >
                      <AqRefreshCw01 className="h-4 w-4" />
                    </button>
                  )}
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
                    onClick={() => onRetry?.(messageIndex!)}
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
                  <button
                    onClick={handleDownload}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-lg p-2 transition-colors"
                    title="Download as PDF"
                  >
                    <AqDownload01 className="h-4 w-4" />
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
