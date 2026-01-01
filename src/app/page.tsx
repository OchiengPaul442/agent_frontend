'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatMessages } from '@/components/ChatMessages';
import { ChatInput } from '@/components/ChatInput';
import { useChat } from '@/hooks/useChat';
import { useSessions } from '@/hooks/useSessions';
import { AqMenu01 } from '@airqo/icons-react';
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
    <div className="from-secondary-50 to-primary-50/30 flex h-screen bg-gradient-to-br via-white">
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
        <header className="glass border-secondary-200/50 border-b px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(true)}
                className="bg-secondary-100 text-secondary-600 hover:bg-secondary-200 focus-ring flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:shadow-md lg:hidden"
                aria-label="Open sidebar"
              >
                <AqMenu01 className="h-5 w-5" />
              </motion.button>

              <div className="flex items-center gap-4">
                <div className="from-primary-400 to-primary-600 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg">
                  <svg
                    className="h-7 w-7"
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
                  <h1 className="gradient-text text-xl font-bold">
                    Air Quality AI
                  </h1>
                  <p className="text-secondary-600 text-sm">
                    Real-time insights & analysis
                  </p>
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
                <div className="animate-pulse-subtle h-2 w-2 rounded-full bg-green-500"></div>
                Live Data
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
