'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AqFile02,
  AqMarkerPin01,
  AqPaperclip,
  AqX,
  AqSend01,
  AqLoading02,
  AqChevronDown,
} from '@airqo/icons-react';
import type { ResponseRole } from '@/types';

interface ChatInputProps {
  onSend: (message: string, file?: File, role?: ResponseRole) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onFileSelect?: (file: File) => void;
  uploadedFile?: File | null;
  onRemoveFile?: () => void;
  errorMessage?: string | null;
  onClearError?: () => void;
  // Location props
  onLocationRequest?: () => void;
  locationLoading?: boolean;
  hasLocation?: boolean;
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
  // Location props
  onLocationRequest,
  locationLoading = false,
  hasLocation = false,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [internalUploadedFile, setInternalUploadedFile] = useState<File | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [internalErrorMessage, setInternalErrorMessage] = useState<
    string | null
  >(null);
  const [selectedRole, setSelectedRole] = useState<ResponseRole>('general');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Use external state if provided, otherwise use internal state
  const uploadedFile =
    externalUploadedFile !== undefined
      ? externalUploadedFile
      : internalUploadedFile;
  const errorMessage =
    externalErrorMessage !== undefined
      ? externalErrorMessage
      : internalErrorMessage;

  // Role options with professional names
  const roleOptions: {
    value: ResponseRole;
    label: string;
    description: string;
  }[] = [
    {
      value: 'general',
      label: 'Balanced',
      description: 'Well-rounded responses for everyone',
    },
    {
      value: 'executive',
      label: 'Executive Summary',
      description: 'High-level insights and key takeaways',
    },
    {
      value: 'technical',
      label: 'Technical Deep-Dive',
      description: 'Detailed analysis with scientific data',
    },
    {
      value: 'simple',
      label: 'Simple & Clear',
      description: 'Easy-to-understand explanations',
    },
    {
      value: 'policy',
      label: 'Policy & Compliance',
      description: 'Regulatory and policy-focused insights',
    },
  ];

  const selectedRoleOption =
    roleOptions.find((opt) => opt.value === selectedRole) || roleOptions[0];

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
          uploadedFile || undefined,
          selectedRole
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
        uploadedFile || undefined,
        selectedRole
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
                  <AqLoading02 className="text-primary h-5 w-5 animate-spin" />
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
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus:ring-destructive flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors focus:ring-2 focus:outline-none"
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
                className="text-muted-foreground flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 focus:outline-none"
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
          'bg-background relative flex min-h-[120px] flex-col rounded-3xl border-2 transition-all',
          'border-muted-foreground/30',
          'shadow-sm'
        )}
      >
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
            'text-foreground placeholder:text-muted-foreground flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-base',
            'min-h-[60px]'
          )}
          style={{
            height: 'auto',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
        />

        {/* Buttons Row */}
        <div className="flex items-center gap-1 px-3 pb-3">
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

          {/* Location Button */}
          {onLocationRequest && (
            <button
              onClick={onLocationRequest}
              disabled={disabled || isLoading || locationLoading}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none',
                hasLocation
                  ? 'cursor-pointer text-green-600 hover:bg-green-50'
                  : 'text-muted-foreground hover:bg-muted cursor-pointer',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              aria-label="Share location"
              title={
                hasLocation
                  ? 'Location enabled — click to send location'
                  : 'Share my location with Aeris'
              }
              data-tooltip={hasLocation ? 'Location enabled' : 'Share location'}
            >
              {locationLoading ? (
                <AqLoading02 className="text-primary h-4 w-4 animate-spin" />
              ) : (
                <AqMarkerPin01 className="h-4 w-4" />
              )}
            </button>
          )}

          {/* File Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading || !!uploadedFile}
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none',
              uploadedFile
                ? 'text-muted-foreground cursor-not-allowed'
                : 'text-muted-foreground hover:bg-muted cursor-pointer',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label="Upload file"
            title="Upload a document for analysis"
          >
            <AqPaperclip className="h-4 w-4" />
          </button>

          {/* Role Selector Dropdown */}
          <div className="relative ml-auto" ref={roleDropdownRef}>
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              disabled={disabled || isLoading}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none',
                'bg-muted/80 text-muted-foreground hover:bg-muted cursor-pointer',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'border-border/50 border'
              )}
              aria-label="Select response style"
            >
              <span className="hidden sm:inline">
                {selectedRoleOption.label}
              </span>
              <span className="sm:hidden">
                {selectedRoleOption.label.split(' ')[0]}
              </span>
              <AqChevronDown
                className={cn(
                  'h-3 w-3 transition-transform',
                  isRoleDropdownOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isRoleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="border-border absolute right-0 bottom-full z-50 mb-2 w-72 overflow-hidden rounded-xl border bg-[#161616] shadow-lg"
                >
                  <div className="p-2">
                    <div className="text-muted-foreground px-3 py-2 text-xs font-semibold">
                      Response Style
                    </div>
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedRole(option.value);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors',
                          'hover:bg-muted',
                          selectedRole === option.value &&
                            'bg-primary/10 text-primary'
                        )}
                      >
                        <div className="text-sm font-medium">
                          {option.label}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-xs">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleSend}
            disabled={
              (!input.trim() && !uploadedFile) ||
              isLoading ||
              disabled ||
              isUploading
            }
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none sm:h-9 sm:w-9',
              (!input.trim() && !uploadedFile) ||
                isLoading ||
                disabled ||
                isUploading
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground cursor-pointer hover:opacity-95',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label="Send message"
          >
            {isLoading || isUploading ? (
              <AqLoading02 className="text-primary h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
            ) : (
              <AqSend01 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
