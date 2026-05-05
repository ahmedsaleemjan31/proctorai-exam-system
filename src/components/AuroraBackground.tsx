import React from 'react';
import { motion } from 'motion/react';

export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-2] bg-[#050505]">
      {/* Top Left Indigo Blob */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 100, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/30 blur-[140px] mix-blend-screen"
      />
      {/* Bottom Right Purple Blob */}
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -100, 0],
          y: [0, 100, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-600/20 blur-[150px] mix-blend-screen"
      />
      {/* Middle Blue Blob */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
          x: [0, 50, -50, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] right-[20%] w-[50vw] h-[50vw] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen"
      />
    </div>
  );
}
