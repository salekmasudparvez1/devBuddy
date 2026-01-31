'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { Sparkles, FileCode, BrainCircuit, Search, AlertTriangle, Loader2, ArrowRight, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for cleaner tailwind classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Helper to detect "Not Found" responses ---
// Handles smart quotes and variations
const isNotFound = (text: string) => {
  if (!text) return false;
  const t = text.toLowerCase();
  return (
    t.includes("couldn't find") || 
    t.includes("couldn’t find") || // Smart quote
    t.includes("not found in the current codebase") ||
    t.includes("cannot find") ||
    t.includes("unable to find")
  );
};

// --- Types ---
interface AgentSource {
  path: string;
  type: string;
  link?: string;
}

interface AgentResponse {
  answer: {
    text: string;
    explanation?: string;
    related?: string;
  };
  sources: AgentSource[];
}

interface HistoryItem {
  id: string;
  question: string;
  response?: AgentResponse;
  error?: string;
}

// --- Components ---

// 1. Premium Glass Card Component
const GlassCard = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string, delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    className={cn(
      "relative backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl overflow-hidden",
      className
    )}
  >
    {/* Inner top highlight for depth */}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
    {children}
  </motion.div>
);

export default function Home() {
  const [question, setQuestion] = useState<string>('');
  // Changed: Store an array of history items instead of a single response
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Ref for auto-scrolling
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQuestion = question;
    const newId = Date.now().toString();

    setLoading(true);
    setQuestion(''); // Clear input immediately
    
    // Optimistically add the question to history
    // We will update this item with the response later
    // But for now, we just wait for the loading state to finish to append the answer
    
    try {
      const res = await fetch('/api/devbuddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentQuestion }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'The agent failed to respond.');
      }

      const data: AgentResponse = await res.json();
      
      if (!data.answer || !data.sources) {
        throw new Error('Received an invalid response structure.');
      }

      // Add to history on success
      setHistory(prev => [...prev, { 
        id: newId, 
        question: currentQuestion, 
        response: data 
      }]);

    } catch (err: any) {
      // Add to history on error
      setHistory(prev => [...prev, { 
        id: newId, 
        question: currentQuestion, 
        error: err.message || 'An unknown error occurred.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, loading]);

  const clearHistory = () => {
    setHistory([]);
    setQuestion('');
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-20 pb-12 px-4 sm:px-6 z-10 font-sans selection:bg-red-500/30">
      
      {/* Background Noise Texture */}
      <div className="bg-noise" />

      {/* --- Header Section --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 z-20"
      >
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 shadow-lg shadow-red-500/10 backdrop-blur-md">
          <Sparkles className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400">
          DevBuddy
        </h1>
        <p className="text-gray-400 mt-4 text-lg max-w-lg mx-auto leading-relaxed">
          Your AI-powered codebase companion. <br/> Ask deep questions, get sourced answers.
        </p>
      </motion.div>

      <div className="w-full max-w-3xl z-20 pb-32">
        
        {/* --- Search Input (Fixed Position or Top) --- */}
        <GlassCard className="p-2 md:p-3 mb-8 ring-1 ring-white/10 focus-within:ring-red-500/50 transition-all duration-300 shadow-2xl shadow-black/50 z-30 sticky top-4 backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <Search className="absolute left-4 text-gray-500 w-5 h-5" />
            
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="How does authentication middleware work..."
              className="w-full bg-transparent border-none text-white placeholder-gray-500 text-lg px-12 py-4 focus:outline-none focus:ring-0"
              disabled={loading}
            />

            <div className="absolute right-3 flex items-center gap-2">
              {history.length > 0 && !loading && (
                <button 
                  type="button" 
                  onClick={clearHistory}
                  className="p-2 text-gray-500 hover:text-white transition-colors text-xs uppercase tracking-wider font-semibold"
                  title="Clear History"
                >
                  Clear
                </button>
              )}
              
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300",
                  loading 
                    ? "bg-white/5 text-gray-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-900/20 hover:shadow-red-500/20 transform hover:scale-[1.02]"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18}/> 
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* Loading Progress Bar */}
          {loading && (
            <motion.div 
              className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-red-500 via-orange-400 to-red-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </GlassCard>

        {/* --- History Loop --- */}
        <div className="space-y-12">
            {history.map((item) => (
                <div key={item.id} className="space-y-6">
                    
                    {/* User Question Bubble */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-end"
                    >
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-2xl rounded-tr-sm px-6 py-4 max-w-[80%] shadow-lg">
                            <div className="flex items-center gap-2 mb-1 text-xs text-gray-400 uppercase tracking-wider font-bold">
                                <User size={12} /> You
                            </div>
                            <p>{item.question}</p>
                        </div>
                    </motion.div>

                    {/* Agent Response */}
                    {item.error ? (
                        <div className="bg-red-950/30 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-start gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4">
                            <AlertTriangle className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Error</p>
                                <p className="text-sm opacity-80 mt-1">{item.error}</p>
                            </div>
                        </div>
                    ) : item.response && (
                        <div className="space-y-6">
                            {/* Check for "Not Found" State using helper */}
                            {isNotFound(item.response.answer.text) ? (
                                <GlassCard className="p-8 border-yellow-500/20 bg-yellow-500/5">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="p-4 rounded-full bg-yellow-500/10 text-yellow-500 mb-4">
                                            <AlertTriangle size={32} />
                                        </div>
                                        <h2 className="text-xl font-semibold text-yellow-200 mb-2">No Context Found</h2>
                                        <p className="text-gray-400">{item.response.answer.text}</p>
                                    </div>
                                </GlassCard>
                            ) : (
                                <>
                                    {/* 1. Analysis */}
                                    <GlassCard className="p-6 md:p-8" delay={0.1}>
                                        <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                                            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                                                <Sparkles size={20} />
                                            </div>
                                            <h2 className="text-lg font-semibold text-white">DevBuddy Analysis</h2>
                                        </div>
                                        <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
                                            {item.response.answer.text}
                                        </p>
                                    </GlassCard>

                                    {/* 2. Sources */}
                                    {item.response.sources.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }} 
                                            transition={{ delay: 0.3 }}
                                        >
                                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 ml-1">References</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {item.response.sources.map((source, idx) => (
                                                    <a
                                                        key={`${item.id}-src-${idx}`}
                                                        href={source.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-red-500/30 transition-all cursor-pointer"
                                                    >
                                                        <div className="p-2 rounded-md bg-black/40 text-gray-400 group-hover:text-red-400 transition-colors">
                                                            <FileCode size={18}/>
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

                                    {/* 3. Deep Explanation */}
                                    {item.response.answer.explanation && (
                                        <GlassCard className="p-6 md:p-8 border-l-4 border-l-red-500/50" delay={0.4}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                                    <BrainCircuit size={20} />
                                                </div>
                                                <h2 className="text-lg font-semibold text-white">Deep Dive</h2>
                                            </div>
                                            <div 
                                                className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-red-400 max-w-none" 
                                                dangerouslySetInnerHTML={{ __html: item.response.answer.explanation }} 
                                            />
                                        </GlassCard>
                                    )}

                                    {/* 4. Related */}
                                    {item.response.answer.related && (
                                        <GlassCard className="p-5 bg-gradient-to-r from-red-900/10 to-transparent" delay={0.5}>
                                            <div className="flex gap-3">
                                                <Sparkles size={18} className="text-red-400 mt-1 shrink-0" />
                                                <div>
                                                    <h4 className="text-sm font-semibold text-red-200 mb-1">Related Context</h4>
                                                    <p className="text-sm text-gray-400">{item.response.answer.related}</p>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            ))}
            
            {/* Loading Skeleton during fetch */}
            {loading && (
                 <div className="space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-end"
                    >
                        <div className="bg-white/10 border border-white/10 text-white rounded-2xl rounded-tr-sm px-6 py-4 shadow-lg opacity-50">
                             Thinking...
                        </div>
                    </motion.div>
                    <div className="animate-pulse space-y-4">
                        <div className="h-40 bg-white/5 rounded-2xl border border-white/5"></div>
                    </div>
                 </div>
            )}
            
            {/* Invisible element to scroll to */}
            <div ref={scrollRef} />
        </div>
      </div>
    </main>
  );
}