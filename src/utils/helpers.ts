import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateSessionTitle(firstMessage: string): string {
  return truncate(firstMessage, 50);
}

// Debounce utility to prevent rapid API calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for rate limiting
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Sleep utility for delays
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Markdown sanitization and formatting utilities
export function sanitizeMarkdown(content: string): string {
  if (!content) return content;

  let sanitized = content;

  // Fix common table formatting issues
  sanitized = fixTableFormatting(sanitized);

  // Fix code block formatting
  sanitized = fixCodeBlockFormatting(sanitized);

  // Fix list formatting
  sanitized = fixListFormatting(sanitized);

  // Fix link formatting
  sanitized = fixLinkFormatting(sanitized);

  return sanitized;
}

function fixTableFormatting(content: string): string {
  // Pattern to match malformed tables with extra pipes
  const malformedTableRegex =
    /\|[\s-]+\|[\s-]+\|[\s-]+\|\s*\n(\|.*\|.*\|.*\|\s*\n)+/g;

  return content.replace(malformedTableRegex, (match) => {
    const lines = match.trim().split('\n');

    // Remove the separator line if it exists and is malformed
    if (lines.length >= 2) {
      const separatorLine = lines[1];
      // Check if separator line has extra pipes or dashes
      if (
        separatorLine.includes('| ----------------') ||
        separatorLine.match(/\|[\s-]+\|/g)
      ) {
        // Remove the malformed separator and reconstruct proper table
        const headerLine = lines[0];
        const dataLines = lines.slice(2);

        // Extract headers
        const headers = headerLine
          .split('|')
          .slice(1, -1)
          .map((h) => h.trim());
        const numCols = headers.length;

        // Create proper separator
        const separator = '| ' + headers.map(() => '---').join(' | ') + ' |';

        // Fix data lines
        const fixedDataLines = dataLines.map((line) => {
          const cells = line
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim());
          // Ensure we have the right number of cells
          while (cells.length < numCols) cells.push('');
          return '| ' + cells.slice(0, numCols).join(' | ') + ' |';
        });

        return [headerLine, separator, ...fixedDataLines].join('\n') + '\n';
      }
    }

    return match;
  });
}

function fixCodeBlockFormatting(content: string): string {
  // Ensure code blocks have proper language specification if missing
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;

  return content.replace(codeBlockRegex, (match, lang, code) => {
    const language = lang || '';
    const cleanCode = code.trim();
    return `\`\`\`${language}\n${cleanCode}\n\`\`\``;
  });
}

function fixListFormatting(content: string): string {
  // Fix inconsistent list markers
  const listRegex = /^(\s*)([-*+])\s+/gm;

  return content.replace(listRegex, (match, indent, marker) => {
    // Standardize to dashes
    return indent + '- ';
  });
}

function fixLinkFormatting(content: string): string {
  // Fix malformed links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return content.replace(linkRegex, (match, text, url) => {
    // Ensure URL is properly formatted
    let cleanUrl = url.trim();
    if (!cleanUrl.match(/^https?:\/\//) && !cleanUrl.startsWith('#')) {
      // Assume http if no protocol
      cleanUrl = 'https://' + cleanUrl;
    }
    return `[${text.trim()}](${cleanUrl})`;
  });
}
