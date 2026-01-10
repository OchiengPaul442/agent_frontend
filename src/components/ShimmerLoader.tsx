import React, { useState, useEffect } from 'react';
import ShimmerText from './ShimmerText';

const statuses = [
  'Searching...',
  'Analyzing...',
  'Thinking...',
  'Processing...',
  'Loading...',
  'Working...',
];

const ShimmerLoader: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState(statuses[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * statuses.length);
      setCurrentStatus(statuses[randomIndex]);
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center p-4">
      <ShimmerText className="text-lg font-medium text-slate-900 dark:text-slate-100">
        {currentStatus}
      </ShimmerText>
    </div>
  );
};

export default ShimmerLoader;
