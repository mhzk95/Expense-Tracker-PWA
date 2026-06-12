"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function AnimatedCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ 
        opacity: 0, 
        scale: 0.8, 
        filter: "blur(10px) brightness(2)",
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
