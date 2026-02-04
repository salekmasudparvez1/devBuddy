'use client';

import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export const GlassCard = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string, delay?: number }) => (
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
