"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award } from "lucide-react";
import type { Student } from "@/types";
import { BADGES } from "@/lib/stores/incentive-store";

interface LeaderboardProps {
  students: Student[];
}

const rankColors = [
  "from-yellow-400/20 to-amber-400/10 border-yellow-400/30",
  "from-slate-300/20 to-slate-400/10 border-slate-300/30",
  "from-orange-400/20 to-amber-600/10 border-orange-400/30",
];

const rankIcons = [
  <Trophy key="1" className="w-5 h-5 text-yellow-400" />,
  <Medal key="2" className="w-5 h-5 text-slate-300" />,
  <Award key="3" className="w-5 h-5 text-orange-400" />,
];

function getCreditColor(credits: number) {
  if (credits >= 1000) return "text-yellow-400";
  if (credits >= 500) return "text-emerald-400";
  if (credits >= 200) return "text-cyan-400";
  return "text-blue-400";
}

export function Leaderboard({ students }: LeaderboardProps) {
  const top = students.slice(0, 10);

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {top.map((student, index) => {
          const isTop3 = index < 3;
          const badge = BADGES.find((b) =>
            student.badges.includes(b.id) && b.requiredCredits > 0
              ? true
              : false
          );
          const topBadge = [...BADGES]
            .filter((b) => student.badges.includes(b.id) && b.requiredCredits > 0)
            .sort((a, b) => b.requiredCredits - a.requiredCredits)[0];

          return (
            <motion.div
              key={student.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isTop3
                  ? `bg-gradient-to-r ${rankColors[index]}`
                  : "bg-white/5 border-white/10 hover:bg-white/8"
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                {isTop3 ? (
                  rankIcons[index]
                ) : (
                  <span className="text-sm font-bold text-white/40">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 flex items-center justify-center flex-shrink-0 border border-white/10">
                <span className="text-sm font-bold text-white">
                  {student.name.charAt(0)}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white truncate">
                    {student.name}
                  </span>
                  {topBadge && (
                    <span className="text-base leading-none" title={topBadge.name}>
                      {topBadge.icon}
                    </span>
                  )}
                  {student.streakDays >= 3 && (
                    <span className="text-xs text-orange-400 font-medium">
                      🔥 {student.streakDays}g
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/40 truncate">
                  {student.department}
                </div>
              </div>

              {/* Credits */}
              <div className="text-right flex-shrink-0">
                <div className={`text-base font-bold ${getCreditColor(student.credits)}`}>
                  {student.credits.toLocaleString("tr-TR")}
                </div>
                <div className="text-xs text-white/40">kredi</div>
              </div>

              {/* Progress bar for top3 */}
              {isTop3 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (student.credits / 1000) * 100)}%`,
                    }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
