"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Recycle, Leaf, Trash2, Biohazard, Sparkles, ChevronDown } from "lucide-react";
import { useIncentiveStore } from "@/lib/stores/incentive-store";
import type { WasteType } from "@/types";
import { BADGES } from "@/lib/stores/incentive-store";

interface CreditAwardModalProps {
  open: boolean;
  onClose: () => void;
}

const WASTE_OPTIONS: {
  type: WasteType;
  label: string;
  icon: React.ReactNode;
  credits: number;
  color: string;
  bg: string;
}[] = [
  {
    type: "recyclable",
    label: "Geri Dönüşüm",
    icon: <Recycle className="w-5 h-5" />,
    credits: 3,
    color: "text-cyan-400",
    bg: "border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20",
  },
  {
    type: "organic",
    label: "Organik",
    icon: <Leaf className="w-5 h-5" />,
    credits: 2,
    color: "text-emerald-400",
    bg: "border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20",
  },
  {
    type: "general",
    label: "Genel Atık",
    icon: <Trash2 className="w-5 h-5" />,
    credits: 1,
    color: "text-slate-400",
    bg: "border-slate-400/30 bg-slate-400/10 hover:bg-slate-400/20",
  },
  {
    type: "hazardous",
    label: "Tehlikeli",
    icon: <Biohazard className="w-5 h-5" />,
    credits: 5,
    color: "text-red-400",
    bg: "border-red-400/30 bg-red-400/10 hover:bg-red-400/20",
  },
];

export function CreditAwardModal({ open, onClose }: CreditAwardModalProps) {
  const { students, awardCredits, initialized, init } = useIncentiveStore();

  if (!initialized) init();

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedWasteType, setSelectedWasteType] = useState<WasteType | null>(null);
  const [result, setResult] = useState<{
    studentName: string;
    amount: number;
    newBadges: string[];
  } | null>(null);
  const [step, setStep] = useState<"select" | "success">("select");

  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, "tr"));

  const handleAward = () => {
    if (!selectedStudentId || !selectedWasteType) return;
    const { student, amount, newBadges } = awardCredits(
      selectedStudentId,
      selectedWasteType
    );
    const badgeNames = newBadges.map(
      (id) => BADGES.find((b) => b.id === id)?.icon ?? ""
    );
    setResult({ studentName: student.name, amount, newBadges: badgeNames });
    setStep("success");
  };

  const handleClose = () => {
    setStep("select");
    setSelectedStudentId("");
    setSelectedWasteType(null);
    setResult(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white text-sm">Kredi Ver</h2>
                  <p className="text-xs text-white/40">Atık simülasyonu</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {step === "select" ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Öğrenci seçimi */}
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-2">
                        Öğrenci Seç
                      </label>
                      <div className="relative">
                        <select
                          id="student-select"
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors pr-10"
                        >
                          <option value="" disabled className="bg-slate-800">
                            -- Öğrenci seçin --
                          </option>
                          {sorted.map((s) => (
                            <option key={s.id} value={s.id} className="bg-slate-800">
                              {s.name} ({s.credits} kredi)
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                      </div>
                    </div>

                    {/* Atık türü */}
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-2">
                        Atık Türü
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {WASTE_OPTIONS.map((opt) => (
                          <button
                            key={opt.type}
                            id={`waste-type-${opt.type}`}
                            onClick={() => setSelectedWasteType(opt.type)}
                            className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-left ${
                              selectedWasteType === opt.type
                                ? `${opt.bg} ${opt.color} border-opacity-100`
                                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/8"
                            }`}
                          >
                            <span className={selectedWasteType === opt.type ? opt.color : ""}>
                              {opt.icon}
                            </span>
                            <div>
                              <div className="text-xs font-medium">{opt.label}</div>
                              <div className={`text-xs ${selectedWasteType === opt.type ? opt.color : "text-white/40"}`}>
                                +{opt.credits} kredi
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <motion.button
                      id="award-credits-btn"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAward}
                      disabled={!selectedStudentId || !selectedWasteType}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Kredi Ver
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 space-y-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="text-6xl"
                    >
                      🎉
                    </motion.div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        +{result?.amount} Kredi!
                      </h3>
                      <p className="text-white/60 text-sm mt-1">
                        {result?.studentName} kredilendi
                      </p>
                    </div>
                    {result?.newBadges && result.newBadges.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3"
                      >
                        <p className="text-yellow-400 text-xs font-medium mb-1">
                          🏅 Yeni Rozet Kazanıldı!
                        </p>
                        <div className="flex items-center justify-center gap-2 text-2xl">
                          {result.newBadges.map((b, i) => (
                            <span key={i}>{b}</span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setStep("select");
                          setResult(null);
                        }}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm hover:bg-white/5 transition-colors"
                      >
                        Tekrar Ver
                      </button>
                      <button
                        onClick={handleClose}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
                      >
                        Kapat
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
