/**
 * ThinkingDisplay Component
 *
 * Displays AI reasoning/thinking steps with collapsible interface
 * Optimized for health-critical applications where transparency is essential
 *
 * @example
 * ```tsx
 * <ThinkingDisplay
 *   thinking={message.thinking_steps || []}
 *   duration={message.thinking_duration}
 *   defaultExpanded={true}
 * />
 * ```
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ThinkingDisplayProps {
  /** Array of thinking/reasoning steps */
  thinking: string[];

  /** Whether stream is currently active */
  isStreaming?: boolean;

  /** Duration of thinking process in milliseconds */
  duration?: number;

  /** Whether thinking is expanded by default (recommended true for health apps) */
  defaultExpanded?: boolean;

  /** Optional class name */
  className?: string;
}

/**
 * Component to display AI thinking/reasoning steps
 */
export const ThinkingDisplay: React.FC<ThinkingDisplayProps> = ({
  thinking,
  isStreaming = false,
  duration = 0,
  defaultExpanded = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming && isExpanded && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [thinking, isStreaming, isExpanded]);

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Get icon based on step content
  const getStepIcon = (step: string): string => {
    const lower = step.toLowerCase();
    if (lower.includes('data') || lower.includes('retrieve')) return '📊';
    if (lower.includes('health') || lower.includes('risk')) return '❤️';
    if (lower.includes('assess') || lower.includes('analyz')) return '🔍';
    if (lower.includes('recommend') || lower.includes('suggest')) return '💡';
    if (lower.includes('warning') || lower.includes('alert')) return '⚠️';
    return '→';
  };

  // Calculate thinking complexity
  const complexity =
    thinking.length > 0 ? Math.min(thinking.length / 10, 1) : 0;

  const complexityLabel =
    complexity < 0.3 ? 'Simple' : complexity < 0.7 ? 'Moderate' : 'Complex';

  if (thinking.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <div
      className={`thinking-display ${className}`}
      role="region"
      aria-label="AI Reasoning Process"
    >
      {/* Header */}
      <button
        className="thinking-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="thinking-content"
      >
        <span className="thinking-indicator">
          {isStreaming ? (
            <span className="pulse-dots" aria-label="Thinking in progress">
              ●●●
            </span>
          ) : (
            <span className="check-mark" aria-label="Thinking complete">
              ✓
            </span>
          )}
        </span>

        <span className="thinking-label">
          {isStreaming
            ? 'Analyzing air quality data...'
            : `Analyzed in ${formatDuration(duration)}`}
        </span>

        <span className="thinking-meta">
          <span className="step-count">{thinking.length} steps</span>
          <span
            className="complexity-badge"
            data-complexity={complexityLabel.toLowerCase()}
          >
            {complexityLabel}
          </span>
        </span>

        <span
          className={`chevron ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div
          id="thinking-content"
          ref={contentRef}
          className="thinking-content"
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
          <div className="thinking-steps">
            {thinking.map((step, index) => (
              <div key={index} className="thinking-step" data-index={index + 1}>
                <span className="step-icon" aria-hidden="true">
                  {getStepIcon(step)}
                </span>
                <span className="step-number">Step {index + 1}</span>
                <span className="step-text">{step}</span>
              </div>
            ))}

            {isStreaming && (
              <div className="thinking-step streaming">
                <span className="step-icon">⏳</span>
                <span className="step-text">
                  <span className="cursor">▊</span>
                </span>
              </div>
            )}
          </div>

          {/* Footer with explanation */}
          {!isStreaming && thinking.length > 0 && (
            <div className="thinking-footer">
              <p className="thinking-explanation">
                💡 <strong>Why show this?</strong> For health-critical air
                quality recommendations, we show our reasoning to help you
                understand how we reached our conclusions.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Compact version for list views
 */
export const ThinkingBadge: React.FC<{
  stepCount: number;
  duration: number;
  onClick?: () => void;
}> = ({ stepCount, duration, onClick }) => {
  return (
    <button
      className="thinking-badge"
      onClick={onClick}
      aria-label={`View ${stepCount} reasoning steps`}
    >
      <span className="badge-icon">🧠</span>
      <span className="badge-text">{stepCount} steps</span>
      <span className="badge-duration">
        (
        {duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`}
        )
      </span>
    </button>
  );
};

export default ThinkingDisplay;
