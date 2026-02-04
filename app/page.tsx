'use client';

import { useRef, useEffect, useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChat, type Message } from './hooks/useChat';
import { ChatInput } from './components/ChatInput';
import { UserMessage } from './components/UserMessage';
import { AIMessage } from './components/AIMessage';
import { WelcomeScreen } from './components/WelcomeScreen';

/**
 * ChatGPT-style main page for DevBuddy
 * 
 * Layout:
 * - Header: Fixed at top with logo and title
 * - Message area: Scrollable center with user/AI messages
 * - Input area: Fixed at bottom with text input and send button
 * 
 * Features:
 * - Auto-scroll to new messages
 * - Streaming AI responses with typing effect
 * - Message bubbles (user right, AI left)
 * - Code syntax highlighting in AI responses
 * - Mobile responsive layout
 * - Framer Motion animations on message arrival
 */
export default function Home() {
  const { messages, sendMessage, status, setMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleClearHistory = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-slate-900">
      {/* ============================================
          HEADER - Fixed at top with app branding
          ============================================ */}
      <header className="shrink-0 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-linear-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
              <Sparkles className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">DevBuddy</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered codebase assistant</p>
            </div>
          </div>

          {/* Clear History Button */}
          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearHistory}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Clear chat history"
            >
              <Trash2 size={16} />
              Clear
            </motion.button>
          )}
        </div>
      </header>

      {/* ============================================
          MESSAGE AREA - Scrollable, full content
          ============================================ */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Welcome Screen when no messages */}
          {messages.length === 0 && !isLoading && (
            <WelcomeScreen />
          )}

          {/* Message bubbles */}
          {messages.map((message: Message, index: number) => (
            <div key={message.id} className="animate-fade-in">
              {message.role === 'user' ? (
                <UserMessage content={message.parts} />
              ) : (
                <AIMessage content={message.parts} isStreaming={isLoading && index === messages.length - 1} />
              )}
            </div>
          ))}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} className="h-0" />
        </div>
      </main>

      {/* ============================================
          INPUT AREA - Fixed at bottom
          ============================================ */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}