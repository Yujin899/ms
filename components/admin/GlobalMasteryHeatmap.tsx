"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalQuestionStats, fetchGlobalQuestionStats } from "@/services/db";
import { Mastery3DCard } from "./Mastery3DCard";
import { DistractorPopup } from "./DistractorPopup";
import { Loader2, LayoutGrid, AlertCircle } from "lucide-react";

export function GlobalMasteryHeatmap() {
  const [stats, setStats] = useState<GlobalQuestionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStats, setSelectedStats] = useState<GlobalQuestionStats | null>(null);

  useEffect(() => {
    async function load() {
      const data = await fetchGlobalQuestionStats();
      setStats(data);
      setLoading(false);
    }
    load();
  }, []);

  // 1. Group Question Stats by Unit
  const groupedStats = useMemo(() => {
    const groups: Record<string, GlobalQuestionStats[]> = {};
    stats.forEach(s => {
      if (!groups[s.unitTitle]) {
        groups[s.unitTitle] = [];
      }
      groups[s.unitTitle].push(s);
    });
    return groups;
  }, [stats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-black uppercase text-xs tracking-widest">Aggregating Mastery Data...</p>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 p-8 text-center bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/40">
        <div className="w-20 h-20 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
          <LayoutGrid className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black text-foreground">Zero Analytics Recorded</h3>
          <p className="text-muted-foreground font-bold max-w-xs mx-auto">
            Once students start taking quizzes, this heatmap will reveal the collective curriculum difficulty.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="p-6 bg-amber-500/5 rounded-[2.5rem] border-2 border-b-6 border-amber-500/10 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-lg font-black text-amber-700">Analytics Intelligence</h3>
          <p className="text-sm font-bold text-amber-600/70 max-w-2xl leading-relaxed">
            Cards turn **Red** when the shared failure rate exceeds 50%. 
            Heavy **bottom borders** indicate longer average response cycles (higher cognitive load).
          </p>
        </div>
      </div>

      <AnimatePresence>
        {Object.entries(groupedStats).map(([unit, unitStats], uIdx) => (
          <motion.section 
            key={unit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: uIdx * 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 px-2">
              <h2 className="text-2xl font-black text-foreground">{unit}</h2>
              <div className="h-[2px] flex-1 bg-border/20 rounded-full" />
              <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                {unitStats.length} Question Assets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unitStats.map(s => (
                <Mastery3DCard 
                  key={s.questionId} 
                  stats={s} 
                  onClick={setSelectedStats} 
                />
              ))}
            </div>
          </motion.section>
        ))}
      </AnimatePresence>

      <DistractorPopup 
        stats={selectedStats} 
        onClose={() => setSelectedStats(null)} 
      />
    </div>
  );
}
