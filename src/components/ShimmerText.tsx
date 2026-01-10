import React from 'react';

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  speed?: string;
}

const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  className = '',
  speed = 'animate-shine',
}) => {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${speed} bg-[linear-gradient(90deg,transparent_0%,theme(colors.slate.50)_50%,transparent_100%)] bg-[length:200%_100%] dark:bg-[linear-gradient(90deg,transparent_0%,theme(colors.slate.400)_50%,transparent_100%)] ${className} `}
    >
      {children}
    </span>
  );
};

export default ShimmerText;
