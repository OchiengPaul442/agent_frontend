'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AqX, AqFile02 } from '@airqo/icons-react';
import Image from 'next/image';
import * as XLSX from 'xlsx';
import { cn } from '@/utils/helpers';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface FilePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | { name: string; size: number; type: string } | null;
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
  const [currentSheet, setCurrentSheet] = useState(0);
  const [workbookData, setWorkbookData] = useState<any>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileRef = useRef<
    File | { name: string; size: number; type: string } | null
  >(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup blob URLs when component unmounts or file changes
  useEffect(() => {
    return () => {
      // Revoke all stored blob URLs to prevent memory leaks
      blobUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // Cleanup when file changes
  useEffect(() => {
    if (file !== fileRef.current) {
      // Revoke previous blob URLs
      blobUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
      fileRef.current = file;
    }
  }, [file]);

  // Expose sheet change function to window for HTML select
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).changeSheet = (sheetIndex: string) => {
        const index = parseInt(sheetIndex);
        setCurrentSheet(index);
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).changeSheet;
      }
    };
  }, []);

  // Optimized sheet rendering with useCallback
  const renderSheet = useCallback((sheetIndex: number, workbook: any) => {
    const sheetName = workbook.SheetNames[sheetIndex];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    }) as unknown[][];

    const maxRows = 1000; // Limit rows to prevent UI freezing
    const displayData = jsonData.slice(0, maxRows);
    const hasMoreRows = jsonData.length > maxRows;

    return `
      <div class="overflow-x-auto">
        <div class="mb-3 text-sm text-muted-foreground">
          Sheet: ${sheetName} (${jsonData.length} rows${hasMoreRows ? `, showing first ${maxRows}` : ''})
        </div>
        <table class="w-full border-collapse border border-border text-xs sm:text-sm">
          <tbody>
            ${displayData
              .map(
                (row: unknown[], rowIndex: number) => `
              <tr class="${rowIndex === 0 ? 'bg-muted font-medium' : 'hover:bg-muted/50'}">
                ${row.map((cell: unknown) => `<td class="border border-border px-2 py-1 sm:px-3 sm:py-2 break-words max-w-32 sm:max-w-none text-foreground">${String(cell || '')}</td>`).join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }, []);

  // Update content when sheet changes - optimized with useCallback
  const updateSheetContent = useCallback(() => {
    if (workbookData && content && content.includes('sheet-selector')) {
      const newSheetContent = renderSheet(currentSheet, workbookData);
      const sheetSelector =
        workbookData.SheetNames.length > 1
          ? `
        <div class="mb-4 p-3 bg-muted/30 rounded-lg">
          <label class="block text-sm font-medium text-foreground mb-2">Select Sheet:</label>
          <select id="sheet-selector" class="bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none w-full" onchange="window.changeSheet(this.value)">
            ${workbookData.SheetNames.map((name: string, index: number) => `<option value="${index}" ${index === currentSheet ? 'selected' : ''}>${name}</option>`).join('')}
          </select>
        </div>
      `
          : '';

      const fullContent = `
        <div class="space-y-4">
          ${sheetSelector}
          <div id="sheet-content">
            ${newSheetContent}
          </div>
        </div>
      `;

      setContent(fullContent);
    }
  }, [workbookData, content, currentSheet, renderSheet]);

  useEffect(() => {
    updateSheetContent();
  }, [updateSheetContent]);

  useEffect(() => {
    return () => {
      // Cleanup blob URLs to prevent memory leaks
      if (content && content.startsWith('blob:')) {
        URL.revokeObjectURL(content.split('#')[0]);
      }
    };
  }, [content]);

  // Optimized file processing with useCallback to prevent unnecessary re-runs
  const processFile = useCallback(async (fileToProcess: File) => {
    setIsLoading(true);
    setError(null);
    setContent(null);
    setWorkbookData(null);
    setCurrentSheet(0);

    try {
      if (
        fileToProcess.type === 'application/pdf' ||
        fileToProcess.type.includes('pdf')
      ) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read PDF file'));
          reader.readAsDataURL(fileToProcess);
        });

        // Convert data URL to blob URL for better PDF parameter support
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        blobUrlsRef.current.add(blobUrl);

        setContent(
          `${blobUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit`
        );
      } else if (
        fileToProcess.type === 'text/csv' ||
        fileToProcess.name.toLowerCase().endsWith('.csv')
      ) {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read CSV file'));
          reader.readAsText(fileToProcess);
        });

        const rows = text.split('\n').filter((row) => row.trim());
        const maxRows = 1000; // Limit rows to prevent UI freezing
        const displayRows = rows.slice(0, maxRows);
        const hasMoreRows = rows.length > maxRows;

        const tableHtml = `
          <div class="overflow-x-auto">
            ${hasMoreRows ? `<div class="mb-2 text-sm text-muted-foreground">Showing first ${maxRows} rows of ${rows.length} total rows</div>` : ''}
            <table class="w-full border-collapse border border-border text-xs sm:text-sm">
              <thead>
                <tr class="bg-muted">
                  ${
                    displayRows[0]
                      ?.split(',')
                      .map(
                        (cell) =>
                          `<th class="border border-border px-2 py-1 sm:px-3 sm:py-2 text-left font-medium text-foreground">${cell.trim()}</th>`
                      )
                      .join('') || ''
                  }
                </tr>
              </thead>
              <tbody>
                ${displayRows
                  .slice(1)
                  .map(
                    (row, index) => `
                  <tr class="${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'} hover:bg-muted/50">
                    ${row
                      .split(',')
                      .map(
                        (cell) =>
                          `<td class="border border-border px-2 py-1 sm:px-3 sm:py-2 break-words max-w-32 sm:max-w-none text-foreground">${cell.trim()}</td>`
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
      } else if (
        fileToProcess.type.includes('excel') ||
        fileToProcess.type.includes('spreadsheet') ||
        fileToProcess.name.toLowerCase().endsWith('.xlsx') ||
        fileToProcess.name.toLowerCase().endsWith('.xls')
      ) {
        const arrayBuffer = await new Promise<ArrayBuffer>(
          (resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = () =>
              reject(new Error('Failed to read Excel file'));
            reader.readAsArrayBuffer(fileToProcess);
          }
        );

        const workbook = XLSX.read(new Uint8Array(arrayBuffer), {
          type: 'array',
        });
        setWorkbookData(workbook);
        setCurrentSheet(0);

        const sheetSelector =
          workbook.SheetNames.length > 1
            ? `
          <div class="mb-4 p-3 bg-muted/30 rounded-lg">
            <label class="block text-sm font-medium text-foreground mb-2">Select Sheet:</label>
            <select id="sheet-selector" class="bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none w-full" onchange="window.changeSheet(this.value)">
              ${workbook.SheetNames.map((name: string, index: number) => `<option value="${index}" ${index === 0 ? 'selected' : ''}>${name}</option>`).join('')}
            </select>
          </div>
        `
            : '';

        const initialContent = renderSheet(0, workbook);
        const fullContent = `
          <div class="space-y-4">
            ${sheetSelector}
            <div id="sheet-content">
              ${initialContent}
            </div>
          </div>
        `;

        setContent(fullContent);
      } else {
        setError('Unsupported file type for preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced file processing to prevent rapid re-processing
  const debouncedProcessFile = useCallback(
    debounce((fileToProcess: File) => {
      processFile(fileToProcess);
    }, 300),
    [processFile]
  );

  // Main file processing effect - only runs when file or isOpen changes
  useEffect(() => {
    if (file && isOpen) {
      if (file instanceof File) {
        debouncedProcessFile(file);
      } else {
        // We only have file metadata, show info view
        const fileInfo = file as { name: string; size: number; type: string };
        const infoHtml = `
          <div class="flex flex-col items-center justify-center h-full text-center p-8">
            <div class="bg-muted rounded-full p-6 mb-4">
              ${getFileIcon(fileInfo)}
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">${fileInfo.name}</h3>
            <p class="text-muted-foreground text-sm mb-4">
              ${formatFileSize(fileInfo.size)} • ${fileInfo.type || 'Unknown type'}
            </p>
            <p class="text-muted-foreground text-sm">
              File content is not available for preview.<br/>
              This file was uploaded in a previous message.
            </p>
          </div>
        `;
        setContent(infoHtml);
        setIsLoading(false);
      }
    }
  }, [file, isOpen, debouncedProcessFile]);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleResizeStart = () => {
    if (isMobile) return;
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const getFileIcon = (
    file: File | { name: string; size: number; type: string }
  ) => {
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
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {file && getFileIcon(file)}
              <div className="min-w-0 flex-1">
                <h2
                  className="text-foreground truncate text-base font-semibold"
                  title={file?.name || 'File Preview'}
                >
                  {file?.name
                    ? file.name.length > 25
                      ? `${file.name.substring(0, 25)}...`
                      : file.name
                    : 'File Preview'}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-ring ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
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
