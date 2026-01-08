'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  className?: string;
}

const thinkingPhrases = [
  'Analyzing your request',
  'Processing information',
  'Formulating response',
  'Gathering insights',
  'Considering options',
  'Thinking deeply',
  'Examining details',
];

export function TypingIndicator({ className = '' }: TypingIndicatorProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % thinkingPhrases.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Animated dots */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="bg-primary h-2 w-2 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Rotating thinking phrase */}
      <motion.span
        key={phraseIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-muted-foreground text-sm"
      >
        {thinkingPhrases[phraseIndex]}...
      </motion.span>
    </div>
  );
}
