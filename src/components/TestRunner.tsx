'use client';

import { useState } from 'react';
import { runComprehensiveTests } from '@/tests/api-integration.test';

export function TestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    passed: number;
    failed: number;
    error?: string;
  } | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const testResults = await runComprehensiveTests();
      setResults(testResults);
    } catch (error) {
      console.error('Test execution failed:', error);
      setResults({ passed: 0, failed: 1, error: 'Test execution failed' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <button
        onClick={handleRunTests}
        disabled={isRunning}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRunning ? '🧪 Running Tests...' : '🧪 Run API Tests'}
      </button>

      {results && (
        <div className="mt-2 max-w-sm rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm shadow-xl">
          <div className="mb-2 font-semibold">Test Results:</div>
          <div className="space-y-1 text-xs">
            <div className="text-green-400">✅ Passed: {results.passed}</div>
            <div className="text-red-400">❌ Failed: {results.failed}</div>
            <div className="text-blue-400">
              📈 Success:{' '}
              {(
                (results.passed / (results.passed + results.failed)) *
                100
              ).toFixed(1)}
              %
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Check console for detailed results
          </div>
        </div>
      )}
    </div>
  );
}
