# Chain-of-Thought (CoT) Implementation Guide

This guide explains how Chain-of-Thought reasoning is implemented in the AERIS-AQ frontend.

## Overview

The frontend now supports displaying AI reasoning steps (Chain-of-Thought) from reasoning models like:

- **DeepSeek R1** - Deep reasoning with full thinking exposure
- **Nemotron-3-nano** (Ollama) - FREE local reasoning
- **Gemini 2.5 Flash** - Fast reasoning with thinking mode
- **Kimi K2** - Complex agentic workflows

## Architecture

### 1. Type System (`src/types/index.ts`)

Added thinking/reasoning fields to core types:

```typescript
export interface Message {
  // ... existing fields
  thinking_steps?: string[]; // Array of reasoning steps
  reasoning_content?: string; // Full reasoning as string
  thinking_duration?: number; // Duration in milliseconds
}

export interface ChatResponse {
  // ... existing fields
  thinking_steps?: string[];
  reasoning_content?: string;
}
```

### 2. Components

#### ThinkingDisplay (`src/components/ThinkingDisplay.tsx`)

Displays AI reasoning steps with collapsible interface:

```tsx
<ThinkingDisplay
  thinking={message.thinking_steps || []}
  isStreaming={message.isStreaming}
  duration={message.thinking_duration || 0}
  defaultExpanded={true}
/>
```

**Features:**

- ✅ Collapsible interface with step-by-step display
- ✅ Auto-scroll during streaming
- ✅ Complexity badges (Simple/Moderate/Complex)
- ✅ Icon-based categorization (📊 Data, ❤️ Health, 🔍 Analysis, etc.)
- ✅ Accessibility support (ARIA labels, keyboard navigation)
- ✅ Responsive design
- ✅ Dark mode support

#### MessageBubble Integration

ThinkingDisplay is automatically shown in assistant messages when `thinking_steps` are available:

```tsx
{
  !isUser && message.thinking_steps && message.thinking_steps.length > 0 && (
    <div className="mt-4">
      <ThinkingDisplay
        thinking={message.thinking_steps}
        isStreaming={message.isStreaming}
        duration={message.thinking_duration || 0}
        defaultExpanded={true}
      />
    </div>
  );
}
```

### 3. Hooks

#### useThinkingStream (`src/hooks/useThinkingStream.ts`)

Hook for consuming AI reasoning streams in real-time:

```typescript
const { thinking, content, isStreaming, error, sendMessage } =
  useThinkingStream();

// Send message with streaming
await sendMessage({
  message: 'What is the air quality in Kampala?',
  sessionId: currentSession,
  file: uploadedFile,
  latitude: 0.3476,
  longitude: 32.5825,
  role: 'technical',
});
```

**Features:**

- ✅ Real-time streaming of thinking steps
- ✅ Buffered updates (50ms intervals) for performance
- ✅ Automatic cleanup to prevent memory leaks
- ✅ AbortController support for cancellation
- ✅ Error handling with retry logic
- ✅ TypeScript type safety

#### useChat Integration

The existing `useChat` hook now handles thinking steps from API responses:

```typescript
const placeholderMessage: Message = {
  role: 'assistant',
  content: '',
  timestamp: timestamp,
  tools_used: response.tools_used,
  isStreaming: true,
  thinking_steps: response.thinking_steps, // ✅ Added
  reasoning_content: response.reasoning_content, // ✅ Added
};
```

### 4. Styling (`src/app/globals.css`)

All ThinkingDisplay styles are integrated into the global stylesheet using CSS custom properties for theme consistency:

```css
/* ThinkingDisplay Component Styles */
.thinking-display {
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  /* ... */
}
```

**Features:**

- ✅ Uses Tailwind CSS custom properties
- ✅ Automatic dark mode support
- ✅ Responsive breakpoints
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Print-friendly styles

## Usage Examples

### 1. Basic Display (Already Integrated)

The feature is automatically enabled in `MessageBubble`. When the API returns `thinking_steps`, they will be displayed:

```tsx
// In your chat component, thinking steps are shown automatically
<ChatMessages messages={messages} isLoading={isLoading} />
```

### 2. Using Streaming (Optional)

For real-time thinking step streaming, use the `useThinkingStream` hook:

```tsx
import { useThinkingStream } from '@/hooks/useThinkingStream';
import { ThinkingDisplay } from '@/components/ThinkingDisplay';

function StreamingChat() {
  const { thinking, content, isStreaming, sendMessage } = useThinkingStream();

  const handleSend = async () => {
    await sendMessage({
      message: 'Analyze air quality trends',
      sessionId: 'session-123',
    });
  };

  return (
    <div>
      <ThinkingDisplay
        thinking={thinking}
        isStreaming={isStreaming}
        defaultExpanded={true}
      />
      <div>{content}</div>
    </div>
  );
}
```

### 3. Standalone ThinkingDisplay

Use the component independently:

```tsx
import { ThinkingDisplay } from '@/components/ThinkingDisplay';

function Analysis({ analysis }) {
  return (
    <ThinkingDisplay
      thinking={analysis.reasoning_steps}
      duration={analysis.processing_time}
      defaultExpanded={false}
    />
  );
}
```

## API Integration

### Non-Streaming Endpoint (`/api/v1/agent/chat`)

The regular chat endpoint returns thinking steps in the response:

