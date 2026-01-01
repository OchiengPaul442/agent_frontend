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
    <div className="glass border-secondary-200/50 border-t p-6">
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
              <div className="border-secondary-200 flex items-center gap-4 rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                <div className="bg-primary-100 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                  <AqFile02 className="text-primary-600 h-6 w-6" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-secondary-900 truncate text-sm font-semibold">
                    {uploadedFile.name}
                  </p>
                  <p className="text-secondary-500 text-sm">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={removeFile}
                  className="text-secondary-400 focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-600"
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
              ? 'border-primary-400 bg-primary-50/50'
              : 'border-secondary-200 hover:border-secondary-300',
            'focus-within:border-primary-500 focus-within:ring-primary-500/10 focus-within:ring-4'
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
              'focus-ring ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all',
              uploadedFile
                ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200 hover:shadow-md',
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
              'text-secondary-900 placeholder:text-secondary-500 flex-1 resize-none border-0 bg-transparent px-2 py-4 text-base focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
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
              'focus-ring mr-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all',
              (!input.trim() && !uploadedFile) || isLoading || disabled
                ? 'bg-secondary-200 text-secondary-400 cursor-not-allowed'
                : 'from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 bg-gradient-to-br text-white shadow-lg hover:shadow-xl',
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
              <span className="text-primary-600 font-medium">
                Drop file to upload
              </span>
            ) : (
              <span className="text-secondary-500">
                <span className="font-medium">Upload:</span> PDF, CSV, Excel •
                Max 8MB
              </span>
            )}
          </div>
          <div className="text-secondary-500 flex items-center gap-3">
            <kbd className="bg-secondary-100 rounded-lg px-2 py-1 font-mono text-xs">
              Enter
            </kbd>
            <span>to send</span>
            <span className="text-secondary-400">•</span>
            <kbd className="bg-secondary-100 rounded-lg px-2 py-1 font-mono text-xs">
              Shift + Enter
            </kbd>
            <span>for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
