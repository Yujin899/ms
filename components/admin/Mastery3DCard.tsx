"use client";

import { motion } from "framer-motion";
import { GlobalQuestionStats } from "@/services/db";
import { playClickSound } from "@/lib/audio";
import { BarChart3, Clock, AlertTriangle } from "lucide-react";

interface Mastery3DCardProps {
  stats: GlobalQuestionStats;
  onClick: (stats: GlobalQuestionStats) => void;
}

export function Mastery3DCard({ stats, onClick }: Mastery3DCardProps) {
  const { failureRate, averageTimeTaken, text, totalAttempts } = stats;

  // 1. Difficulty Scaling (OKLCH mapping)
  const getDifficultyColor = () => {
    if (totalAttempts === 0) return "bg-muted/10 border-muted/20 text-muted-foreground";
    if (failureRate <= 0.2) return "bg-[#46a30220] border-[#46a302] text-[#46a302]";
    if (failureRate <= 0.5) return "bg-[#ff960020] border-[#ff9600] text-[#ff9600]";
    return "bg-[#ff4b4b20] border-[#ff4b4b] text-[#ff4b4b]";
  };

  const getBorderColor = () => {
    if (totalAttempts === 0) return "border-b-muted/20";
    if (failureRate <= 0.2) return "border-b-[#3a8502]";
    if (failureRate <= 0.5) return "border-b-[#d97706]";
    return "border-b-[#d43f3f]";
  };

  // 2. Weighted Border (4px to 12px based on time)
  const borderThickness = Math.min(Math.max((averageTimeTaken / 15) * 4, 4), 12);

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ y: 2, scale: 0.98 }}
      onClick={() => {
        playClickSound();
        onClick(stats);
      }}
      className={`relative w-full p-6 rounded-[2rem] border-2 border-b-[${borderThickness}px] text-left transition-all flex flex-col gap-4 font-nunito ${getDifficultyColor()} ${getBorderColor()} shadow-xl group`}
      style={{ borderBottomWidth: `${borderThickness}px` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {failureRate > 0.5 ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <BarChart3 className="w-4 h-4" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest">{totalAttempts} Attempts</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/20 text-[10px] font-black uppercase">
          <Clock className="w-3 h-3" />
          {Math.round(averageTimeTaken)}s
        </div>
      </div>

      {/* Optically Centered Arabic/English Content */}
      <div className="flex-1 flex items-center justify-center py-4">
        <p 
          className="text-lg sm:text-xl font-black text-center leading-relaxed font-arabic" 
          dir="rtl"
        >
          {text}
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-current/10 flex items-center justify-between">
         <span className="text-[10px] font-black uppercase opacity-60">Failure Rate</span>
         <span className="text-xl font-black">{Math.round(failureRate * 100)}%</span>
      </div>

      {/* Decorative Shine */}
      <div className="absolute inset-0 rounded-[2rem] bg-linear-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}
