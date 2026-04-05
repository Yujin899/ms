"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, BarChart, Clock } from "lucide-react";
import { GlobalQuestionStats } from "@/services/db";
import { Button } from "@/components/ui/button";

interface DistractorPopupProps {
  stats: GlobalQuestionStats | null;
  onClose: () => void;
}

export function DistractorPopup({ stats, onClose }: DistractorPopupProps) {
  if (!stats) return null;

  const { distractors, averageTimeTaken, failureRate, text, totalAttempts } = stats;
  
  // 1. Distractor Data Processing
  const distractorEntries = Object.entries(distractors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);
    
  const maxPicks = Math.max(...distractorEntries.map(([, count]) => count), 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-card w-full max-w-xl rounded-[2.5rem] border-2 border-b-8 border-border/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <header className="p-6 sm:p-8 flex items-center justify-between border-b-2 border-border/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <BarChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">Distractor Analysis</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase">{totalAttempts} Attempts Analyzed</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <X className="w-6 h-6" />
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
            {/* Question Text */}
            <div className="p-6 bg-muted/30 rounded-3xl border-2 border-dashed border-border/40">
               <p className="text-lg sm:text-xl font-black text-center font-arabic leading-relaxed" dir="rtl">
                 {text}
               </p>
            </div>

            {/* Distractor Chart */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1">Top Student Confusions</h4>
              {distractorEntries.length > 0 ? (
                <div className="space-y-3">
                  {distractorEntries.map(([option, count]) => (
                    <div key={option} className="space-y-1.5 px-1">
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span className="text-foreground -translate-y-px">{option}</span>
                        <span className="text-destructive">{count} Correct? (No)</span>
                      </div>
                      <div className="h-3 bg-muted/40 rounded-full overflow-hidden border border-border/10">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / maxPicks) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-destructive border-r-2 border-destructive-shadow flex items-center justify-end px-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground font-bold bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20">
                  Zero distractor data. Students are mastering this question!
                </div>
              )}
            </div>

            {/* Speed & Failure Comparison */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-5 rounded-3xl bg-amber-500/5 border-2 border-b-6 border-amber-500/20 text-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">Avg. Response Time</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black text-amber-700">{Math.round(averageTimeTaken)}s</p>
                    <span className="text-[10px] font-bold text-amber-600/70">{averageTimeTaken > 30 ? 'SLOWER' : 'FASTER'}</span>
                  </div>
               </div>

               <div className="p-5 rounded-3xl bg-destructive/5 border-2 border-b-6 border-destructive/20 text-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">Failure Intensity</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black text-destructive">{Math.round(failureRate * 100)}%</p>
                    <span className="text-[10px] font-bold text-destructive/70">{failureRate > 0.5 ? 'CRITICAL' : 'MILD'}</span>
                  </div>
               </div>
            </div>
          </div>

          <footer className="p-6 border-t-4 border-border/20 bg-muted/10">
             <Button className="w-full h-12 text-base font-black rounded-2xl" onClick={onClose}>
               Got it, Optimize Question
             </Button>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
