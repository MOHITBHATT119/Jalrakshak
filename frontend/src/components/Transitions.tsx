import React from 'react';
import { motion } from 'framer-motion';

export const PageTransition = ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="page-transition"
    >
      <div className="page-header" style={{ background: 'transparent', border: 'none', padding: '0 0 24px 0' }}>
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="text-muted mt-2">{subtitle}</p>}
        </div>
      </div>
 {children}
 </motion.div>
 );
};

export const CardTransition = ({ children, delay = 0, className = 'card' }: { children: React.ReactNode; delay?: number; className?: string }) => {
 return (
 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
 className={className}
 whileHover={{ y: -4, transition: { duration: 0.2 } }}
 >
 {children}
 </motion.div>
 );
};
