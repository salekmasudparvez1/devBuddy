'use client';

import { useRef, useEffect } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChat, type Message } from './hooks/useChat';
import { ChatInput } from './components/ChatInput';
import { UserMessage } from './components/UserMessage';
import { AIMessage } from './components/AIMessage';
import { WelcomeScreen } from './components/WelcomeScreen';

export default function Home() {
  const { messages, sendMessage, status, setMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleClearHistory = () => setMessages([]);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 dark:bg-slate-900">
      {/* ================= HEADER ================= */}
      <header className="shrink-0 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
              <Sparkles className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">DevBuddy</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered codebase assistant</p>
            </div>
          </div>

          {/* Clear chat history */}
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

      {/* ================= MESSAGE AREA ================= */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 flex flex-col">
          {/* Welcome screen */}
          {messages.length === 0 && !isLoading && <WelcomeScreen />}

          {/* Messages */}
          {messages.map((message: Message, index: number) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
            >
              {message.role === 'user' ? (
                <UserMessage content={message.parts} />
              ) : (
                <AIMessage
                  content={message.parts}
                  isStreaming={isLoading && index === messages.length - 1}
                />
              )}
            </motion.div>
          ))}

          <div ref={messagesEndRef} className="h-0" />
        </div>
      </main>

      {/* ================= INPUT AREA ================= */}
      <div className="shrink-0 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-inner">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
