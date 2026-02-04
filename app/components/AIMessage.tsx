'use client';

import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Part } from '../hooks/useChat';
import { highlightCode } from '../utils/highlightCode';

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
      className="flex justify-start w-full"
    >
      <div className="max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 md:px-5 md:py-4 shadow-md hover:shadow-lg transition-shadow space-y-3 break-words">
        {content.map((part, idx) => (
          <div key={idx}>
            {part.type === 'text' && (
              <TextContent text={part.text} isStreaming={isStreaming && idx === content.length - 1} />
            )}
            {part.type === 'code' && <CodeBlock code={part.text} />}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

interface TextContentProps {
  text: string;
  isStreaming?: boolean;
}

const TextContent: React.FC<TextContentProps> = ({ text, isStreaming }) => {
  if (!text) return null;

  return (
    <div className="space-y-2 text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
      {text.split('\n\n').map((paragraph, idx) => (
        <p key={idx} className="whitespace-pre-wrap break-words">
          {isStreaming ? <TypingEffect text={paragraph} /> : paragraph}
        </p>
      ))}
    </div>
  );
};

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
        className="ml-1 inline-block w-1 h-5 bg-current align-middle"
      />
    </span>
  );
};

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

  // Extract language from ```lang if present
  const codeLines = code.split('\n');
  let displayCode = code;
  let language = 'javascript';

  if (codeLines[0]?.match(/^```?[\w-]*$/)) {
    language = codeLines[0].replace(/^`+/, '').trim() || 'javascript';
    displayCode = codeLines.slice(1).join('\n').replace(/`+$/, '');
  }

  const highlightedCode = highlightCode(displayCode, language);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-slate-900 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-700 dark:border-slate-800 shadow-sm"
    >
      {/* Header */}
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

      {/* Code content */}
      <pre className="p-4 text-xs md:text-sm font-mono overflow-x-auto max-h-96 text-slate-100 scrollbar-thin scrollbar-thumb-slate-600/40 scrollbar-track-transparent">
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </motion.div>
  );
};
