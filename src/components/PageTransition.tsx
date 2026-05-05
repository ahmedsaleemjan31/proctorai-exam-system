import React from 'react';
import { motion } from 'motion/react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
}
