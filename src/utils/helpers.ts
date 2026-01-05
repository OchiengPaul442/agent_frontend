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

  // Apply conservative, safe fixes only — avoid aggressive regexes that
  // can accidentally inject characters (observed stray 'n' and 't').
  sanitized = fixHtmlTags(sanitized);
  sanitized = fixCodeBlockFormatting(sanitized);
  sanitized = fixTableFormatting(sanitized);
  sanitized = fixLinkFormatting(sanitized);

  // Decode common HTML entities to avoid literal sequences in output
  sanitized = decodeHtmlEntities(sanitized);

  return sanitized;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fixMarkdownNewlines(content: string): string {
  let fixed = content;

  // Add newlines before headers (# ## ###) if missing
  fixed = fixed.replace(/([^\n])(#{1,6}\s)/g, '$1\n\n$2');

  // Add newline after headers if missing
  fixed = fixed.replace(/(#{1,6}\s[^\n]+)([^\n])/g, '$1\n\n$2');

  // Add newlines before list items if missing
  fixed = fixed.replace(/([^\n])(\n?[-*+]\s+\*\*)/g, '$1\n\n$2');

  // Add newlines before blockquotes if missing
  fixed = fixed.replace(/([^\n])(>\s)/g, '$1\n\n$2');

  // Fix multiple spaces into single newlines
  fixed = fixed.replace(/\n{3,}/g, '\n\n');

  return fixed;
}

function fixHtmlTags(content: string): string {
  let fixed = content;

  // Convert <br> and <br/> to newlines
  fixed = fixed.replace(/<br\s*\/?\s*>/gi, '\n');

  // Convert bullet points • to markdown list items
  // Assuming • is followed by text, convert to -
  fixed = fixed.replace(/•\s*/g, '- ');

  // Remove other HTML tags if any, but keep the content. Avoid removing
  // tags like <br> which we already converted.
  fixed = fixed.replace(/<\/?(?!br)[^>]*>/gi, '');

  return fixed;
}

function fixTableFormatting(content: string): string {
  // Ensure tables have proper formatting for ReactMarkdown
  // Add minimal spacing around pipes to ensure proper parsing
  const lines = content.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    if (line.includes('|')) {
      // For table rows, ensure proper spacing
      const parts = line.split('|');
      if (parts.length > 2) {
        // This looks like a table row
        const formatted =
          '| ' +
          parts
            .slice(1, -1)
            .map((p) => p.trim())
            .join(' | ') +
          ' |';
        result.push(formatted);
      } else {
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fixListFormatting(content: string): string {
  // Fix inconsistent list markers
  const listRegex = /^(\s*)([-*+])\s+/gm;

  return content.replace(listRegex, (match, indent) => {
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

// Minimal HTML entity decoder for common entities used in responses.
function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Strip markdown syntax for plain text rendering (e.g., PDF)
export function stripMarkdown(content: string): string {
  if (!content) return content;

  let stripped = content;

  // Remove code blocks
  stripped = stripped.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  stripped = stripped.replace(/`([^`]+)`/g, '$1');

  // Remove links, keep text
  stripped = stripped.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove images
  stripped = stripped.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Remove headers
  stripped = stripped.replace(/^#{1,6}\s+/gm, '');

  // Remove bold and italic
  stripped = stripped.replace(/\*\*([^*]+)\*\*/g, '$1');
  stripped = stripped.replace(/\*([^*]+)\*/g, '$1');
  stripped = stripped.replace(/_([^_]+)_/g, '$1');

  // Remove strikethrough
  stripped = stripped.replace(/~~([^~]+)~~/g, '$1');

  // Remove list markers
  stripped = stripped.replace(/^[\s]*[-*+]\s+/gm, '');
  stripped = stripped.replace(/^[\s]*\d+\.\s+/gm, '');

  // Remove blockquotes
  stripped = stripped.replace(/^>\s+/gm, '');

  // Remove horizontal rules
  stripped = stripped.replace(/^[-*_]{3,}$/gm, '');

  // Clean up extra whitespace
  stripped = stripped.replace(/\n{3,}/g, '\n\n');
  stripped = stripped.trim();

  // Normalize common unicode characters to ASCII for PDF compatibility
  stripped = stripped
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // Dashes
    .replace(/\u2026/g, '...') // Ellipsis
    .replace(/\u00A0/g, ' '); // Non-breaking space

  return stripped;
}
