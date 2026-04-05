"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { fetchUnits, Unit } from "@/services/db";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface UnitsListProps {
  units?: Unit[];
  profile?: { uid: string };
}

export function UnitsList({ units: propUnits, profile }: UnitsListProps) {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (propUnits) {
      setUnits(propUnits);
      setIsLoading(false);
      return;
    }

    async function loadData() {
      try {
        const result = await fetchUnits();
        setUnits(result);
      } catch (error) {
        console.error("Failed to fetch units:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [profile?.uid, profile, propUnits]);

  if (isLoading) {
    return (
      <div className="space-y-4 mt-8 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* @ts-expect-error - Radix UI Accordion type mismatch with React 19 */}
      <Accordion type="single" collapsible="true" className="w-full space-y-4">
        {units.map((unit) => {
          const completedCount = unit.quizzes.filter(q => q.completed).length;
          const totalCount = unit.quizzes.length;
          const isFullyCompleted = completedCount === totalCount && totalCount > 0;

          return (
            <AccordionItem
              key={unit.id}
              value={unit.id}
              className="border-none shadow-none"
            >
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <AccordionTrigger className="group/trigger hover:no-underline px-4 pt-[16px] pb-[20px] text-left bg-card border-2 border-b-4 border-border/60 rounded-2xl transition-all active:translate-y-[2px] active:border-b-2 data-[state=open]:border-primary/50 data-[state=open]:bg-primary/2">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                      isFullyCompleted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-foreground leading-none">
                        {unit.title}
                      </h3>
                      <p className="text-sm font-bold text-muted-foreground mt-1.5 line-clamp-1">
                        {unit.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Indicator Pill */}
                  <div className={cn(
                    "hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border-2 text-xs font-black transition-colors uppercase tracking-widest",
                    isFullyCompleted 
                      ? "bg-primary/10 border-primary/20 text-primary" 
                      : "bg-muted/50 border-border/40 text-muted-foreground"
                  )}>
                    {completedCount}/{totalCount} <span className="opacity-60">Quizzes</span>
                  </div>
                </div>
              </AccordionTrigger>
            </motion.div>
              <AccordionContent className="pb-2 pt-4 px-2">
                <div className="space-y-3">
                  {unit.quizzes.map((quiz, qIndex) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-3 rounded-xl border-2 border-b-2 border-border/40 bg-muted/20 hover:bg-muted/40 transition-all hover:border-border/60"
                    >
                      <div className="flex items-center gap-3">
                        {quiz.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30">
                            <span className="text-xs font-bold text-muted-foreground">{qIndex + 1}</span>
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-foreground text-sm">{quiz.title}</div>
                          <div className="text-[10px] font-black tracking-widest uppercase flex flex-wrap gap-1.5 mt-1">
                            {(quiz.topic.toLowerCase() === 'both' ? ['vocabulary', 'grammar'] : [quiz.topic]).map(t => (
                              <span key={t} className="text-muted-foreground/80 bg-muted/30 px-2 py-0.5 rounded-md border border-border/40">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant={quiz.completed ? "secondary" : "default"} 
                        size="sm"
                        className="transition-all"
                        onClick={() => router.push(`/quiz/${quiz.id}`)}
                      >
                        {quiz.completed ? "Review" : "Start"}
                      </Button>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
