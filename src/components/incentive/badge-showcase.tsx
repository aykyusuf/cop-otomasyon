"use client";

import { motion } from "framer-motion";
import { BADGES } from "@/lib/stores/incentive-store";
import type { BadgeId } from "@/types";

interface BadgeShowcaseProps {
  earned: BadgeId[];
  size?: "sm" | "md";
}

export function BadgeShowcase({ earned, size = "md" }: BadgeShowcaseProps) {
  const isSmall = size === "sm";

  return (
    <div className={`flex flex-wrap gap-${isSmall ? "1.5" : "2"}`}>
      {BADGES.map((badge, i) => {
        const hasIt = earned.includes(badge.id);
        return (
          <motion.div
            key={badge.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05, type: "spring" }}
            title={`${badge.name}: ${badge.description}`}
            className={`relative flex flex-col items-center justify-center rounded-xl border transition-all cursor-default ${
              isSmall ? "w-10 h-10" : "w-14 h-14"
            } ${
              hasIt
                ? "bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 border-emerald-400/40"
                : "bg-white/5 border-white/10 opacity-30 grayscale"
            }`}
          >
            <span className={isSmall ? "text-lg" : "text-2xl"}>{badge.icon}</span>
            {!isSmall && (
              <span className="text-[9px] text-white/50 mt-0.5 text-center leading-tight px-1">
                {badge.name}
              </span>
            )}
            {hasIt && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border border-slate-900"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 + 0.2 }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
