"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

let isGlobalFirstLoad = true;

export default function Template({ children }: { children: React.ReactNode }) {
  const [isFirstLoad, setIsFirstLoad] = useState(isGlobalFirstLoad);

  useEffect(() => {
    isGlobalFirstLoad = false;
    setIsFirstLoad(false);
  }, []);

  return (
    <motion.div
      initial={isFirstLoad ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
