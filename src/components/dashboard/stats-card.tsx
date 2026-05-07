"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  trend?: string;
  color: string;
  delay?: number;
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const prevValueRef = useRef(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Only do the full 0→value animation on first mount
    // After that, just update directly to avoid constant reset
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      const duration = 1000;
      const steps = 30;
      const increment = value / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        setDisplay(Math.min(value, increment * step));
        if (step >= steps) clearInterval(timer);
      }, duration / steps);

      prevValueRef.current = value;
      return () => clearInterval(timer);
    }

    // Subsequent updates: smooth transition from previous value
    setDisplay(value);
    prevValueRef.current = value;
  }, [value]);

  return (
    <span>
      {suffix === "%" ? display.toFixed(1) : Math.round(display)}
      {suffix}
    </span>
  );
}

export function StatsCard({
  title,
  value,
  suffix,
  icon: Icon,
  trend,
  color,
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      whileHover={{ y: -2 }}
      className="glass rounded-xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold">
          <AnimatedNumber value={value} suffix={suffix} />
        </p>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        )}
      </div>
    </motion.div>
  );
}
