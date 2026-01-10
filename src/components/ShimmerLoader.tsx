import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ShimmerText from './ShimmerText';

const statuses = ['Thinking', 'Analyzing', 'Processing', 'Generating response'];

const ShimmerLoader: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % statuses.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <ShimmerText className="text-sm font-medium tracking-wide sm:text-base">
          {statuses[currentIndex]}
        </ShimmerText>
      </motion.div>

      {/* Pulsing dots like ChatGPT */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1 w-1 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ShimmerLoader;
