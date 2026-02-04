'use client';

import { motion } from 'framer-motion';
import { Part } from '../hooks/useChat';

/**
 * UserMessage Component
 * 
 * Renders user messages in the chat with:
 * - Right-aligned layout (ChatGPT style)
 * - Light gradient background
 * - Framer Motion slide-in animation
 * - Support for text and code parts
 */
interface UserMessageProps {
  content: Part[];
}

export const UserMessage: React.FC<UserMessageProps> = ({ content }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-end"
    >
      <div className="max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 md:px-5 md:py-4 shadow-md hover:shadow-lg transition-shadow">
        {/* Message content */}
        {content.map((part, idx) => (
          <div key={idx} className="space-y-2">
            {part.type === 'text' && (
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap wrap-break-word">
                {part.text}
              </p>
            )}
            {part.type === 'code' && (
              <pre className="bg-black/30 rounded-lg p-3 text-xs md:text-sm font-mono overflow-x-auto">
                <code className="text-green-300">{part.text}</code>
              </pre>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
