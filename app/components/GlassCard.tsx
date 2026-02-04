'use client';

import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    className={cn(
      'relative backdrop-blur-xl bg-white/[0.03] dark:bg-slate-900/20 border border-white/[0.08] dark:border-slate-700 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl overflow-hidden transition-transform hover:-translate-y-1',
      'p-4 sm:p-6 md:p-8',
      className
    )}
  >
    {/* Inner top highlight for depth */}
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50 pointer-events-none" />
    {children}
  </motion.div>
);
