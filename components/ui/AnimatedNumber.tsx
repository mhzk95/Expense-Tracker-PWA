"use client";

import React, { useEffect, useState } from "react";
import { useSpring, useMotionValue } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  initialValue?: number;
  formatFn?: (val: number) => string;
  className?: string;
  stiffness?: number;
  damping?: number;
}

export function AnimatedNumber({
  value,
  initialValue = 0,
  formatFn,
  className,
  stiffness = 90,
  damping = 20,
}: AnimatedNumberProps) {
  const motionVal = useMotionValue(initialValue);
  const spring = useSpring(motionVal, { stiffness, damping });
  const [displayValue, setDisplayValue] = useState(() =>
    formatFn ? formatFn(initialValue) : Math.round(initialValue).toString()
  );

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(formatFn ? formatFn(latest) : Math.round(latest).toString());
    });
    return () => unsubscribe();
  }, [spring, formatFn]);

  return <span className={className}>{displayValue}</span>;
}
