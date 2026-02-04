'use client';

import { useState, useCallback } from 'react';

// Frontend UI state & streaming logic
// This local hook replaces external OpenAI hooks and handles:
// - message state (user and assistant)
// - sending messages to the backend
// - receiving streaming updates and appending them to the assistant message

export type Part = { type: 'text' | 'code'; text: string };
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  parts: Part[];
  createdAt: number;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'idle' | 'submitted' | 'streaming'>('idle');

  const clearMessages = useCallback(() => setMessages([]), []);

  // Send a message and handle streaming responses from /api/devbuddy
  const sendMessage = useCallback(
    async (msg: { role: 'user' | 'assistant'; parts: Part[] }) => {
      // Add the user message optimistically
      const userMsg: Message = {
        id: String(Date.now()) + Math.random().toString(36).slice(2, 9),
        role: 'user',
        parts: msg.parts,
        createdAt: Date.now(),
      };

      setMessages((cur) => [...cur, userMsg]);
      setStatus('submitted');

      // Create empty assistant message that we'll append to while streaming
      const assistantId = String(Date.now()) + Math.random().toString(36).slice(2, 9);
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        parts: [{ type: 'text', text: '' }],
        createdAt: Date.now(),
      };

      setMessages((cur) => [...cur, assistantMsg]);

      try {
        setStatus('streaming');

        const res = await fetch('/api/devbuddy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [...messages, userMsg] }),
        });

        if (!res.ok) {
          const text = await res.text();
          // append error text
          setMessages((cur) =>
            cur.map((m) => (m.id === assistantId ? { ...m, parts: [{ type: 'text', text }] } : m))
          );
          setStatus('idle');
          return;
        }

        // If the server responds with a stream (SSE or chunked), read it progressively
        const reader = res.body?.getReader();
        if (!reader) {
          // Not a stream - fallback to full json
          const json = await res.json();
          const content = json?.content || JSON.stringify(json);
          setMessages((cur) => cur.map((m) => (m.id === assistantId ? { ...m, parts: [{ type: 'text', text: content }] } : m)));
          setStatus('idle');
          return;
        }

        const decoder = new TextDecoder();
        let doneReading = false;
        // We allow the agent to send multi-part messages. We will append raw text chunks into the last part.
        while (!doneReading) {
          const { value, done } = await reader.read();
          if (done) {
            doneReading = true;
            break;
          }
          const chunkText = decoder.decode(value, { stream: true });

          // SSE events commonly prefix with "data: " and separate with \n\n. Extract JSON payloads if present.
          const lines = chunkText.split(/\n\n|\n/).map((l) => l.trim()).filter(Boolean);
          for (const line of lines) {
            // Skip protocol markers and empty lines
            if (!line || line === '[DONE]' || line === '[done]') {
              continue;
            }

            let payload = line;
            if (payload.startsWith('data:')) {
              payload = payload.replace(/^data:\s*/, '').trim();
            }

            // Skip empty or protocol-only payloads
            if (!payload || payload === '[DONE]' || payload === '[done]') {
              continue;
            }

            // Try to parse JSON segments; otherwise treat as plain text append
            let parsed: any = null;
            try {
              parsed = JSON.parse(payload);
            } catch (e) {
              // not JSON - treat as plain text
            }

            if (parsed) {
              // Skip protocol messages and handle Algolia's SSE format
              if (parsed.type === 'finish' || parsed.type === 'done' || parsed === '[DONE]' ||
                  parsed.type === 'start' || parsed.type === 'start-step' || 
                  parsed.type === 'text-start' || parsed.type === 'text-end' || 
                  parsed.type === 'finish-step') {
                continue;
              }

              // Handle Algolia's text-delta format (most important)
              if (parsed.type === 'text-delta' && typeof parsed.delta === 'string') {
                const delta = parsed.delta;
                setMessages((cur: Message[]) =>
                  cur.map((m) => {
                    if (m.id !== assistantId) return m;
                    const parts = [...m.parts];
                    if (parts.length === 0) parts.push({ type: 'text', text: delta });
                    else parts[parts.length - 1].text += delta;
                    return { ...m, parts };
                  })
                );
              }
              // If agent sends structured messages with 'parts' or 'delta' fields, use them
              else if (Array.isArray(parsed.parts)) {
                // Replace or append parts
                setMessages((cur: Message[]) =>
                  cur.map((m) => (m.id === assistantId ? { ...m, parts: parsed.parts } : m))
                );
              } else if (parsed.delta && typeof parsed.delta === 'object') {
                // delta could be { type: 'text' | 'code', text }
                const delta = parsed.delta;
                setMessages((cur: Message[]) =>
                  cur.map((m) => {
                    if (m.id !== assistantId) return m;
                    const parts = [...m.parts];
                    // append to last part if same type
                    if (parts.length === 0) parts.push({ type: delta.type || 'text', text: delta.text || '' });
                    else if (parts[parts.length - 1].type === (delta.type || 'text')) parts[parts.length - 1].text += delta.text || ' ';
                    else parts.push({ type: delta.type || 'text', text: delta.text || '' });
                    return { ...m, parts };
                  })
                );
              } else if (typeof parsed.answer === 'string') {
                // Full answer object, replace assistant text
                setMessages((cur: Message[]) => cur.map((m) => (m.id === assistantId ? { ...m, parts: [{ type: 'text', text: parsed.answer }] } : m)));
              } else if (typeof parsed.message === 'string') {
                // Alternative: 'message' field
                setMessages((cur: Message[]) => cur.map((m) => (m.id === assistantId ? { ...m, parts: [{ type: 'text', text: parsed.message }] } : m)));
              } else if (typeof parsed.content === 'string') {
                // Alternative: 'content' field
                setMessages((cur: Message[]) => cur.map((m) => (m.id === assistantId ? { ...m, parts: [{ type: 'text', text: parsed.content }] } : m)));
              } else if (typeof parsed.text === 'string') {
                // Alternative: 'text' field
                setMessages((cur: Message[]) => cur.map((m) => (m.id === assistantId ? { ...m, parts: [{ type: 'text', text: parsed.text }] } : m)));
              }
              // Skip other unknown JSON objects
            } else if (payload && payload.length > 0) {
              // Plain text: append to the current assistant message last part
              setMessages((cur: Message[]) =>
                cur.map((m) => {
                  if (m.id !== assistantId) return m;
                  const parts = [...m.parts];
                  if (parts.length === 0) parts.push({ type: 'text', text: payload });
                  else parts[parts.length - 1].text += payload;
                  return { ...m, parts };
                })
              );
            }
          }
        }

        setStatus('idle');
      } catch (err: any) {
        setMessages((cur) => cur.map((m) => (m.id === assistantId ? { ...m, parts: [{ type: 'text', text: String(err) }] } : m)));
        setStatus('idle');
      }
    },
    [messages]
  );

  return {
    messages,
    sendMessage,
    status,
    setMessages: (m: Message[]) => setMessages(m),
    clearMessages,
  } as const;
}
