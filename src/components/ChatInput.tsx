'use client';

import { useState, KeyboardEvent, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AqFile02,
  AqPaperclip,
  AqX,
  AqSend01,
  AqLoading01,
} from '@airqo/icons-react';

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onFileSelect?: (file: File) => void;
  uploadedFile?: File | null;
  onRemoveFile?: () => void;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Ask about air quality...',
  disabled = false,
  onFileSelect,
  uploadedFile: externalUploadedFile,
  onRemoveFile,
  errorMessage: externalErrorMessage,
  onClearError,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [internalUploadedFile, setInternalUploadedFile] = useState<File | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [internalErrorMessage, setInternalErrorMessage] = useState<
    string | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external state if provided, otherwise use internal state
  const uploadedFile =
    externalUploadedFile !== undefined
      ? externalUploadedFile
      : internalUploadedFile;
  const errorMessage =
    externalErrorMessage !== undefined
      ? externalErrorMessage
      : internalErrorMessage;

  const handleSend = () => {
    if (
      (!input.trim() && !uploadedFile) ||
      isLoading ||
      disabled ||
      isUploading
    )
      return;

    if (uploadedFile) {
      setIsUploading(true);
      // Simulate upload start
      setTimeout(() => {
        onSend(
          input.trim() || 'Analyze this document',
          uploadedFile || undefined
        );
        setInput('');
        if (onRemoveFile) {
          onRemoveFile();
        } else {
          setInternalUploadedFile(null);
        }
        setIsUploading(false);
      }, 100);
    } else {
      onSend(
        input.trim() || 'Analyze this document',
        uploadedFile || undefined
      );
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (file: File) => {
    const maxSize = 8 * 1024 * 1024; // 8MB
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const name = (file.name || '').toLowerCase();

    if (
      !allowedTypes.includes(file.type) &&
      !name.endsWith('.pdf') &&
      !name.endsWith('.csv') &&
      !name.endsWith('.xls') &&
      !name.endsWith('.xlsx')
    ) {
      if (onClearError) {
        onClearError();
        // Use a timeout to ensure the state update happens after clearing
        setTimeout(() => {
          if (externalErrorMessage !== undefined) {
            // If using external error management, notify parent
            // Parent should handle this through onFileSelect callback
          } else {
            setInternalErrorMessage(
              'Only PDF, CSV, and Excel files are supported'
            );
          }
        }, 0);
      } else {
        setInternalErrorMessage('Only PDF, CSV, and Excel files are supported');
      }
      return;
    }

    if (file.size > maxSize) {
      if (onClearError) {
        onClearError();
        setTimeout(() => {
          if (externalErrorMessage !== undefined) {
            // Parent should handle this
          } else {
            setInternalErrorMessage('File size must be less than 8MB');
          }
        }, 0);
      } else {
        setInternalErrorMessage('File size must be less than 8MB');
      }
      return;
    }

    if (onClearError) onClearError();
    else if (externalErrorMessage === undefined) setInternalErrorMessage(null);

    if (onFileSelect) {
      onFileSelect(file);
    } else {
      setInternalUploadedFile(file);
    }
  };

  const removeFile = () => {
    if (onRemoveFile) {
      onRemoveFile();
    } else {
      setInternalUploadedFile(null);
    }

    if (onClearError) {
      onClearError();
    } else if (externalErrorMessage === undefined) {
      setInternalErrorMessage(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-2 sm:p-4">
      {/* File Upload Preview */}
      <AnimatePresence>
        {uploadedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3"
          >
            <div className="border-border bg-muted flex items-center gap-3 rounded-xl border p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {isUploading ? (
                  <AqLoading01 className="text-primary h-5 w-5 animate-spin" />
                ) : (
                  (() => {
                    const type = uploadedFile.type;
                    if (
                      type.includes('pdf') ||
                      uploadedFile.name.toLowerCase().endsWith('.pdf')
                    )
                      return (
                        <Image
                          src="/file-pdf.svg"
                          alt="PDF"
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover"
                        />
                      );
                    if (
                      type.includes('sheet') ||
                      type.includes('excel') ||
                      uploadedFile.name.toLowerCase().endsWith('.xlsx') ||
                      uploadedFile.name.toLowerCase().endsWith('.xls')
                    )
                      return (
                        <Image
                          src="/file-xlsx.svg"
                          alt="Excel"
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover"
                        />
                      );
                    if (
                      type.includes('csv') ||
                      uploadedFile.name.toLowerCase().endsWith('.csv')
                    )
                      return (
                        <Image
                          src="/file-csv.svg"
                          alt="CSV"
                          width={40}
                          height={40}
                          className="h-10 w-10 object-cover"
                        />
                      );
                    return <AqFile02 className="text-primary h-5 w-5" />;
                  })()
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-foreground truncate text-sm font-medium">
                  {uploadedFile.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {isUploading
                    ? 'Uploading...'
                    : formatFileSize(uploadedFile.size)}
                </p>
              </div>
              {!isUploading && (
                <button
                  onClick={removeFile}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus:ring-destructive flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors focus:ring-2 focus:outline-none"
                  aria-label="Remove file"
                >
                  <AqX className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3"
          >
            <div className="text-foreground flex items-center gap-2 rounded-xl border border-gray-200 p-3 text-sm">
              <span className="flex-1">{errorMessage}</span>
              <button
                onClick={() => {
                  if (onClearError) {
                    onClearError();
                  } else if (externalErrorMessage === undefined) {
                    setInternalErrorMessage(null);
                  }
                }}
                className="text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                aria-label="Close error message"
              >
                <AqX className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div
        className={cn(
          'bg-background relative flex min-w-0 items-center gap-1 rounded-3xl border-2 transition-all sm:gap-2',
          'border-muted-foreground/30',
          'shadow-sm'
        )}
      >
        {/* File Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading || !!uploadedFile}
          className={cn(
            'ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none sm:ml-3 sm:h-9 sm:w-9',
            uploadedFile
              ? 'text-muted-foreground cursor-not-allowed'
              : 'text-muted-foreground hover:bg-muted',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="Upload file"
        >
          <AqPaperclip className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Textarea */}
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (errorMessage) {
              if (onClearError) {
                onClearError();
              } else if (externalErrorMessage === undefined) {
                setInternalErrorMessage(null);
              }
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            uploadedFile ? 'Add a message (optional)...' : placeholder
          }
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            'text-foreground placeholder:text-muted-foreground min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 sm:text-base',
            'max-h-32'
          )}
          style={{
            minHeight: '24px',
            height: 'auto',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={
            (!input.trim() && !uploadedFile) ||
            isLoading ||
            disabled ||
            isUploading
          }
          className={cn(
            'mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none sm:mr-2 sm:h-9 sm:w-9',
            (!input.trim() && !uploadedFile) ||
              isLoading ||
              disabled ||
              isUploading
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:opacity-95',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="Send message"
        >
          {isLoading || isUploading ? (
            <AqLoading01 className="text-primary h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
          ) : (
            <AqSend01 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
