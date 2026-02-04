'use client';

import { motion } from 'framer-motion';

const examples = [
    'How is the codebase structured?',
    'What does the CI pipeline look like?',
    'Where is the user authentication logic?',
    'Walk me through the checkout process.',
  ];

export const WelcomeScreen = () => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center text-gray-400"
        >
            <h2 className="text-2xl font-semibold mb-4 text-white">Welcome to DevBuddy</h2>
            <p className="mb-8">Ask anything about this codebase. Here are some examples to get you started:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
                {examples.map((ex, i) => (
                    <div 
                        key={i} 
                        className="p-4 bg-white/5 rounded-lg text-sm text-center cursor-pointer hover:bg-white/10 transition-colors"
                    >
                        {ex}
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
