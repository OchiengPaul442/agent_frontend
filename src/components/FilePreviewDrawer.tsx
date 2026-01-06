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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Update content when sheet changes
  useEffect(() => {
    if (workbookData && content && content.includes('sheet-selector')) {
      const renderSheet = (sheetIndex: number) => {
        const sheetName = workbookData.SheetNames[sheetIndex];
        const worksheet = workbookData.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as unknown[][];

        return `
          <div class="overflow-x-auto">
            <div class="mb-3 text-sm text-muted-foreground">
              Sheet: ${sheetName} (${jsonData.length} rows)
            </div>
            <table class="w-full border-collapse border border-border text-xs sm:text-sm">
              <tbody>
                ${jsonData
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
      };

      const newSheetContent = renderSheet(currentSheet);
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
  }, [currentSheet, workbookData]);

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
      setWorkbookData(null);
      setCurrentSheet(0);

      // Check if we have a real File object or just metadata
      if (file instanceof File) {
        // We have a real file, proceed with reading
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
                <table class="w-full border-collapse border border-border text-xs sm:text-sm">
                  <thead>
                    <tr class="bg-muted">
                      ${
                        rows[0]
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
                    ${rows
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
              setWorkbookData(workbook);
              setCurrentSheet(0);

              const renderSheet = (sheetIndex: number) => {
                const sheetName = workbook.SheetNames[sheetIndex];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                  header: 1,
                }) as unknown[][];

                return `
                  <div class="overflow-x-auto">
                    <div class="mb-3 text-sm text-muted-foreground">
                      Sheet: ${sheetName} (${jsonData.length} rows)
                    </div>
                    <table class="w-full border-collapse border border-border text-xs sm:text-sm">
                      <tbody>
                        ${jsonData
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
              };

              const sheetSelector =
                workbook.SheetNames.length > 1
                  ? `
                <div class="mb-4 p-3 bg-muted/30 rounded-lg">
                  <label class="block text-sm font-medium text-foreground mb-2">Select Sheet:</label>
                  <select id="sheet-selector" class="bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none w-full" onchange="window.changeSheet(this.value)">
                    ${workbook.SheetNames.map((name, index) => `<option value="${index}" ${index === 0 ? 'selected' : ''}>${name}</option>`).join('')}
                  </select>
                </div>
              `
                  : '';

              const initialContent = renderSheet(0);

              const fullContent = `
                <div class="space-y-4">
                  ${sheetSelector}
                  <div id="sheet-content">
                    ${initialContent}
                  </div>
                </div>
              `;

              setContent(fullContent);
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
