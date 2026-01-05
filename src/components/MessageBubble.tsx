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
import { marked } from 'marked';
import html2canvas from 'html2canvas';

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
      // PDF layout constants
      const pdfWidthMm = 210; // A4
      const pdfHeightMm = 297; // A4
      const marginMm = 15; // page margin
      const headerMm = 12; // header height
      const footerMm = 10; // footer height

      // Convert mm to CSS pixels (assume 96 DPI)
      const pxPerMm = 96 / 25.4;
      const scale = window.devicePixelRatio || 2;

      // Content width in mm and px
      const contentWidthMm = pdfWidthMm - marginMm * 2;
      const contentWidthPx = Math.round(contentWidthMm * pxPerMm);

      // Create off-screen container sized to the PDF content width
      const container = document.createElement('div');
      container.style.width = `${contentWidthPx}px`;
      container.style.padding = `${Math.round(8 * pxPerMm)}px`;
      container.style.background = '#ffffff';
      container.style.color = '#111827';
      container.style.fontFamily =
        'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      container.style.fontSize = `${Math.round((12 * pxPerMm) / pxPerMm)}px`;
      container.style.lineHeight = '1.6';
      container.style.boxSizing = 'border-box';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.zIndex = '-1';

      // Add minimal, print-friendly CSS
      const style = document.createElement('style');
      style.textContent = `
        .pdf-content { max-width: none; margin: 0; padding: 0; color: #111827; }
        .pdf-content h1, .pdf-content h2, .pdf-content h3 { color: #111827; }
        .pdf-content pre { white-space: pre-wrap; word-break: break-word; }
        .pdf-content table { width: 100%; border-collapse: collapse; }
        .pdf-content th, .pdf-content td { border: 1px solid #e5e7eb; padding: 6px 8px; }
        .pdf-content img { max-width: 100%; height: auto; }
        .no-break { page-break-inside: avoid; }
      `;

      // Render sanitized markdown into the container
      const safeMd = sanitizeMarkdown(message.content);
      const parsed = marked.parse(safeMd || '');
      const htmlContent = typeof parsed === 'string' ? parsed : await parsed;

      const contentDiv = document.createElement('div');
      contentDiv.className = 'pdf-content';
      contentDiv.innerHTML = htmlContent;

      // Try to mark large block elements to reduce awkward breaks
      Array.from(
        contentDiv.querySelectorAll('table, pre, blockquote, img')
      ).forEach((el) => {
        (el as HTMLElement).classList.add('no-break');
      });

      container.appendChild(style);
      container.appendChild(contentDiv);
      document.body.appendChild(container);

      // Allow images and fonts to settle
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Capture the container at a high scale for crisp output
      const canvas = await html2canvas(container, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Calculate page content height in pixels (excluding header/footer and margins)
      const pageContentHeightMm =
        pdfHeightMm - marginMm * 2 - headerMm - footerMm;
      const pageContentHeightPx = Math.floor(
        pageContentHeightMm * pxPerMm * scale
      );

      // Slice the canvas vertically into page-sized images with a small overlap to avoid seams
      const overlapPx = Math.max(2, Math.round(2 * scale));
      const slices: { dataUrl: string; heightMm: number }[] = [];
      const totalWidthPx = canvas.width;
      for (let y = 0; y < canvas.height; y += pageContentHeightPx - overlapPx) {
        const sliceHeightPx = Math.min(pageContentHeightPx, canvas.height - y);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = totalWidthPx;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas context');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          y,
          totalWidthPx,
          sliceHeightPx,
          0,
          0,
          totalWidthPx,
          sliceHeightPx
        );

        const dataUrl = sliceCanvas.toDataURL('image/png');
        const heightMm = sliceHeightPx / (pxPerMm * scale);
        slices.push({ dataUrl, heightMm });
      }

      // Build PDF from slices
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      });
      const contentX = marginMm;
      const contentWidth = contentWidthMm;

      for (let i = 0; i < slices.length; i++) {
        if (i > 0) pdf.addPage();

        // Header: white background and formatted date on the right
        pdf.setFillColor('#ffffff');
        pdf.rect(0, 0, pdfWidthMm, pdfHeightMm, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor('#6b7280');
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }).format(now);
        pdf.text(formatted, pdfWidthMm - marginMm, marginMm - 4 + 8, {
          align: 'right',
        });

        // Image content
        const img = slices[i];
        const imgHeight = img.heightMm;
        pdf.addImage(
          img.dataUrl,
          'PNG',
          contentX,
          marginMm + headerMm,
          contentWidth,
          imgHeight
        );

        // Footer with left 'Aeris' label and page number on the right
        const pageNum = i + 1;
        const totalPages = slices.length;
        pdf.setFontSize(9);
        pdf.setTextColor('#6b7280');
        pdf.text('Aeris', contentX, pdfHeightMm - 6);
        pdf.text(`Page ${pageNum} of ${totalPages}`, pdfWidthMm - marginMm, pdfHeightMm - 6, {
          align: 'right',
        });
      }

      // Trigger download
      pdf.save('aeris-response.pdf');

      // Cleanup
      if (document.body.contains(container))
        document.body.removeChild(container);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      // Fallback download as plain text
      try {
        const blob = new Blob([message.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aeris-response.txt';
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
