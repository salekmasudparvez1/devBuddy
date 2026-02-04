'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { Part } from '../hooks/useChat';

/**
 * ChatInput Component
 * 
 * Fixed at the bottom with:
 * - Text input field with auto-expand for multi-line input
 * - Send button with loading spinner
 * - Keyboard shortcuts (Cmd/Ctrl+Enter to send)
 * - Mobile-responsive design
 * - Framer Motion button animations
 */
interface ChatInputProps {
  onSend: (msg: { role: 'user' | 'assistant'; parts: Part[] }) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    onSend({
      role: 'user',
      parts: [{ type: 'text', text: input }],
    });

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle Enter key (Cmd/Ctrl+Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <footer className="shrink-0 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Hint text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Press <kbd className="bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono">Ctrl+Enter</kbd> to send
        </p>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-3"
        >
          {/* Multi-line textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask me anything about your codebase... (Ctrl+Enter to send)"
            rows={1}
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />

          {/* Send button */}
          <motion.button
            type="submit"
            disabled={isLoading || !input.trim()}
            whileHover={{ scale: !isLoading && input.trim() ? 1.05 : 1 }}
            whileTap={{ scale: !isLoading && input.trim() ? 0.95 : 1 }}
            className="shrink-0 flex items-center justify-center w-12 h-12 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none disabled:cursor-not-allowed"
            title={isLoading ? 'Waiting for response...' : 'Send message'}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Send size={18} />
            )}
          </motion.button>
        </form>

        {/* Footer hint */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          DevBuddy will analyze your codebase and provide sourced answers.
        </p>
      </div>
    </footer>
  );
};
