import React from 'react';
import { motion } from 'framer-motion';

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
}

const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  className = '',
}) => {
  return (
    <motion.span
      className={`animate-shimmer inline-block bg-gradient-to-r from-gray-400 via-gray-100 to-gray-400 bg-[length:200%_100%] bg-clip-text text-transparent dark:from-gray-600 dark:via-gray-200 dark:to-gray-600 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.span>
  );
};

export default ShimmerText;
