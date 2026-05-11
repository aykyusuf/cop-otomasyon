"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Sparkles,
  Users,
  TrendingUp,
  Recycle,
  Leaf,
  Trash2,
  Biohazard,
  Star,
  Zap,
  Gift,
  Coffee,
  Ticket
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Leaderboard } from "@/components/incentive/leaderboard";
import { CreditAwardModal } from "@/components/incentive/credit-award-modal";
import { BadgeShowcase } from "@/components/incentive/badge-showcase";
import { useIncentiveStore, BADGES, CREDIT_AMOUNTS } from "@/lib/stores/incentive-store";
import type { Student } from "@/types";

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 flex items-center gap-3"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-white/50">{label}</div>
      </div>
    </motion.div>
  );
}

function TopStudentCard({
  student,
  rank,
}: {
  student: Student;
  rank: number;
}) {
  const rankEmoji = ["🥇", "🥈", "🥉"][rank - 1];
  const ringColors = [
    "ring-yellow-400/50",
    "ring-slate-300/50",
    "ring-orange-400/50",
  ];

  const topBadge = [...BADGES]
    .filter((b) => student.badges.includes(b.id) && b.requiredCredits > 0)
    .sort((a, b) => b.requiredCredits - a.requiredCredits)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`glass rounded-2xl p-5 text-center ring-1 ${ringColors[rank - 1]} relative overflow-hidden`}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{
          background:
            rank === 1
              ? "#f59e0b"
              : rank === 2
              ? "#94a3b8"
              : "#f97316",
        }}
      />
      <div className="relative z-10">
        <div className="text-3xl mb-2">{rankEmoji}</div>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400/30 to-cyan-400/30 flex items-center justify-center mx-auto mb-2 ring-2 ring-white/10">
          <span className="text-xl font-bold text-white">
            {student.name.charAt(0)}
          </span>
        </div>
        <h3 className="font-bold text-white text-sm">{student.name}</h3>
        <p className="text-xs text-white/40 mb-3">{student.department}</p>
        <div className="text-2xl font-bold text-emerald-400 mb-1">
          {student.credits.toLocaleString("tr-TR")}
        </div>
        <div className="text-xs text-white/40 mb-3">kredi</div>
        {topBadge && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
            <span>{topBadge.icon}</span>
            <span>{topBadge.name}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function TesvirPage() {
  const { students, init, initialized, getLeaderboard } = useIncentiveStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "badges" | "rewards">(
    "leaderboard"
  );

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  const leaderboard = getLeaderboard();
  const top3 = leaderboard.slice(0, 3);

  const totalCredits = students.reduce((s, st) => s + st.credits, 0);
  const totalThrows = students.reduce((s, st) => s + st.totalThrows, 0);
  const avgRecycling =
    students.length > 0
      ? Math.round(
          students.reduce((s, st) => s + st.recyclingRate, 0) / students.length
        )
      : 0;
  const studentsWithBadges = students.filter((s) => s.badges.length > 1).length;

  const wasteTypeInfo = [
    {
      type: "recyclable",
      label: "Geri Dönüşüm",
      icon: <Recycle className="w-4 h-4" />,
      color: "#22d3ee",
      credits: CREDIT_AMOUNTS.recyclable,
    },
    {
      type: "organic",
      label: "Organik",
      icon: <Leaf className="w-4 h-4" />,
      color: "#34d399",
      credits: CREDIT_AMOUNTS.organic,
    },
    {
      type: "general",
      label: "Genel Atık",
      icon: <Trash2 className="w-4 h-4" />,
      color: "#94a3b8",
      credits: CREDIT_AMOUNTS.general,
    },
    {
      type: "hazardous",
      label: "Tehlikeli",
      icon: <Biohazard className="w-4 h-4" />,
      color: "#f87171",
      credits: CREDIT_AMOUNTS.hazardous,
    },
  ];

  return (
    <>
      <DashboardHeader title="Öğrenci Teşvik Sistemi" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Hero + CTA */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background:
                "linear-gradient(135deg, #10b981 0%, #0ea5e9 50%, #8b5cf6 100%)",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">
                Geri Dönüşüm Ödül Programı
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Çöpünü At, Kredi Kazan! ♻️
            </h2>
            <p className="text-white/60 text-sm max-w-md">
              Doğru kutulara atık bırak, kredi biriktir, rozetler kazan ve
              kampüsün en çevreci öğrencisi ol.
            </p>
          </div>
          <motion.button
            id="open-award-modal-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setModalOpen(true)}
            className="relative z-10 flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/20 flex-shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Kredi Ver
          </motion.button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatPill
            icon={<Users className="w-5 h-5" />}
            label="Aktif Öğrenci"
            value={students.length}
            color="#34d399"
          />
          <StatPill
            icon={<Zap className="w-5 h-5" />}
            label="Toplam Kredi"
            value={totalCredits.toLocaleString("tr-TR")}
            color="#f59e0b"
          />
          <StatPill
            icon={<TrendingUp className="w-5 h-5" />}
            label="Toplam Atış"
            value={totalThrows}
            color="#818cf8"
          />
          <StatPill
            icon={<Recycle className="w-5 h-5" />}
            label="Ort. Geri Dönüşüm"
            value={`%${avgRecycling}`}
            color="#22d3ee"
          />
        </div>

        {/* Podium (top 3) */}
        {top3.length >= 3 && (
          <div>
            <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Podyum
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {top3.map((s, i) => (
                <TopStudentCard key={s.id} student={s} rank={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Tabs + Main content */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-white/10">
            {(
              [
                { id: "leaderboard", label: "Sıralama", icon: Trophy },
                { id: "rewards", label: "Ödüller & Kuponlar", icon: Gift },
                { id: "badges", label: "Rozetler & Kurallar", icon: Star },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-emerald-400 border-b-2 border-emerald-400"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === "leaderboard" && (
              <Leaderboard students={leaderboard} />
            )}
            {activeTab === "badges" && (
              <div className="space-y-6">
                {/* Rozet sistemi */}
                <div>
                  <h4 className="text-sm font-medium text-white/70 mb-3">
                    Tüm Rozetler
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {BADGES.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10 text-center"
                      >
                        <span className="text-2xl">{badge.icon}</span>
                        <span className="text-xs font-medium text-white/80">
                          {badge.name}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {badge.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kredi kuralları */}
                <div>
                  <h4 className="text-sm font-medium text-white/70 mb-3">
                    Kredi Tablosu
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {wasteTypeInfo.map((w) => (
                      <div
                        key={w.type}
                        className="flex items-center gap-3 p-3 rounded-xl"
                        style={{
                          background: `${w.color}11`,
                          border: `1px solid ${w.color}33`,
                        }}
                      >
                        <span style={{ color: w.color }}>{w.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">
                            {w.label}
                          </div>
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: w.color }}
                        >
                          +{w.credits}
                        </div>
                      </div>
                    ))}
                    {/* Bonus satırları */}
                    <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-orange-400/10 border border-orange-400/30">
                      <span className="text-orange-400">🔥</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          Streak Bonusu (3+ gün)
                        </div>
                        <div className="text-xs text-white/40">
                          Her atışta ekstra puan
                        </div>
                      </div>
                      <div className="text-lg font-bold text-orange-400">+2</div>
                    </div>
                    <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                      <span className="text-yellow-400">🎉</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          İlk Atış Bonusu
                        </div>
                        <div className="text-xs text-white/40">Tek seferlik</div>
                      </div>
                      <div className="text-lg font-bold text-yellow-400">+5</div>
                    </div>
                  </div>
                </div>

                {/* Rozet sahipliği */}
                <div>
                  <h4 className="text-sm font-medium text-white/70 mb-3">
                    🏅 Rozet Kazanan Öğrenciler: {studentsWithBadges}
                  </h4>
                  <div className="space-y-2">
                    {BADGES.filter((b) => b.requiredCredits > 0).map((badge) => {
                      const count = students.filter((s) =>
                        s.badges.includes(badge.id)
                      ).length;
                      const pct =
                        students.length > 0
                          ? (count / students.length) * 100
                          : 0;
                      return (
                        <div
                          key={badge.id}
                          className="flex items-center gap-3"
                        >
                          <span className="text-lg w-6">{badge.icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/70">{badge.name}</span>
                              <span className="text-white/40">
                                {count} öğrenci
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {activeTab === "rewards" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-400" /> Kredi Ödülleri
                  </h4>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Coffee className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white mb-1">Kahve & Tost Kuponu</div>
                        <div className="text-xs text-white/60">
                          Kantinden ücretsiz 1 adet filtre kahve ve kaşarlı tost kuponu. 
                          Yaklaşık 150 su şişesi geri dönüşümüne denk gelir. Ayrıca kağıt, pil, soda kapağı gibi diğer atık türlerinden de puan kazanabilirsiniz.
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-400">700</div>
                        <div className="text-[10px] uppercase tracking-wider text-emerald-400/50">Kredi</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Ticket className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white mb-1">Ücretsiz Yemekhane Fişi</div>
                        <div className="text-xs text-white/60">
                          Kampüs yemekhanesinde 1 günlük ücretsiz öğle veya akşam yemeği fişi.
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-blue-400">500</div>
                        <div className="text-[10px] uppercase tracking-wider text-blue-400/50">Kredi</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreditAwardModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
