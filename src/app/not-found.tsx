'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AqHome01, AqSearchRefraction } from '@airqo/icons-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        {/* 404 Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="mb-8 flex justify-center"
        >
          <div className="bg-primary/10 rounded-full p-6">
            <AqSearchRefraction className="text-primary h-20 w-20" />
          </div>
        </motion.div>

        {/* 404 Text */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-foreground text-7xl font-bold"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mt-4 text-lg"
        >
          Oops! This page doesn&apos;t exist
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mt-2 text-sm"
        >
          The page you&apos;re looking for might have been moved or doesn&apos;t
          exist.
        </motion.p>

        {/* Go Home Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
          >
            <AqHome01 className="h-4 w-4" />
            Go Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
