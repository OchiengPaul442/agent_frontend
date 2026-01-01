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
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <AqFile02 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-900">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
              <button
                onClick={removeFile}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:outline-none"
                aria-label="Remove file"
              >
                <AqX className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div
        className={cn(
          'relative flex items-center gap-2 rounded-3xl bg-white transition-all',
          isDragging ? 'border-blue-400 bg-blue-50/50' : '',
          hasMessages
            ? 'border border-gray-300 shadow-sm focus-within:border-gray-400 focus-within:shadow-md'
            : 'border border-gray-200 shadow-lg focus-within:border-gray-300'
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
            'ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all focus:ring-2 focus:ring-gray-500 focus:outline-none',
            uploadedFile
              ? 'cursor-not-allowed text-gray-300'
              : 'text-gray-500 hover:bg-gray-100',
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
            'flex-1 resize-none border-0 bg-transparent px-1 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            'max-h-[200px]'
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
          disabled={(!input.trim() && !uploadedFile) || isLoading || disabled}
          className={cn(
            'mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all focus:ring-2 focus:ring-gray-500 focus:outline-none',
            (!input.trim() && !uploadedFile) || isLoading || disabled
              ? 'cursor-not-allowed bg-gray-200 text-gray-400'
              : 'bg-gray-900 text-white hover:bg-gray-800',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="Send message"
        >
          {isLoading ? (
            <AqLoading01 className="h-4 w-4 animate-spin" />
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
          className="mt-2 text-center text-sm font-medium text-blue-600"
        >
          Drop file to upload
        </motion.div>
      )}
    </div>
  );
}
