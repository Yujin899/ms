"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

interface CountUpProps {
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export function CountUp({ to, duration = 2, className, suffix = "" }: CountUpProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(0, to, {
      duration: duration,
      onUpdate(value) {
        node.textContent = Math.round(value).toLocaleString() + suffix;
      },
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [to, duration, suffix]);

  return <span ref={nodeRef} className={className}>0{suffix}</span>;
}
