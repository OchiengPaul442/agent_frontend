'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AqAlertTriangle, AqX } from '@airqo/icons-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  type = 'warning',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const colorClasses = {
    warning: {
      icon: 'bg-amber-500/10 text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500',
    },
    danger: {
      icon: 'bg-destructive/10 text-destructive',
      button: 'bg-destructive hover:bg-destructive/90 focus:ring-destructive',
    },
    info: {
      icon: 'bg-primary/10 text-primary',
      button: 'bg-primary hover:bg-primary/90 focus:ring-primary',
    },
  };

  const colors = colorClasses[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-background glass-dark relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-ring absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
                aria-label="Close dialog"
              >
                <AqX className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className="mb-4 flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}
                >
                  <AqAlertTriangle className="h-6 w-6" />
                </div>
                <h2 className="text-foreground text-xl font-semibold">
                  {title}
                </h2>
              </div>

              {/* Message */}
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="border-border bg-background text-foreground hover:bg-muted focus:ring-ring flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`text-primary-foreground flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none ${colors.button}`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
