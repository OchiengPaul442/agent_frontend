'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { useChat } from '@/hooks/useChat';
import { useSessions } from '@/hooks/useSessions';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >();

  const { sessions, isLoading: sessionsLoading, deleteSession } = useSessions();
  const { messages, isLoading, error, sendMessage, clearMessages, retry } =
    useChat({
      sessionId: selectedSessionId,
      onError: (err) => console.error('Chat error:', err),
    });

  // Keep sidebar open on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNewSession = async () => {
    clearMessages();
    setSelectedSessionId(undefined);
    setIsSidebarOpen(false);
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      if (selectedSessionId === sessionId) {
        clearMessages();
        setSelectedSessionId(undefined);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <Sidebar
        sessions={sessions}
        currentSessionId={selectedSessionId}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        isLoading={sessionsLoading}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col">
        {/* Enhanced Header */}
        <header className="glass border-secondary-200/60 border-b px-4 py-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(true)}
                className="bg-secondary-100 text-secondary-600 hover:bg-secondary-200 focus-ring flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:shadow-sm lg:hidden"
                aria-label="Open sidebar"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </motion.button>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-lg font-semibold text-transparent">
                    Air Quality AI
                  </h1>
                  <p className="text-secondary-500 text-xs">
                    Real-time insights
                  </p>
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></div>
                Live
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
          onSendMessage={sendMessage}
        />

        {/* Input */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
