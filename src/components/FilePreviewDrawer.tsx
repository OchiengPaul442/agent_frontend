'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AqX, AqFile02 } from '@airqo/icons-react';
import Image from 'next/image';
import * as XLSX from 'xlsx';
import { cn } from '@/utils/helpers';

interface FilePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  width: number;
  onWidthChange: (width: number) => void;
}

export function FilePreviewDrawer({
  isOpen,
  onClose,
  file,
  width,
  onWidthChange,
}: FilePreviewDrawerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup blob URLs to prevent memory leaks
      if (content && content.startsWith('blob:')) {
        URL.revokeObjectURL(content.split('#')[0]);
      }
    };
  }, [content]);

  useEffect(() => {
    if (file && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true);
      setError(null);
      setContent(null);

      const reader = new FileReader();

      if (file.type === 'application/pdf' || file.type.includes('pdf')) {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          // Convert data URL to blob URL for better PDF parameter support
          fetch(dataUrl)
            .then((res) => res.blob())
            .then((blob) => {
              const blobUrl = URL.createObjectURL(blob);
              setContent(
                `${blobUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit`
              );
              setIsLoading(false);
            })
            .catch(() => {
              // Fallback to data URL if blob creation fails
              setContent(
                `${dataUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit`
              );
              setIsLoading(false);
            });
        };
        reader.readAsDataURL(file);
      } else if (
        file.type === 'text/csv' ||
        file.name.toLowerCase().endsWith('.csv')
      ) {
        reader.onload = () => {
          const text = reader.result as string;
          const rows = text.split('\n').filter((row) => row.trim());
          const tableHtml = `
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                <thead>
                  <tr class="bg-gray-100">
                    ${
                      rows[0]
                        ?.split(',')
                        .map(
                          (cell) =>
                            `<th class="border border-gray-300 px-1 py-1 sm:px-2 sm:py-1 text-left font-medium">${cell.trim()}</th>`
                        )
                        .join('') || ''
                    }
                  </tr>
                </thead>
                <tbody>
                  ${rows
                    .slice(1)
                    .map(
                      (row) => `
                    <tr>
                      ${row
                        .split(',')
                        .map(
                          (cell) =>
                            `<td class="border border-gray-300 px-1 py-1 sm:px-2 sm:py-1 break-words max-w-24 sm:max-w-none">${cell.trim()}</td>`
                        )
                        .join('')}
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `;
          setContent(tableHtml);
          setIsLoading(false);
        };
        reader.readAsText(file);
      } else if (
        file.type.includes('excel') ||
        file.type.includes('spreadsheet') ||
        file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.xls')
      ) {
        reader.onload = () => {
          try {
            const data = new Uint8Array(reader.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
            }) as unknown[][];

            const tableHtml = `
              <div class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                  <tbody>
                    ${jsonData
                      .map(
                        (row: unknown[], rowIndex: number) => `
                      <tr class="${rowIndex === 0 ? 'bg-gray-100 font-medium' : ''}">
                        ${row.map((cell: unknown) => `<td class="border border-gray-300 px-1 py-1 sm:px-2 sm:py-1 break-words max-w-24 sm:max-w-none">${String(cell || '')}</td>`).join('')}
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            `;
            setContent(tableHtml);
          } catch (err) {
            setError('Failed to parse Excel file');
          }
          setIsLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } else {
        setError('Unsupported file type for preview');
        setIsLoading(false);
      }

      reader.onerror = () => {
        setError('Failed to read file');
        setIsLoading(false);
      };
    }
  }, [file, isOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || isMobile) return;
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(300, Math.min(800, newWidth));
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isOpen && !isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, onWidthChange, isMobile]);

  const handleResizeStart = () => {
    if (isMobile) return;
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return (
        <Image
          src="/file-pdf.svg"
          alt="PDF"
          width={32}
          height={32}
          className="h-8 w-8 object-cover"
        />
      );
    }
    if (
      type.includes('sheet') ||
      type.includes('excel') ||
      name.endsWith('.xlsx') ||
      name.endsWith('.xls')
    ) {
      return (
        <Image
          src="/file-xlsx.svg"
          alt="Excel"
          width={32}
          height={32}
          className="h-8 w-8 object-cover"
        />
      );
    }
    if (type.includes('csv') || name.endsWith('.csv')) {
      return (
        <Image
          src="/file-csv.svg"
          alt="CSV"
          width={32}
          height={32}
          className="h-8 w-8 object-cover"
        />
      );
    }
    return <AqFile02 className="text-primary h-5 w-5" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: isMobile ? '100%' : '100%' }}
          animate={{ x: 0 }}
          exit={{ x: isMobile ? '100%' : '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={cn(
            'bg-background glass-dark border-border fixed z-40 flex h-full flex-col border-l shadow-2xl',
            isMobile ? 'inset-0 border-l-0' : 'top-0 right-0'
          )}
          style={isMobile ? {} : { width: `${width}px` }}
        >
          {/* Resize Handle - Hidden on mobile */}
          {!isMobile && (
            <div
              ref={resizeRef}
              onMouseDown={handleResizeStart}
              className="bg-border/50 hover:bg-border absolute top-0 left-0 z-50 h-full w-1 cursor-col-resize transition-colors"
            >
              <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-1">
                <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
                <div className="bg-muted-foreground h-1 w-1 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="border-border flex items-center justify-between border-b p-3 sm:p-4">
            <div className="flex items-center gap-3">
              {file && getFileIcon(file)}
              <div className="min-w-0 flex-1">
                <h2 className="text-foreground truncate text-base font-semibold">
                  {file?.name || 'File Preview'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
              aria-label="Close drawer"
            >
              <AqX className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-3 sm:p-4">
            {isLoading && (
              <div className="flex h-full items-center justify-center">
                <div className="text-muted-foreground">Loading preview...</div>
              </div>
            )}
            {error && (
              <div className="flex h-full items-center justify-center px-4">
                <div className="text-destructive text-center text-sm sm:text-base">
                  {error}
                </div>
              </div>
            )}
            {content && !isLoading && !error && (
              <div className="h-full w-full">
                {file?.type === 'application/pdf' ||
                file?.name.toLowerCase().endsWith('.pdf') ? (
                  <embed
                    src={content}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    className="h-full w-full rounded-lg"
                  />
                ) : (
                  <div
                    className="border-border bg-card h-full overflow-auto rounded-lg border p-2 sm:p-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
