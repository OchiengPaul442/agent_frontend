'use client';

import { CostInfo } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { AqAlertTriangle } from '@airqo/icons-react';

interface CostWarningProps {
  costInfo: CostInfo;
  onNewChat?: () => void;
}

export function CostWarning({ costInfo, onNewChat }: CostWarningProps) {
  if (!costInfo.warning) return null;

  const isUrgent = costInfo.usage_percentage >= 90;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`mb-4 rounded-lg border p-4 ${
          isUrgent
            ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
            : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
        }`}
      >
        <div className="flex items-start gap-3">
          <AqAlertTriangle
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              isUrgent ? 'text-red-600' : 'text-amber-600'
            }`}
          />
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                isUrgent
                  ? 'text-red-900 dark:text-red-100'
                  : 'text-amber-900 dark:text-amber-100'
              }`}
            >
              {costInfo.warning}
            </p>

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <span className="text-sm">📊</span>
                <span>
                  {costInfo.usage_percentage.toFixed(1)}% used (
                  {costInfo.total_tokens.toLocaleString()} /{' '}
                  {costInfo.max_tokens.toLocaleString()} tokens)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm">⚡</span>
                <span>${costInfo.total_cost_usd.toFixed(4)}</span>
              </div>
            </div>

            {costInfo.recommendation && (
              <p className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                {costInfo.recommendation}
              </p>
            )}

            {isUrgent && onNewChat && (
              <button
                onClick={onNewChat}
                className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Start New Chat
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
