
'use client';

import { useState, FormEvent } from 'react';
import { Sparkles, FileCode, BrainCircuit, Search, AlertTriangle, Loader } from 'lucide-react';

// Define the structure of the agent's response
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

export default function Home() {
  const [question, setQuestion] = useState<string>('');
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Call the local API route to communicate with the Algolia agent
      const res = await fetch('/api/devbuddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'The agent failed to respond.');
      }

      const data: AgentResponse = await res.json();
      
      if (!data.answer || !data.sources) {
        throw new Error('Received an invalid response structure from the agent.');
      }

      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 text-white">
      <div className="w-full max-w-3xl glass-container rounded-2xl p-6 md:p-8 shadow-2xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-500 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8" /> DevBuddy
          </h1>
          <p className="text-lg text-gray-300 mt-2">Ask questions about your codebase</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., How does the authentication middleware work?"
              className="w-full p-4 pl-12 pr-28 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-shadow"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? <><Loader className="animate-spin" size={20}/> Thinking...</> : 'Ask'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle />
            <div>
              <p className="font-bold">Error:</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {response && (
          <div className="glass-container border border-gray-700 rounded-lg p-6 space-y-6 animate-fade-in">
            {response.answer.text && response.answer.text.toLowerCase().includes('not found in codebase') ? (
               <div>
                 <h2 className="text-xl font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                    <AlertTriangle />Not found in codebase
                 </h2>
                 <p className="text-gray-300">{response.answer.text}</p>
               </div>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <Sparkles size={20} /> Short Answer
                  </h2>
                  <p className="text-gray-300 leading-relaxed">{response.answer.text}</p>
                </div>

                {response.sources.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-red-400 mb-3 flex items-center gap-2">
                      <FileCode size={20}/> Sources
                    </h2>
                    <ul className="space-y-2">
                      {response.sources.map((source, index) => (
                        <li key={index} className="glass-container p-3 rounded-md text-sm hover:border-red-500/50 transition-colors">
                           <a 
                             href={source.link} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="font-mono text-red-300 hover:underline break-all"
                           >
                            {source.path}
                           </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {response.answer.explanation && (
                   <div>
                     <h2 className="text-xl font-semibold text-red-400 mb-3 flex items-center gap-2">
                       <BrainCircuit size={20} /> Explanation
                     </h2>
                     <div className="prose prose-invert max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: response.answer.explanation }} />
                   </div>
                )}
                
                {response.answer.related && (
                   <div>
                     <h2 className="text-xl font-semibold text-red-400 mb-3 flex items-center gap-2">
                       <Sparkles size={20} /> Related Info
                     </h2>
                     <p className="text-gray-300">{response.answer.related}</p>
                   </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
