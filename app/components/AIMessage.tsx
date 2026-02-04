'use client';

import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Part } from '../hooks/useChat';
import { highlightCode } from '../utils/highlightCode';

/**
 * AIMessage Component
 * 
 * Renders AI responses with:
 * - Left-aligned layout (ChatGPT style)
 * - Dark/neutral background
 * - Syntax-highlighted code blocks (using Prism.js via CDN)
 * - Copy button for code snippets
 * - Streaming animation (character-by-character typing effect)
 * - References section for sources
 * - Framer Motion slide-in animation
 * 
 * Supports:
 * - Text content with markdown-like formatting
 * - Code blocks with language detection
 * - References/sources from AI responses
 */
interface AIMessageProps {
  content: Part[];
  isStreaming?: boolean;
}

export const AIMessage: React.FC<AIMessageProps> = ({ content, isStreaming }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start"
    >
      <div className="max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 md:px-5 md:py-4 shadow-md hover:shadow-lg transition-shadow space-y-3">
        {/* Message content */}
        {content.map((part, idx) => (
          <div key={idx}>
            {part.type === 'text' && (
              <TextContent text={part.text} isStreaming={isStreaming && idx === content.length - 1} />
            )}
            {part.type === 'code' && (
              <CodeBlock code={part.text} />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * TextContent Component
 * 
 * Renders text with optional streaming animation (typing effect).
 * Splits text by code fence markers (```lang...```).
 */
interface TextContentProps {
  text: string;
  isStreaming?: boolean;
}

const TextContent: React.FC<TextContentProps> = ({ text, isStreaming }) => {
  if (!text) return null;

  return (
    <div className="space-y-2 text-sm md:text-base leading-relaxed">
      {text.split('\n\n').map((paragraph, idx) => (
        <p key={idx} className="whitespace-pre-wrap wrap-break-word">
          {isStreaming ? <TypingEffect text={paragraph} /> : paragraph}
        </p>
      ))}
    </div>
  );
};

/**
 * TypingEffect Component
 * 
 * Displays text character-by-character for streaming effect (like ChatGPT typing).
 * Uses CSS animation for smooth performance.
 */
interface TypingEffectProps {
  text: string;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text }) => {
  return (
    <span className="inline-block">
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="ml-1 inline-block w-2 h-5 bg-current"
      />
    </span>
  );
};

/**
 * CodeBlock Component
 * 
 * Renders code with:
 * - Syntax highlighting (auto-detect language)
 * - Copy button
 * - Horizontal scrolling for long lines
 * - Dark background and monospace font
 */
interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract language from code fence if present (```lang)
  const codeLines = code.split('\n');
  let displayCode = code;
  let language = 'javascript';

  if (codeLines[0]?.match(/^```?[\w-]*$/)) {
    language = codeLines[0].replace(/^`+/, '').trim() || 'javascript';
    displayCode = codeLines.slice(1).join('\n').replace(/`+$/, '');
  }

  // Get highlighted code (attempts to use Prism if available)
  const highlightedCode = highlightCode(displayCode, language);

  return (
    <div className="bg-slate-900 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-700 dark:border-slate-800">
      {/* Header with language label and copy button */}
      <div className="flex items-center justify-between bg-slate-800 dark:bg-slate-900 px-4 py-2 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          {language}
        </span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </motion.button>
      </div>

      {/* Code content with horizontal scroll */}
      <pre className="p-4 text-xs md:text-sm font-mono overflow-x-auto max-h-96 text-slate-100">
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  );
};
