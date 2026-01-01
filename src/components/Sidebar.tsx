'use client';

import { Session } from '@/types';
import { cn, formatDate } from '@/utils/helpers';
import { motion } from 'framer-motion';
import {
  AqMessageChatSquare,
  AqTrash01,
  AqPlus,
  AqClock,
} from '@airqo/icons-react';

interface SidebarProps {
  sessions: Session[];
  currentSessionId?: string;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  isLoading = false,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn(
          'glass border-secondary-200/50 fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r shadow-2xl',
          // Desktop: always visible with relative positioning
          'lg:static lg:z-0 lg:shadow-none',
          // Mobile: overlay behavior
          !isOpen && 'pointer-events-none lg:pointer-events-auto'
        )}
      >
        {/* Header */}
        <div className="border-secondary-200/50 border-b p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="gradient-text text-xl font-bold">Chat History</h2>
            <button
              onClick={onClose}
              className="bg-secondary-100 text-secondary-600 hover:bg-secondary-200 focus-ring flex h-8 w-8 items-center justify-center rounded-lg transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <motion.button
            onClick={onNewSession}
            whileTap={{ scale: 0.98 }}
            className="from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus-ring flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r px-5 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          >
            <AqPlus className="h-5 w-5" />
            New Conversation
          </motion.button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-3 border-t-transparent"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-secondary-100 text-secondary-400 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                <AqClock className="h-8 w-8" />
              </div>
              <p className="text-secondary-700 mb-2 text-base font-medium">
                No conversations yet
              </p>
              <p className="text-secondary-500 max-w-xs text-sm">
                Start your first conversation to see chat history here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <motion.div
                  key={session.session_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group relative"
                >
                  <button
                    onClick={() => onSessionSelect(session.session_id)}
                    className={cn(
                      'focus-ring flex w-full items-start gap-3 rounded-2xl px-4 py-4 text-left transition-all hover:shadow-md',
                      currentSessionId === session.session_id
                        ? 'bg-primary-50 text-primary-900 border-primary-200 border shadow-md'
                        : 'text-secondary-700 hover:bg-secondary-50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                        currentSessionId === session.session_id
                          ? 'bg-primary-500 text-white'
                          : 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-200'
                      )}
                    >
                      <AqMessageChatSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-secondary-900 mb-1 truncate text-sm font-semibold">
                        {session.title || 'Untitled Conversation'}
                      </p>
                      <div className="text-secondary-500 flex items-center gap-3 text-xs">
                        <span>{formatDate(session.updated_at)}</span>
                        <span>•</span>
                        <span>{session.message_count} messages</span>
                      </div>
                    </div>
                  </button>

                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.session_id);
                    }}
                    className="text-secondary-400 focus-ring absolute top-4 right-3 rounded-lg p-2 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete conversation"
                  >
                    <AqTrash01 className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-secondary-200/50 bg-secondary-50/50 border-t p-6">
          <div className="text-secondary-600 text-sm">
            <p className="text-secondary-900 mb-1 font-semibold">
              Air Quality AI Agent
            </p>
            <p className="leading-relaxed">
              Real-time global air quality monitoring and intelligent analysis
              powered by advanced AI
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
