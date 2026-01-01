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
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
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
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(true)}
              className="rounded-lg p-2 transition-colors hover:bg-slate-100 lg:hidden"
            >
              <AqMenu01 className="h-5 w-5 text-slate-700" />
            </motion.button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                <svg
                  className="h-6 w-6"
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
                <h1 className="text-lg font-bold text-slate-900">
                  Air Quality AI
                </h1>
                <p className="text-sm text-slate-600">Real-time insights</p>
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
