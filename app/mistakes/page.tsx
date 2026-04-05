"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { fetchUserMistakes, MistakeRecord } from "@/services/db";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { playClickSound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface GroupedMistake extends MistakeRecord {
  attemptCount: number;
}

export default function MistakesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [state, setState] = useState({
    mistakes: [] as GroupedMistake[],
    isLoaded: false,
  });

  useEffect(() => {
    async function load() {
      if (!profile?.uid) return;
      const savedMistakes = await fetchUserMistakes(profile.uid);
      
      // De-duplicate and group by question text
      const groups = new Map<string, GroupedMistake>();
      savedMistakes.forEach(m => {
        if (!groups.has(m.text)) {
          groups.set(m.text, { ...m, attemptCount: 1 });
        } else {
          groups.get(m.text)!.attemptCount += 1;
        }
      });

      setState({
        mistakes: Array.from(groups.values()),
        isLoaded: true,
      });
    }
    load();
  }, [profile?.uid]);

  const { mistakes, isLoaded } = state;

  if (!isLoaded) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto max-w-3xl flex h-16 items-center px-4 gap-4">
          <button 
            onClick={() => {
              playClickSound();
              router.push("/");
            }}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-xl font-black tracking-tight text-foreground uppercase">
            Mistakes Review
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        
        {mistakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center mt-20 space-y-4">
            <div className="bg-primary/10 rounded-full p-6 text-primary mb-2">
               <BookOpen className="w-16 h-16" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground">No Mistakes Yet!</h2>
            <p className="text-muted-foreground font-medium text-lg max-w-sm">
              Keep practicing. Whenever you answer incorrectly, we&apos;ll save it here so you can review it later.
            </p>
            <Button 
              size="lg" 
              className="mt-6 px-12 pt-[18px] pb-[22px] text-xl font-black rounded-2xl border-b-4 hover:border-b-4 transition-all"
              onClick={() => router.push("/")}
            >
              START LEARNING
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Your Saved Mistakes
              </h1>
              <p className="text-lg font-medium text-muted-foreground">
                Review these carefully. Your teacher will construct quizzes using these saved questions!
              </p>
            </div>

            {/* @ts-expect-error - Radix UI Accordion type mismatch with React 19 */}
            <Accordion type="single" collapsible="true" className="w-full space-y-4 mt-8">
              {mistakes.map((mistake) => (
                <AccordionItem
                  key={mistake.id}
                  value={mistake.id}
                  className="border-none bg-transparent overflow-visible"
                >
                  <AccordionTrigger 
                    className={cn(
                      "w-full border-2 border-b-4 rounded-2xl transition-all active:translate-y-[2px] active:border-b-0 pt-[14px] pb-[18px] sm:pt-[18px] sm:pb-[22px] px-6 text-left hover:no-underline",
                      mistake.attemptCount >= 3 
                        ? "bg-[#E2725B]/5 border-[#E2725B]/40 hover:border-[#E2725B] focus-visible:ring-[#E2725B]/50 data-[state=open]:border-[#E2725B]/60" 
                        : mistake.attemptCount === 2
                          ? "bg-warning/20 border-warning/60 hover:border-warning focus-visible:ring-warning/50 data-[state=open]:border-warning/60"
                          : "bg-card border-border/60 hover:border-border focus-visible:ring-warning/50 data-[state=open]:border-warning/50"
                    )}
                  >
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="space-y-1">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "mb-2 text-[10px] font-bold uppercase tracking-wider py-0.5 font-sans",
                            mistake.attemptCount >= 3 
                              ? "border-[#E2725B]/20 bg-[#E2725B]/10 text-[#E2725B]" 
                              : "border-warning/20 bg-warning/10 text-warning"
                          )}
                        >
                          {mistake.topic}
                        </Badge>
                        <h3 className="text-lg font-black text-foreground leading-tight">
                          {mistake.text}
                        </h3>
                      </div>

                      {/* Difficulty Scale Badge */}
                      {mistake.attemptCount > 1 && (
                        <div className={cn(
                          "shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border-x border-t border-b-4 transition-all shadow-sm -rotate-2 group-hover:rotate-0",
                          mistake.attemptCount >= 3 
                            ? "bg-[#E2725B] border-[#E2725B]/80 text-white border-b-[#A14B3A]" 
                            : "bg-warning border-warning/80 text-white border-b-warning-shadow"
                        )}>
                          <span className="text-[10px] font-black uppercase tracking-tighter pt-1">
                            {mistake.attemptCount >= 3 ? "Needs Extra Focus" : `${mistake.attemptCount} Mastery Attempts`}
                          </span>
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-4 px-2">
                    <div className="space-y-4">
                      {/* Options Review */}
                      <div className="grid gap-2">
                        {mistake.options.map((option) => {
                          const isCorrect = option === mistake.correctAnswer;
                          const isUserAnswer = option === mistake.userAnswer;

                          let boxStyles = "border-border/40 text-foreground/70 bg-muted/20";
                          let icon = null;

                          if (isCorrect) {
                            boxStyles = "border-primary bg-primary/5 text-primary border-2 font-bold";
                            icon = <CheckCircle2 className="w-5 h-5 ml-auto shrink-0" />;
                          } else if (isUserAnswer) {
                            boxStyles = "border-warning bg-warning/5 text-warning-shadow border-2 font-bold";
                            icon = <XCircle className="w-5 h-5 ml-auto shrink-0" />;
                          }

                          return (
                            <div 
                              key={option} 
                              className={`flex items-center px-5 py-3 rounded-xl border transition-all text-base ${boxStyles}`}
                            >
                              <span className="flex-1">{option}</span>
                              {icon}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="p-5 rounded-2xl bg-secondary/5 border-2 border-secondary/10 mt-2">
                        <div className="flex items-start gap-4">
                          <div className="bg-secondary/10 p-2 rounded-xl">
                            <Lightbulb className="w-5 h-5 text-secondary shrink-0" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-secondary/80 uppercase tracking-widest mb-2">
                              Smart Context
                            </p>
                            <p className="text-foreground/90 font-bold text-base leading-relaxed text-right font-arabic" dir="rtl">
                              {mistake.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {/* Final CTA for Mistakes Review */}
            <div className="pt-8 pb-12 flex justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="w-full sm:w-auto px-12 pt-[18px] pb-[22px] text-xl font-black rounded-2xl border-b-4 hover:border-b-4 transition-all"
                onClick={() => router.push("/")}
              >
                PRACTICE THESE NOW
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
