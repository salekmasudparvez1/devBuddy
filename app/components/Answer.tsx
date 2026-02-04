'use client';

import { FileCode, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { AgentSource } from '../types/agent';
import { parseStreaming } from '../utils/parseStreaming';
import { cn } from '../utils/cn';
import { GlassCard } from './GlassCard';

interface AnswerPart {
  type: 'text' | 'code';
  text: string;
}

interface AnswerProps {
  content?: string;
  parts?: AnswerPart[];
}

export const Answer: React.FC<AnswerProps> = ({ content, parts }) => {
  let sources: AgentSource[] = [];
  let answerText = '';

  if (content) {
    const parsed = parseStreaming(content);
    sources = parsed.sources || [];
    answerText = parsed.answer || '';
  }

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
      {/* Main Answer Card */}
      <GlassCard className="p-6 md:p-8 backdrop-blur-md bg-white/5 border border-white/10 shadow-lg" delay={0.1}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
            <Sparkles size={20} />
          </div>
          <h2 className="text-lg font-semibold text-white">DevBuddy Analysis</h2>
        </div>

        {/* Answer Body */}
        <div className="space-y-4">
          <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap break-words">
            {answerText}
          </p>

          {/* Code Parts */}
          {parts?.map((part, idx) =>
            part.type === 'code' ? (
              <motion.pre
                key={`code-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
                className={cn(
                  'bg-black/50 p-4 rounded-xl overflow-x-auto text-sm font-mono text-green-300 shadow-md',
                  'scrollbar-thin scrollbar-thumb-gray-600/40 scrollbar-track-transparent'
                )}
              >
                {part.text}
              </motion.pre>
            ) : null
          )}
        </div>
      </GlassCard>

      {/* Sources */}
      {sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 ml-1">
            References
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sources.map((source, idx) => (
              <motion.a
                key={`src-${idx}`}
                href={source.link}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                className="group flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-400/30 transition-all cursor-pointer shadow-sm"
              >
                <div className="p-2 rounded-md bg-black/30 text-gray-400 group-hover:text-red-400 transition-colors">
                  <FileCode size={18} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-mono text-gray-300 truncate group-hover:text-white transition-colors">
                    {source.path}
                  </p>
                  <p className="text-xs text-gray-500 uppercase mt-0.5">{source.type}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
