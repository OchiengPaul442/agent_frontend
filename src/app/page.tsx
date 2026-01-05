'use client';

import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import Image from 'next/image';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useChat } from '@/hooks/useChat';
import { useGeolocation } from '@/hooks/useGeolocation';
import { apiService } from '@/services/api.service';
import { motion, AnimatePresence } from 'framer-motion';
import { AqLoading02 } from '@airqo/icons-react';
import { cn } from '@/utils/helpers';

// Generate a stable session ID for the browser session
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Starter questions for air quality (professional / policy oriented)
const STARTER_QUESTIONS = [
  "Is it safe for my family to be outside right now—what's the 1-hour vs. 24-hour risk?",
  'What are the most cost-effective ways to cut indoor PM2.5 by 50%?',
  "How does air pollution affect pregnancy and children's lung development?",
  'What policies actually work to reduce traffic pollution near schools?',
];

export default function HomePage() {
  // Initialize session ID once and keep it stable
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitializingSession, setIsInitializingSession] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Try to get from sessionStorage first
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem('currentSessionId');
          if (stored) {
            setSessionId(stored);
            setIsInitializingSession(false);
            return;
          }
        }

        // No stored session, create a new one from backend
        const newSession = await apiService.createSession();
        setSessionId(newSession.session_id);

        // Store in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentSessionId', newSession.session_id);
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Fallback to local generation if backend fails
        const newId = generateSessionId();
        setSessionId(newId);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentSessionId', newId);
        }
      } finally {
        setIsInitializingSession(false);
      }
    };

    initializeSession();
  }, []);

  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileErrorMessage, setFileErrorMessage] = useState<string | null>(null);
  const [showDelayNotification, setShowDelayNotification] = useState(false);
  const dragCounterRef = useRef(0);

  // Geolocation hook
  const geolocation = useGeolocation({ autoRequest: false });

  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    retry,
    editMessage,
    addErrorMessage,
  } = useChat({
    sessionId: sessionId || '',
    onError: (err) => console.error('Chat error:', err),
  });

  // Handle delay notification
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let autoHideTimer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowDelayNotification(true);
        // Auto-hide after 5 seconds
        autoHideTimer = setTimeout(() => {
          setShowDelayNotification(false);
        }, 5000);
      }, 15000); // Show after 15 seconds of loading
    } else {
      setShowDelayNotification(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (autoHideTimer) clearTimeout(autoHideTimer);
    };
  }, [isLoading]);

  const [isSendingLocation, setIsSendingLocation] = useState(false);

  // When user clicks GPS icon we should obtain current coordinates and send a preset message
  const handleSendLocationQuery = async () => {
    if (!sessionId) return;
    try {
      setIsSendingLocation(true);

      // Always request current position to ensure permission dialog shows if needed
      await new Promise<void>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const preset = "What's the air quality in my area?";
            try {
              const response = await sendMessage(preset, undefined, lat, lon);
              if (response === null) {
                reject(new Error('Failed to send location query'));
              } else {
                resolve();
              }
            } catch (err) {
              reject(err);
            }
          },
          (err) => {
            reject(err);
          },
          { enableHighAccuracy: true, timeout: 60000 }
        );
      });
    } catch (err: unknown) {
      // Safely extract message and code from unknown error
      const errMessage =
        err instanceof Error ? err.message : String(err ?? 'Unknown error');
      const errObj =
        typeof err === 'object' && err !== null
          ? (err as Record<string, unknown>)
          : null;
      const errCode =
        errObj && typeof errObj['code'] === 'number'
          ? (errObj['code'] as number)
          : undefined;

      console.warn(
        'Failed to send location query:',
        errMessage,
        errCode ?? err
      );

      // Add specific error message to chat based on error type
      let errorMessage = 'Unable to retrieve your location.';
      if (errCode === 1) {
        errorMessage +=
          ' Location permission was denied. Please allow location access in your browser settings.';
      } else if (errCode === 2) {
        errorMessage +=
          ' Location information is unavailable. This may be due to network issues or disabled location services on your device. Please ensure location services are enabled and try again.';
      } else if (errCode === 3) {
        errorMessage += ' Location request timed out. Please try again.';
      } else {
        errorMessage += ' Please check your browser permissions and try again.';
      }
      addErrorMessage(errorMessage);
    } finally {
      setIsSendingLocation(false);
    }
  };

  // Create a safe sendMessage function that checks for session
  const safeSendMessage = useCallback(
    (content: string, file?: File) => {
      if (!sessionId) {
        console.error('Cannot send message: Session not initialized');
        return;
      }
      sendMessage(
        content,
        file,
        geolocation.latitude || undefined,
        geolocation.longitude || undefined
      );
    },
    [sessionId, sendMessage, geolocation.latitude, geolocation.longitude]
  );

  const hasMessages = messages.length > 0 || isLoading;

  // Handle page refresh and tab close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasMessages) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return '';
      }
    };

    const handleUnload = async () => {
      if (sessionId) {
        try {
          console.log('Deleting session on page unload:', sessionId);
          // Use fetch with keepalive to send DELETE request reliably on page unload
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/sessions/${sessionId}`,
            {
              method: 'DELETE',
              keepalive: true,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          if (response.ok) {
            console.log('Successfully deleted session on unload');
          } else {
            console.error(
              'Failed to delete session on unload:',
              response.status,
              response.statusText
            );
          }
        } catch (error) {
          console.error('Failed to delete session on unload:', error);
        }
        // Clear the session ID from storage so a new session starts on reload
        sessionStorage.removeItem('currentSessionId');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [hasMessages, sessionId]);

  // Handle tab visibility changes for session cleanup
  useEffect(() => {
    let hiddenTime: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTime = Date.now();
      } else if (hiddenTime && sessionId) {
        const hiddenDuration = Date.now() - hiddenTime;
        // If tab was hidden for more than 30 minutes, consider cleaning up the session
        if (hiddenDuration > 30 * 60 * 1000) {
          console.log(
            'Tab was hidden for extended period, session may need cleanup'
          );
          // Note: We don't auto-delete here as user might come back, but we could add logic to check session validity
        }
        hiddenTime = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionId]);

  const handleStarterQuestion = (question: string) => {
    if (!sessionId) {
      console.error('Session not initialized yet');
      return;
    }
    safeSendMessage(question);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
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
      setFileErrorMessage('Only PDF, CSV, and Excel files are supported');
      setUploadedFile(null);
      return;
    }

    if (file.size > maxSize) {
      setFileErrorMessage('File size must be less than 8MB');
      setUploadedFile(null);
      return;
    }

    setFileErrorMessage(null);
    setUploadedFile(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileErrorMessage(null);
  };

  const handleClearError = () => {
    setFileErrorMessage(null);
  };

  // Cleanup drag counter on unmount
  useEffect(() => {
    return () => {
      dragCounterRef.current = 0;
    };
  }, []);

  const handleNewSession = async () => {
    // Show confirmation dialog if there are current messages
    if (messages.length > 0) {
      setShowNewChatDialog(true);
      return;
    }

    // If no messages, proceed directly
    await createNewSession();
  };

  const createNewSession = async () => {
    try {
      // Delete the old session if it exists
      if (sessionId) {
        try {
          console.log('Deleting old session:', sessionId);
          await apiService.deleteSession(sessionId);
          console.log('Successfully deleted old session');
        } catch (err) {
          console.error('Failed to delete old session:', err);
          // Continue anyway - don't let deletion failure block new session creation
        }
      }

      // Clear current messages immediately
      clearMessages();

      // Create new session from backend
      console.log('Creating new session...');
      const newSession = await apiService.createSession();
      console.log('New session created:', newSession.session_id);

      setSessionId(newSession.session_id);

      // Store in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('currentSessionId', newSession.session_id);
      }

      // Close dialog
      setShowNewChatDialog(false);
    } catch (err) {
      console.error('Failed to create new session:', err);
      alert('Failed to start new conversation. Please try again.');
    }
  };

  if (isInitializingSession) {
    return (
      <div className="bg-muted/30 flex h-screen items-center justify-center p-2">
        <div className="bg-background border-border flex h-full w-full flex-col items-center justify-center rounded-lg shadow-xl">
          <div className="text-center">
            <AqLoading02 className="text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">
              Initializing chat session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 flex h-screen items-center justify-center p-2">
      <div
        className={cn(
          'bg-background border-border relative flex h-full w-full flex-col overflow-hidden rounded-lg shadow-xl transition-all duration-200',
          isDragging
            ? 'border-primary border-2 border-dashed'
            : 'border border-solid'
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag and Drop Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-primary/5 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
              style={{ pointerEvents: 'none' }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-background border-primary text-primary flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed p-8 shadow-2xl"
              >
                <svg
                  className="h-16 w-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-lg font-semibold">Drop file to upload</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    PDF, CSV, and Excel files only (max 8MB)
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showNewChatDialog}
          onClose={() => setShowNewChatDialog(false)}
          onConfirm={createNewSession}
          title="Start New Conversation?"
          message="Starting a new conversation will delete your current chat history. This action cannot be undone. Are you sure you want to continue?"
          confirmText="Start New Chat"
          cancelText="Keep Current Chat"
          type="warning"
        />

        {/* Header */}
        <header className="bg-background/80 sticky top-0 z-10 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {hasMessages && (
                <motion.div
                  layoutId="aeris-logo"
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 30,
                    mass: 1,
                  }}
                  className="relative"
                >
                  <Image
                    src="/logo.png"
                    alt="Aeris Logo"
                    width={32}
                    height={32}
                    className="h-7 w-7 rounded-lg sm:h-8 sm:w-8"
                  />
                </motion.div>
              )}
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: hasMessages ? 1 : 0,
                  x: hasMessages ? 0 : -10,
                }}
                transition={{ duration: 0.3, delay: hasMessages ? 0.4 : 0 }}
                className="text-foreground text-base font-medium sm:text-lg"
              >
                Aeris
              </motion.h1>
            </div>
            {hasMessages && (
              <button
                onClick={handleNewSession}
                className="border-border bg-background text-foreground hover:bg-muted focus:ring-ring flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus:ring-2 focus:outline-none sm:px-4 sm:py-2 md:text-sm"
              >
                <svg
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Chat
              </button>
            )}
          </div>
        </header>

        {/* Delay Notification Toast */}
        <AnimatePresence>
          {showDelayNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
              className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
            >
              <div className="max-w-md rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-yellow-800">
                      <strong>Response taking longer than usual.</strong> This
                      may be due to resource constraints or high demand. Thank
                      you for your patience.
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => setShowDelayNotification(false)}
                      className="text-yellow-400 transition-colors hover:text-yellow-600"
                    >
                      <span className="sr-only">Close</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {/* Welcome Screen (Centered) */}
          <AnimatePresence>
            {!hasMessages && !isInitializingSession && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="bg-background absolute inset-0 z-10 flex flex-col items-center justify-center px-3 pb-32 sm:px-4"
              >
                <div className="w-full max-w-3xl space-y-6 sm:space-y-8">
                  <div className="flex flex-col items-center text-center">
                    {/* Centered animated logo */}
                    <motion.div
                      layoutId="aeris-logo"
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 30,
                        mass: 1,
                      }}
                      className="mb-6"
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      >
                        <Image
                          src="/logo.png"
                          alt="Aeris Logo"
                          width={80}
                          height={80}
                          className="h-20 w-20 rounded-2xl shadow-lg"
                          priority
                        />
                      </motion.div>
                    </motion.div>

                    <h2 className="text-foreground mb-2 text-3xl font-semibold sm:text-4xl">
                      Ready when you are.
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Ask me anything about air quality
                    </p>
                  </div>

                  {/* Starter Questions */}
                  <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
                    {STARTER_QUESTIONS.map((question, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                        onClick={() => handleStarterQuestion(question)}
                        className="group border-border bg-card hover:border-border focus:ring-ring cursor-pointer rounded-xl border p-4 text-left shadow-sm transition-all hover:shadow-md focus:ring-2 focus:outline-none sm:p-5 md:p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-primary text-primary-foreground mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </div>
                          <span className="text-card-foreground group-hover:text-primary text-sm leading-relaxed font-medium">
                            {question}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Messages (Shown when there are messages) */}
          <AnimatePresence>
            {hasMessages && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 overflow-hidden"
              >
                <ChatMessages
                  messages={messages}
                  isLoading={isLoading}
                  onRetry={retry}
                  onEditMessage={editMessage}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area - Moves from center to bottom */}
        <motion.div
          initial={false}
          animate={{
            position: hasMessages ? 'relative' : 'absolute',
            bottom: hasMessages ? 0 : '5%',
            left: 0,
            right: 0,
          }}
          transition={{
            duration: 0.5,
            ease: [0.32, 0.72, 0, 1],
          }}
          className="bg-background z-20 w-full"
        >
          <div className="mx-auto max-w-3xl px-2 sm:px-4">
            <ChatInput
              onSend={(message, file) => {
                safeSendMessage(message, file);
                // Clear file after sending
                if (uploadedFile) {
                  handleRemoveFile();
                }
              }}
              isLoading={isLoading}
              placeholder="Ask Aeris..."
              onFileSelect={handleFileSelect}
              uploadedFile={uploadedFile}
              onRemoveFile={handleRemoveFile}
              errorMessage={fileErrorMessage}
              onClearError={handleClearError}
              onLocationRequest={handleSendLocationQuery}
              locationLoading={isSendingLocation || geolocation.loading}
              hasLocation={geolocation.hasLocation}
            />
          </div>
        </motion.div>

        {/* Footer - only show when user has started a chat */}
        {hasMessages && (
          <footer className="bg-background/30 pb-1.5">
            <div className="mx-auto max-w-4xl px-3 sm:px-4">
              <p className="text-muted-foreground text-center text-[9px] leading-tight sm:text-[10px]">
                Aeris may be incorrect. Verify critical details.
              </p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
