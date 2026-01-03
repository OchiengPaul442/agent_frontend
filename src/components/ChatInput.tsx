'use client';

import { useState, KeyboardEvent, useRef, DragEvent } from 'react';
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
  hasMessages?: boolean;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Ask about air quality...',
  disabled = false,
  hasMessages = false,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setUploadedFile(null);
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
      alert('Only PDF, CSV, and Excel files are supported');
      return;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 8MB');
      return;
    }

    setUploadedFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setUploadedFile(null);
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
    <div className="p-4">
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
                        <img
                          src="/file-pdf.svg"
                          alt="PDF"
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
                        <img
                          src="/file-xlsx.svg"
                          alt="Excel"
                          className="h-10 w-10 object-cover"
                        />
                      );
                    if (
                      type.includes('csv') ||
                      uploadedFile.name.toLowerCase().endsWith('.csv')
                    )
                      return (
                        <img
                          src="/file-csv.svg"
                          alt="CSV"
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

      {/* Input Area */}
      <div
        className={cn(
          'bg-background relative flex items-center gap-2 rounded-3xl border-2 transition-all',
          isDragging
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/30',
          'shadow-sm'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
            'ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none',
            uploadedFile
              ? 'text-muted-foreground cursor-not-allowed'
              : 'text-muted-foreground hover:bg-muted',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="Upload file"
        >
          <AqPaperclip className="h-5 w-5" />
        </button>

        {/* Textarea */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            uploadedFile ? 'Add a message (optional)...' : placeholder
          }
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            'text-foreground placeholder:text-muted-foreground flex-1 resize-none border-0 bg-transparent px-1 py-3 text-base focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            'max-h-50'
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
            'mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none',
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
            <AqLoading01 className="text-primary h-4 w-4 animate-spin" />
          ) : (
            <AqSend01 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Helper Text */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-primary mt-2 text-center text-sm font-medium"
        >
          Drop file to upload
        </motion.div>
      )}

      {/* Supported File Formats - Modern Style */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">PDF</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="text-muted-foreground text-xs">CSV</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="text-muted-foreground text-xs">XLSX</span>
        </div>
      </div>
    </div>
  );
}
