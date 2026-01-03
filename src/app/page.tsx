'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useChat } from '@/hooks/useChat';
import { apiService } from '@/services/api.service';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/helpers';

// Generate a stable session ID for the browser session
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Starter questions for air quality (professional / policy oriented)
const STARTER_QUESTIONS = [
  'How can I monitor air quality in real-time for my location?',
  'Recommend evidence-based strategies to improve indoor air quality in offices and schools.',
  'Summarize the health impacts of chronic PM2.5 exposure and relevant threshold values.',
  'Outline practical policy measures to reduce urban air pollution and improve compliance.',
];

export default function HomePage() {
  // Initialize session ID once and keep it stable
  const [sessionId, setSessionId] = useState<string>(() => {
    // Try to get from sessionStorage first
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('currentSessionId');
      if (stored) return stored;
    }
    const newId = generateSessionId();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('currentSessionId', newId);
    }
    return newId;
  });

  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retry,
    editMessage,
  } = useChat({
    sessionId,
    onError: (err) => console.error('Chat error:', err),
  });

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
          // Use fetch with keepalive to send DELETE request reliably on page unload
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/sessions/${sessionId}`,
            {
              method: 'DELETE',
              keepalive: true,
            }
          );
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

  const handleStarterQuestion = (question: string) => {
    sendMessage(question);
  };

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
      // Delete the old session
      try {
        await apiService.deleteSession(sessionId);
      } catch (err) {
        console.error('Failed to delete old session:', err);
      }

      // Clear current messages
      clearMessages();

      // Generate new session ID
      const newId = generateSessionId();
      setSessionId(newId);

      // Store in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('currentSessionId', newId);
      }
    } catch (err) {
      console.error('Failed to create new session:', err);
      alert('Failed to start new conversation. Please try again.');
    }
  };

  return (
    <div className="bg-background relative flex h-screen flex-col">
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
      <header className="border-border bg-background/80 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Aeris Logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg"
            />
            <h1 className="text-foreground text-lg font-medium">Aeris</h1>
          </div>
          {hasMessages && (
            <button
              onClick={handleNewSession}
              className="border-border bg-background text-foreground hover:bg-muted focus:ring-ring flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:ring-2 focus:outline-none"
            >
              <svg
                className="h-4 w-4"
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

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Welcome Screen (Centered) */}
        <AnimatePresence>
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-background absolute inset-0 z-10 flex flex-col items-center justify-center px-4 pb-32"
            >
              <div className="w-full max-w-3xl space-y-8">
                <div className="text-center">
                  <h2 className="text-foreground mb-2 text-3xl font-semibold sm:text-4xl">
                    Ready when you are.
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Ask me anything about air quality
                  </p>
                </div>

                {/* Starter Questions */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {STARTER_QUESTIONS.map((question, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                      onClick={() => handleStarterQuestion(question)}
                      className="group border-border bg-card hover:border-border focus:ring-ring rounded-xl border p-4 text-left shadow-sm transition-all hover:shadow-md focus:ring-2 focus:outline-none"
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
                        <span className="text-card-foreground group-hover:text-primary text-sm font-medium">
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
                error={error}
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
        className={cn(
          'bg-background z-20 w-full',
          hasMessages ? 'border-border border-t' : ''
        )}
      >
        <div className="mx-auto max-w-3xl px-4">
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            placeholder="Ask Aeris..."
            hasMessages={hasMessages}
          />
        </div>
      </motion.div>
    </div>
  );
}