```json
{
  "response": "The air quality in Kampala is...",
  "session_id": "abc-123",
  "tools_used": ["waqi", "airqo"],
  "thinking_steps": [
    "Step 1: Retrieve current PM2.5 levels from AirQo",
    "Step 2: Compare against WHO guidelines",
    "Step 3: Assess health risks for sensitive groups"
  ],
  "reasoning_content": "Full reasoning text...",
  "tokens_used": 1234,
  "cached": false
}
```

### Streaming Endpoint (`/api/v1/agent/chat/stream`)

Server-Sent Events (SSE) stream with event types:

```
event: start
data: {"message": "Stream started"}

event: thinking
data: {"content": "Step 1: Analyzing air quality data..."}

event: content
data: {"content": "The air quality in Kampala..."}

event: tools
data: {"tool_name": "waqi"}

event: done
data: {"session_id": "abc-123", "tools_used": ["waqi"]}
```

## Best Practices

### 1. Memory Management

✅ **Always cleanup on unmount:**

```typescript
useEffect(() => {
  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (abortRef.current) {
      abortRef.current.abort();
    }
  };
}, []);
```

### 2. Performance Optimization

✅ **Buffer updates to avoid excessive re-renders:**

```typescript
// Update every 50ms instead of on every character
const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

updateIntervalRef.current = setInterval(() => {
  if (bufferRef.current) {
    setState((prev) => ({
      ...prev,
      thinking: [...prev.thinking, bufferRef.current],
    }));
    bufferRef.current = '';
  }
}, 50);
```

### 3. Accessibility

✅ **Include ARIA labels:**

```tsx
<div
  className="thinking-display"
  role="region"
  aria-label="AI Reasoning Process"
>
  <button aria-expanded={isExpanded} aria-controls="thinking-content">
    {/* ... */}
  </button>
</div>
```

### 4. Error Handling

✅ **Handle stream errors gracefully:**

```typescript
try {
  await fetchEventSource(url, {
    onerror(err) {
      console.error('Stream error:', err);
      setState((prev) => ({
        ...prev,
        error: err.message,
        isStreaming: false,
      }));
      throw err; // Stop retrying
    },
  });
} catch (error: unknown) {
  if (error instanceof Error && error.name !== 'AbortError') {
    // Handle real errors only
  }
}
```

## File Organization

```
src/
├── types/
│   └── index.ts                     # ✅ Added thinking_steps types
├── hooks/
│   ├── useChat.ts                   # ✅ Updated to handle thinking_steps
│   └── useThinkingStream.ts         # ✅ NEW: Streaming hook
├── components/
│   ├── MessageBubble.tsx            # ✅ Integrated ThinkingDisplay
│   ├── ThinkingDisplay.tsx          # ✅ NEW: Display component
│   └── ChatMessages.tsx             # ✅ Already supports new Message type
├── services/
│   └── api.service.ts               # ✅ Supports thinking_steps in responses
└── app/
    └── globals.css                  # ✅ Added ThinkingDisplay styles
```

## Migration Notes

### What Changed

1. **Types**: Added optional `thinking_steps`, `reasoning_content`, and `thinking_duration` to `Message` and `ChatResponse`
2. **Components**: Added `ThinkingDisplay` component and integrated into `MessageBubble`
3. **Hooks**: Created `useThinkingStream` for streaming, updated `useChat` to handle new fields
4. **Styles**: Added comprehensive styles to `globals.css`

### Backward Compatibility

✅ **All changes are backward compatible** - the new fields are optional, so existing code continues to work without modifications.

### Removed Files

Temporary example files have been deleted:

- ❌ `ThinkingDisplay.tsx` (root)
- ❌ `ThinkingDisplay.css` (root)
- ❌ `useThinkingStream.ts` (root)

All functionality is now properly organized in `src/` directory.

## Testing

### Manual Testing

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Test with reasoning model:**
   - Ensure backend is configured with a reasoning model (DeepSeek R1, Nemotron, etc.)
   - Send a complex air quality query
   - Verify thinking steps appear in the message bubble
   - Test collapse/expand functionality

3. **Test streaming (optional):**
   - Switch to streaming endpoint in your implementation
   - Verify real-time step updates
   - Test stop/cancel functionality

### Edge Cases to Test

- [ ] Empty thinking_steps array
- [ ] Very long thinking steps (>1000 chars)
- [ ] Many thinking steps (>20 steps)
- [ ] Streaming interruption (network failure)
- [ ] Memory leaks (mount/unmount multiple times)

## Performance Considerations

1. **Buffering**: Updates are buffered every 50ms to prevent excessive re-renders
2. **Virtual Scrolling**: Consider implementing if >100 thinking steps
3. **Lazy Loading**: ThinkingDisplay only renders when `thinking_steps` exist
4. **Cleanup**: All intervals, timers, and abort controllers are properly cleaned up

## Future Enhancements

- [ ] Add syntax highlighting for code in thinking steps
- [ ] Export thinking steps as markdown/PDF
- [ ] Search/filter within thinking steps
- [ ] Thinking step time estimates
- [ ] Compare thinking steps between different models
- [ ] Thinking step annotations/comments

## Support

For issues or questions:

1. Check the [API_REFERENCE.md](../API_REFERENCE.md) for backend details
2. Review TypeScript types in [src/types/index.ts](../src/types/index.ts)
3. See component examples in [src/components/ThinkingDisplay.tsx](../src/components/ThinkingDisplay.tsx)

---

**Last Updated:** January 6, 2026
**Version:** 1.0.0
