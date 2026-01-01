'use client';

import { useState, useEffect } from 'react';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useChat } from '@/hooks/useChat';
import { apiService } from '@/services/api.service';

// Generate a stable session ID for the browser session
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

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

  const { messages, isLoading, error, sendMessage, clearMessages, retry } =
    useChat({
      sessionId,
      onError: (err) => console.error('Chat error:', err),
    });

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
    <div className="flex h-screen flex-col bg-white">
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
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            Air Quality AI
          </h1>
          <button
            onClick={handleNewSession}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none"
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
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
        />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
