import React from 'react';
import { motion } from 'framer-motion';

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  duration?: number; // seconds
}

/**
 * ShimmerText component that creates a shimmering effect on text using Framer Motion.
 * The shimmer moves from left to right across the text, on top of the text's color.
 */
const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  className = '',
  duration = 1.5,
}) => {
  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, currentColor 0%, currentColor 100%), linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)`,
        backgroundSize: `100% 100%, 200% 100%`,
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundPosition: `0% 0%, -100% 0%`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
      }}
      animate={{
        backgroundPosition: [`0% 0%, -100% 0%`, `0% 0%, 100% 0%`],
      }}
      transition={{
        duration,
        ease: 'linear',
        repeat: Infinity,
      }}
    >
      {children}
    </motion.span>
  );
};

export default ShimmerText;
