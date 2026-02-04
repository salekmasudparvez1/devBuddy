'use client';

import { FileCode, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { AgentSource } from '../types/agent';
import { parseStreaming } from '../utils/parseStreaming';
import { cn } from '../utils/cn';

interface AnswerPart {
  type: 'text' | 'code';
  text: string;
}

interface AnswerProps {
  content?: string;
  parts?: AnswerPart[];
}

export const Answer: React.FC<AnswerProps> = ({ content, parts }) => {
  // Extracted sources and main answer text
  let sources: AgentSource[] = [];
  let answerText = '';

  // If content string is provided, parse for answer and sources
  if (content) {
    const parsed = parseStreaming(content);
    sources = parsed.sources || [];
    answerText = parsed.answer || '';
  }

  // If streaming multi-part messages are provided
  if (parts && parts.length > 0) {
    for (const part of parts) {
      if (part.type === 'text') {
        const parsed = parseStreaming(part.text);
        if (parsed.sources?.length) {
          sources = [...sources, ...parsed.sources];
        }
        answerText += part.text + '\n';
      }
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6 md:p-8" delay={0.1}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
            <Sparkles size={20} />
          </div>
          <h2 className="text-lg font-semibold text-white">DevBuddy Analysis</h2>
        </div>

        {/* Answer Body */}
        <div className="space-y-4">
          <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
            {answerText}
          </p>

          {/* Render code parts separately */}
          {parts?.map((part, idx) =>
            part.type === 'code' ? (
              <pre
                key={`code-${idx}`}
                className={cn(
                  'bg-black/40 p-4 rounded-lg overflow-x-auto text-sm text-green-200 font-mono'
                )}
              >
                {part.text}
              </pre>
            ) : null
          )}
        </div>
      </GlassCard>

      {/* Sources / References */}
      {sources.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 ml-1">
            References
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.map((source, idx) => (
              <a
                key={`src-${idx}`}
                href={source.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-red-500/30 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-md bg-black/40 text-gray-400 group-hover:text-red-400 transition-colors">
                  <FileCode size={18} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-mono text-gray-300 truncate group-hover:text-white transition-colors">
                    {source.path}
                  </p>
                  <p className="text-xs text-gray-600 uppercase mt-0.5">{source.type}</p>
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
