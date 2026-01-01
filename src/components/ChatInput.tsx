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
    <div className="border-t border-slate-200/50 bg-white/50 p-6 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl">
        {/* File Upload Preview */}
        <AnimatePresence>
          {uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <AqFile02 className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {uploadedFile.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={removeFile}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                  aria-label="Remove file"
                >
                  <AqX className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div
          className={cn(
            'relative flex items-center gap-4 rounded-3xl border-2 bg-white/80 shadow-lg backdrop-blur-sm transition-all focus-within:shadow-xl',
            isDragging
              ? 'border-amber-400 bg-amber-50/50'
              : 'border-slate-200 hover:border-slate-300',
            'focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10'
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
              'ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none',
              uploadedFile
                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label="Upload file"
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
              'flex-1 resize-none border-0 bg-transparent px-2 py-4 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200'
            )}
            style={{
              minHeight: '44px',
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
              'mr-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none',
              (!input.trim() && !uploadedFile) || isLoading || disabled
                ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg hover:from-amber-600 hover:to-amber-700 hover:shadow-xl',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <AqLoading01 className="h-5 w-5 animate-spin" />
            ) : (
              <AqSend01 className="h-5 w-5" />
            )}
          </motion.button>
        </div>

        {/* Helper Text */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isDragging ? (
              <span className="font-medium text-amber-600">
                Drop file to upload
              </span>
            ) : (
              <span className="text-slate-500">
                <span className="font-medium">Upload:</span> PDF, CSV, Excel •
                Max 8MB
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <kbd className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs">
              Enter
            </kbd>
            <span>to send</span>
            <span className="text-slate-400">•</span>
            <kbd className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs">
              Shift + Enter
            </kbd>
            <span>for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
