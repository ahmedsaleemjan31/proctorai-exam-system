import React, { useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

export default function TiltCard({ children, className = "", maxTilt = 10 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  // Motion values for raw mouse position percentages
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for the tilt
  const springConfig = { stiffness: 150, damping: 20, mass: 0.5 };
  const mouseX = useSpring(x, springConfig);
  const mouseY = useSpring(y, springConfig);

  // Map mouse position to rotation degrees
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    // Calculate mouse position relative to card center as a percentage (-0.5 to 0.5)
    const mouseXPos = (e.clientX - rect.left) / rect.width;
    const mouseYPos = (e.clientY - rect.top) / rect.height;

    x.set(mouseXPos - 0.5);
    y.set(mouseYPos - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="perspective-1000 w-full h-full">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative transition-all duration-200 ease-out ${className}`}
      >
        {/* Shadow that moves in opposite direction for depth */}
        <motion.div 
          style={{
            x: useTransform(mouseX, [-0.5, 0.5], [10, -10]),
            y: useTransform(mouseY, [-0.5, 0.5], [10, -10]),
          }}
          className="absolute inset-0 bg-black/40 blur-2xl rounded-2xl -z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        />
        
        {/* Content Wrapper with translateZ for parallax effect */}
        <div className="h-full w-full" style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
