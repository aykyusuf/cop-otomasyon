"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin, Route, BarChart3 } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: MapPin,
    title: "Gerçek Zamanlı Takip",
    description:
      "Kampüsteki tüm atık kutularının doluluk oranını canlı harita üzerinden izleyin.",
  },
  {
    icon: Route,
    title: "Akıllı Rota Planlama",
    description:
      "Yapay zeka destekli optimizasyon ile en verimli toplama rotasını oluşturun.",
  },
  {
    icon: BarChart3,
    title: "Detaylı Analitik",
    description:
      "Atık üretim trendlerini analiz edin, verimliliği ölçün ve karbon ayak izini azaltın.",
  },
];

export default function LandingPage() {
  return (
    <div className="aurora-bg min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center relative z-10 max-w-4xl"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-emerald-300 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          IoT Simülasyon Sistemi
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            EcoTrack
          </span>
          <br />
          <span className="text-3xl md:text-4xl font-medium text-white/80">
            Akıllı Kampüs Atık Yönetimi
          </span>
        </h1>

        <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
          Kampüsteki atık kutularını gerçek zamanlı takip edin, en verimli
          toplama rotalarını oluşturun ve sürdürülebilir bir kampüs için veri
          odaklı kararlar alın.
        </p>

        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            Dashboard&apos;a Git
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </Link>
      </motion.div>

      {/* Feature cards */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="grid md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full relative z-10"
      >
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.15 }}
            whileHover={{ y: -4 }}
            className="glass rounded-2xl p-6 group cursor-default"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <feature.icon className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
              {feature.title}
            </h3>
            <p className="text-white/50 text-sm leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
