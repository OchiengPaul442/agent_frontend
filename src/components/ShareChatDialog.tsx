'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AqX,
  AqCopy01,
  AqCheckCircle,
  AqDownload01,
  AqShare07,
  AqLink01,
} from '@airqo/icons-react';
import { stripMarkdown } from '@/utils/helpers';

interface ShareChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  sessionId?: string;
}

export function ShareChatDialog({
  isOpen,
  onClose,
  messages,
  sessionId,
}: ShareChatDialogProps) {
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState<
    'text' | 'json' | 'markdown' | null
  >(null);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const copyTimeoutRef = useRef<number | null>(null);

  // Initialize selected messages - reset when dialog opens
  const [selectedMessages, setSelectedMessages] = useState<Set<number>>(
    new Set()
  );
  const [lastOpenState, setLastOpenState] = useState(isOpen);

  // Reset selection when dialog opens (derived from isOpen change)
  if (isOpen !== lastOpenState) {
    setLastOpenState(isOpen);
    if (isOpen) {
      setSelectedMessages(new Set(messages.map((_, idx) => idx)));
    }
  }

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const getSelectedMessages = () => {
    return messages.filter((_, idx) => selectedMessages.has(idx));
  };

  const formatMessagesAsText = () => {
    return getSelectedMessages()
      .map((msg) => {
        const role = msg.role === 'user' ? 'You' : 'Aeris-AQ';
        const timestamp =
          includeTimestamps && msg.timestamp
            ? ` [${new Date(msg.timestamp).toLocaleString()}]`
            : '';
        const content = stripMarkdown(msg.content);
        return `${role}${timestamp}:\n${content}\n`;
      })
      .join('\n---\n\n');
  };

  const formatMessagesAsMarkdown = () => {
    let markdown = `# Aeris-AQ Chat Export\n\n`;
    if (sessionId) {
      markdown += `**Session ID:** ${sessionId}\n\n`;
    }
    markdown += `**Exported:** ${new Date().toLocaleString()}\n\n`;
    markdown += `**Messages:** ${selectedMessages.size} of ${messages.length}\n\n`;
    markdown += `---\n\n`;

    getSelectedMessages().forEach((msg) => {
      const role = msg.role === 'user' ? '👤 You' : '🤖 Aeris-AQ';
      const timestamp =
        includeTimestamps && msg.timestamp
          ? ` • *${new Date(msg.timestamp).toLocaleString()}*`
          : '';

      markdown += `### ${role}${timestamp}\n\n`;
      markdown += `${msg.content}\n\n`;

      if (msg.file) {
        markdown += `*📎 Attached file: ${msg.file.name}*\n\n`;
      }

      if (msg.tools_used && msg.tools_used.length > 0) {
        markdown += `*🔧 Tools used: ${msg.tools_used.join(', ')}*\n\n`;
      }

      markdown += `---\n\n`;
    });

    return markdown;
  };

  const formatMessagesAsJSON = () => {
    const exportData = {
      session_id: sessionId,
      exported_at: new Date().toISOString(),
      total_messages: messages.length,
      exported_messages: selectedMessages.size,
      messages: getSelectedMessages().map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        tools_used: msg.tools_used,
        file: msg.file
          ? {
              name: msg.file.name,
              size: msg.file.size,
              type: msg.file.type,
            }
          : undefined,
      })),
    };
    return JSON.stringify(exportData, null, 2);
  };

  const handleCopyToClipboard = async () => {
    try {
      let content = '';
      switch (shareMethod) {
        case 'text':
          content = formatMessagesAsText();
          break;
        case 'markdown':
          content = formatMessagesAsMarkdown();
          break;
        case 'json':
          content = formatMessagesAsJSON();
          break;
        default:
          content = formatMessagesAsText();
      }

      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (shareMethod) {
      case 'text':
        content = formatMessagesAsText();
        filename = `aeris-aq-chat-${Date.now()}.txt`;
        mimeType = 'text/plain';
        break;
      case 'markdown':
        content = formatMessagesAsMarkdown();
        filename = `aeris-aq-chat-${Date.now()}.md`;
        mimeType = 'text/markdown';
        break;
      case 'json':
        content = formatMessagesAsJSON();
        filename = `aeris-aq-chat-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      default:
        content = formatMessagesAsText();
        filename = `aeris-aq-chat-${Date.now()}.txt`;
        mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      // Fallback to copy
      handleCopyToClipboard();
      return;
    }

    try {
      const content = formatMessagesAsText();
      await navigator.share({
        title: 'Aeris-AQ Chat',
        text: content,
      });
    } catch (err) {
      // User cancelled or error occurred
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
        // Fallback to copy
        handleCopyToClipboard();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-card border-border relative w-full max-w-lg rounded-2xl border shadow-2xl"
            >
              {/* Header */}
              <div className="border-border flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                    <AqShare07 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-foreground text-lg font-semibold">
                      Share Chat
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {messages.length} message
                      {messages.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors"
                >
                  <AqX className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6 p-6">
                {/* Format Selection */}
                <div>
                  <label className="text-foreground mb-3 block text-sm font-medium">
                    Choose Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setShareMethod('text')}
                      className={`border-border hover:border-primary flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        shareMethod === 'text'
                          ? 'border-primary bg-primary/5'
                          : 'bg-card'
                      }`}
                    >
                      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                        <span className="text-lg">📄</span>
                      </div>
                      <span className="text-foreground text-sm font-medium">
                        Plain Text
                      </span>
                    </button>

                    <button
                      onClick={() => setShareMethod('markdown')}
                      className={`border-border hover:border-primary flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        shareMethod === 'markdown'
                          ? 'border-primary bg-primary/5'
                          : 'bg-card'
                      }`}
                    >
                      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                        <span className="text-lg">📝</span>
                      </div>
                      <span className="text-foreground text-sm font-medium">
                        Markdown
                      </span>
                    </button>

                    <button
                      onClick={() => setShareMethod('json')}
                      className={`border-border hover:border-primary flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        shareMethod === 'json'
                          ? 'border-primary bg-primary/5'
                          : 'bg-card'
                      }`}
                    >
                      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                        <span className="text-lg">🔧</span>
                      </div>
                      <span className="text-foreground text-sm font-medium">
                        JSON
                      </span>
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={includeTimestamps}
                      onChange={(e) => setIncludeTimestamps(e.target.checked)}
                      className="border-border text-primary focus:ring-primary h-4 w-4 rounded"
                    />
                    <span className="text-foreground text-sm">
                      Include timestamps
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCopyToClipboard}
                    disabled={!shareMethod}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium shadow-sm transition-colors disabled:cursor-not-allowed"
                  >
                    {copied ? (
                      <>
                        <AqCheckCircle className="h-5 w-5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <AqCopy01 className="h-5 w-5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    disabled={!shareMethod}
                    className="border-border bg-card hover:bg-muted text-foreground disabled:bg-muted disabled:text-muted-foreground flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    <AqDownload01 className="h-5 w-5" />
                    <span>Download</span>
                  </button>
                </div>

                {/* Native Share (if supported) */}
                {typeof window !== 'undefined' &&
                  typeof navigator.share !== 'undefined' && (
                    <button
                      onClick={handleNativeShare}
                      disabled={!shareMethod}
                      className="border-border hover:bg-muted text-foreground disabled:bg-muted disabled:text-muted-foreground flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      <AqLink01 className="h-5 w-5" />
                      <span>Share via...</span>
                    </button>
                  )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
