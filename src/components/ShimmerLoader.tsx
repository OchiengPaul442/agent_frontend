import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ShimmerText from './ShimmerText';

const statuses = ['Thinking', 'Analyzing', 'Processing', 'Generating response'];

const ShimmerLoader: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // sync cycle duration with shimmer
  const cycle = 1400; // ms

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % statuses.length);
    }, cycle);

    return () => clearInterval(interval);
  }, [cycle]);

  // convert ms to seconds for ShimmerText
  const durationSec = cycle / 1000;

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <ShimmerText
            key={currentIndex}
            className="text-sm font-medium tracking-wide sm:text-base"
            duration={durationSec}
            spread={0.45}
          >
            {statuses[currentIndex]}
          </ShimmerText>
        </motion.div>
      </AnimatePresence>

      {/* Dots: wave synced to shimmer cycle */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.45, 1] }}
            transition={{
              duration: durationSec,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (i * durationSec) / 6,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ShimmerLoader;
