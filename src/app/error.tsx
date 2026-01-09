'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AqAlertTriangle, AqRefreshCw01 } from '@airqo/icons-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <div className="bg-destructive/10 rounded-full p-6">
            <AqAlertTriangle className="text-destructive h-16 w-16" />
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-foreground text-3xl font-bold"
        >
          Something went wrong
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground mt-4 text-base"
        >
          An unexpected error occurred. Don&apos;t worry, you can try again.
        </motion.p>

        {/* Error Details (dev mode) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <motion.details
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-left"
          >
            <summary className="text-muted-foreground cursor-pointer text-sm">
              Error details
            </summary>
            <pre className="text-destructive bg-muted mt-2 overflow-x-auto rounded-lg p-4 text-xs">
              {error.message}
            </pre>
          </motion.details>
        )}

        {/* Retry Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
        >
          <AqRefreshCw01 className="h-4 w-4" />
          Try again
        </motion.button>
      </motion.div>
    </div>
  );
}
