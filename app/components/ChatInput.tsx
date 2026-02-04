'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { Part } from '../hooks/useChat';

interface ChatInputProps {
    onSend: (msg: { role: 'user' | 'assistant'; parts: Part[] }) => void;
    isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-expand textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;

        onSend({
            role: 'user',
            parts: [{ type: 'text', text: input }],
        });

        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter sends if not shift
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <footer className="fixed bottom-0 w-full border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50">
            <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-2 sm:gap-3">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-3 items-end"
                >
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        placeholder="Ask me anything about your codebase..."
                        rows={1}
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-48 transition-all duration-200"
                    />

                    <motion.button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        whileHover={{ scale: !isLoading && input.trim() ? 1.07 : 1 }}
                        whileTap={{ scale: !isLoading && input.trim() ? 0.95 : 1 }}
                        className="
    shrink-0 flex items-center justify-center 
    w-12 h-12 
    bg-gradient-to-br from-blue-500 to-blue-600 
    hover:from-blue-600 hover:to-blue-700 
    disabled:from-gray-400 disabled:to-gray-500 
    text-white rounded-2xl font-semibold shadow-lg 
    hover:shadow-xl disabled:shadow-none transition-all duration-300
  "
                        title={isLoading ? 'Waiting for response...' : 'Send message'}
                    >
                        {isLoading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full"
                            />
                        ) : (
                            <Send size={20} className="sm:stroke-2" />
                        )}
                    </motion.button>

                </form>

                <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
                    <p>
                        Press <kbd className="bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono">Enter</kbd> to send, <kbd className="bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono">Shift+Enter</kbd> for new line
                    </p>
                    <p className="mt-1 sm:mt-0">
                        DevBuddy analyzes your codebase and provides sourced answers.
                    </p>
                </div>
            </div>
        </footer>
    );
};
