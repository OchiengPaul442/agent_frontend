'use client';

import { useEffect } from 'react';
import { AqLoading02 } from '@airqo/icons-react';

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
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-foreground text-4xl font-bold">
        Something went wrong!
      </h1>
      <p className="text-muted-foreground mt-4 text-lg">
        An error occurred while loading the page.
      </p>
      <button
        onClick={reset}
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 rounded-lg px-4 py-2"
      >
        Try again
      </button>
    </div>
  );
}
