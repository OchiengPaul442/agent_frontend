'use client';

import { useState, KeyboardEvent, useRef, DragEvent } from 'react';
import { cn } from '@/utils/helpers';
import {
  AqSend01,
  AqLoading01,
  AqPaperclip,
  AqX,
  AqFile02,
} from '@airqo/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Ask about air quality...',
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!input.trim() && !uploadedFile) || isLoading || disabled) return;

    onSend(input.trim() || 'Analyze this document', uploadedFile || undefined);
    setInput('');
    setUploadedFile(null);
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

    if (!allowedTypes.includes(file.type)) {
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
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="mx-auto max-w-4xl">
        {/* File Upload Preview */}
        <AnimatePresence>
          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3"
            >
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
                  <AqFile02 className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={removeFile}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-slate-200"
                >
                  <AqX className="h-4 w-4 text-slate-500" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div
          className={cn(
            'relative flex items-center gap-2 rounded-2xl border-2 transition-all',
            isDragging
              ? 'border-red-500 bg-red-50'
              : 'border-slate-200 bg-slate-50',
            'focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10'
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading || !!uploadedFile}
            className={cn(
              'ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
              uploadedFile
                ? 'cursor-not-allowed text-slate-300'
                : 'text-slate-600 hover:bg-slate-200',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <AqPaperclip className="h-5 w-5" />
          </motion.button>

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
              'flex-1 resize-none border-0 bg-transparent px-3 py-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200'
            )}
            style={{
              minHeight: '40px',
              maxHeight: '200px',
              height: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />

          {/* Send Button */}
          <motion.button
            onClick={handleSend}
            disabled={(!input.trim() && !uploadedFile) || isLoading || disabled}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className={cn(
              'mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all',
              (!input.trim() && !uploadedFile) || isLoading || disabled
                ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                : 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md hover:shadow-lg',
              'focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:outline-none'
            )}
          >
            {isLoading ? (
              <AqLoading01 className="h-4 w-4 animate-spin" />
            ) : (
              <AqSend01 className="h-4 w-4" />
            )}
          </motion.button>
        </div>

        {/* Helper Text */}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <div>
            {isDragging ? (
              <span className="text-red-600">Drop file to upload</span>
            ) : (
              <span>PDF, CSV, Excel • Max 8MB</span>
            )}
          </div>
          <div>
            <kbd className="rounded bg-slate-200 px-1">Enter</kbd> to send •{' '}
            <kbd className="rounded bg-slate-200 px-1">Shift + Enter</kbd> for
            new line
          </div>
        </div>
      </div>
    </div>
  );
}
