'use client';

import { Session } from '@/types';
import { cn, formatDate } from '@/utils/helpers';
import { motion } from 'framer-motion';
import {
  AqClock,
  AqMessageChatSquare,
  AqTrash01,
  AqX,
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
          'fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-slate-200/50 bg-white/95 shadow-2xl backdrop-blur-sm',
          // Desktop: always visible with relative positioning
          'lg:static lg:z-0 lg:shadow-none',
          // Mobile: overlay behavior
          !isOpen && 'pointer-events-none lg:pointer-events-auto'
        )}
      >
        {/* Header */}
        <div className="border-b border-slate-200/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-xl font-bold text-transparent">
              Chat History
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none lg:hidden"
              aria-label="Close sidebar"
            >
              <AqX className="h-5 w-5" />
            </button>
          </div>

          <motion.button
            onClick={onNewSession}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-xl focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Conversation
          </motion.button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <AqClock className="h-8 w-8" />
              </div>
              <p className="mb-2 text-base font-medium text-slate-700">
                No conversations yet
              </p>
              <p className="max-w-xs text-sm text-slate-500">
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
                      'flex w-full items-start gap-3 rounded-2xl px-4 py-4 text-left transition-all hover:shadow-md focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none',
                      currentSessionId === session.session_id
                        ? 'border border-amber-200 bg-amber-50 text-amber-900 shadow-md'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                        currentSessionId === session.session_id
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      )}
                    >
                      <AqMessageChatSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 truncate text-sm font-semibold text-slate-900">
                        {session.title || 'Untitled Conversation'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
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
                    className="absolute top-4 right-3 rounded-lg p-2 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
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
        <div className="border-t border-slate-200/50 bg-slate-50/50 p-6">
          <div className="text-sm text-slate-600">
            <p className="mb-1 font-semibold text-slate-900">
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
