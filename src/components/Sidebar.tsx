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
          'fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-slate-200 bg-white shadow-xl',
          // Desktop: always visible with relative positioning
          'lg:static lg:z-0 lg:shadow-none',
          // Mobile: overlay behavior
          !isOpen && 'pointer-events-none lg:pointer-events-auto'
        )}
      >
        {/* Header */}
        <div className="border-b border-slate-200 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Chat History</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-slate-100 lg:hidden"
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:from-red-600 hover:to-red-700 hover:shadow-xl"
          >
            <AqPlus className="h-4 w-4" />
            New Chat
          </motion.button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AqClock className="mb-3 h-12 w-12 text-slate-300" />
              <p className="text-sm text-slate-500">No chat history yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Start a new conversation
              </p>
            </div>
          ) : (
            <div className="space-y-1">
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
                      'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-all',
                      currentSessionId === session.session_id
                        ? 'bg-red-50 text-red-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <AqMessageChatSquare className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {session.title || 'Untitled Chat'}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
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
                    className={cn(
                      'absolute top-3 right-2 rounded-md p-1.5 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600'
                    )}
                  >
                    <AqTrash01 className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-600">
            <p className="font-medium">Air Quality AI Agent</p>
            <p className="mt-1">Powered by real-time global data</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
