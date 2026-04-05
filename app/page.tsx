"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  CheckCircle2, 
  Target, 
  AlertCircle,
  LayoutDashboard,
  BookOpen
} from "lucide-react";
import { 
  fetchUnits, 
  fetchAllUserProgress, 
  fetchTotalMistakesCount,
  Unit,
  Quiz
} from "@/services/db";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UnitsList } from "@/components/home/UnitsList";
import { CountUp } from "@/components/ui/count-up";
import { motion, Variants } from "framer-motion";

export default function Dashboard() {
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [masteryScore, setMasteryScore] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [nextQuiz, setNextQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animation variants
  const statsVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    show: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25
      }
    }
  };

  useEffect(() => {
    if (!profile?.uid) {
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }

    async function loadStats() {
      setIsLoading(true);
      try {
        const userId = profile!.uid;
        const allProgress = await fetchAllUserProgress(userId);
        const totalMistakesAllTime = await fetchTotalMistakesCount(userId);
        setTotalMistakes(totalMistakesAllTime);
        
        // Calculate Total Correct from both Daily Progress and Completed Quizzes (Mastery Historical)
        const dailyCorrect = (allProgress.daily || []).reduce((acc, curr) => acc + (curr.vocabulary || 0) + (curr.grammar || 0), 0);
        const quizCorrect = (allProgress.completed || []).reduce((acc, curr) => acc + (curr.score || 0), 0);
        
        const totalCorrectAllTime = dailyCorrect + quizCorrect;
        setTotalCorrect(totalCorrectAllTime);
        
        const totalAttempted = totalCorrectAllTime + totalMistakesAllTime;
        const calculatedMastery = totalAttempted > 0 ? (totalCorrectAllTime / totalAttempted) * 100 : 0;
        setMasteryScore(calculatedMastery);

        const unitsData = await fetchUnits(userId);
        setUnits(unitsData);

        // Find first incomplete quiz
        let found: Quiz | null = null;
        for (const unit of unitsData) {
          const incomplete = (unit.quizzes || []).find(q => !q.completed);
          if (incomplete) {
            found = incomplete;
            break;
          }
        }
        // If all complete, suggest first one for retake
        if (!found && unitsData.length > 0 && unitsData[0].quizzes.length > 0) {
          found = unitsData[0].quizzes[0];
        }
        setNextQuiz(found);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [profile?.uid, profile?.role, profile]);


  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-primary font-black text-xs uppercase tracking-tighter">MS</span>
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Synchronizing...</h2>
            <p className="text-muted-foreground font-bold max-w-[240px]">Waking up your mastery dashboard and learning brain.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b-2 border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto max-w-3xl flex h-16 items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-xl bg-primary px-3 py-1.5 border-b-4 border-primary-shadow">
              <span className="text-white font-black text-xl leading-none">MS</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => router.push("/mistakes")}
              className="h-10 rounded-xl font-bold"
            >
              Mistakes
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logout()}
              className="h-10 rounded-xl border-border text-foreground hover:bg-muted font-bold"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex-1 w-full max-w-3xl mx-auto px-4 py-8 space-y-12"
      >
        <div className="bg-card border-2 border-b-8 border-border/80 rounded-[32px] p-8 sm:p-10 flex flex-col items-center text-center gap-8 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full -ml-16 -mb-16 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
          
          <div className="space-y-3 relative z-10">
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
              {nextQuiz?.completed ? (
                <>Ready to <span className="text-primary tracking-tighter">RE-MASTER?</span></>
              ) : (
                <>Ready to <span className="text-primary uppercase tracking-tighter">Level Up?</span></>
              )}
            </h1>
            <p className="text-muted-foreground font-bold text-lg max-w-md">
              {nextQuiz?.completed 
                ? "You've conquered this challenge. Ready to sharpen your score or review the essentials?"
                : "Your journey to English mastery continues. Sharpen your skills with a fresh challenge."}
            </p>
          </div>

          {nextQuiz && (
            <div className="flex flex-col items-center gap-8 w-full relative z-10">
              {nextQuiz.completed ? (
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
                  <Button 
                    variant="secondary" 
                    size="xl" 
                    className="w-full sm:w-[180px] uppercase border-2 bg-card hover:bg-muted/50 transition-all border-b-4 active:border-b-2 active:translate-y-px h-16 rounded-2xl font-black text-lg"
                    onClick={() => router.push(`/quiz/${nextQuiz.id}?mode=preview`)}
                  >
                    PREVIEW
                  </Button>
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="w-full sm:w-[220px] uppercase shadow-xl shadow-primary/20 h-16 rounded-2xl font-black text-lg"
                    onClick={() => router.push(`/quiz/${nextQuiz.id}`)}
                  >
                    RETAKE
                  </Button>
                </div>
              ) : (
                <motion.div 
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-full sm:w-auto"
                >
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="w-full sm:w-auto min-w-[280px] uppercase shadow-xl shadow-primary/20 h-16 rounded-2xl font-black text-lg"
                    onClick={() => router.push(`/quiz/${nextQuiz.id}`)}
                  >
                    CONTINUE LEARNING
                  </Button>
                </motion.div>
              )}
              
              <div className="flex flex-col items-center space-y-1">
                <p className="text-xl font-bold text-muted-foreground">
                  Current Target: <span className="text-foreground font-black tracking-tight">{nextQuiz.title}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {(nextQuiz.topic.toLowerCase() === 'both' ? ['vocabulary', 'grammar'] : [nextQuiz.topic]).map((topic) => (
                    <div 
                      key={topic}
                      className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-primary/80 uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-full border border-primary/20"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <motion.div 
          variants={statsVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12"
        >
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-card border-2 border-b-4 border-border/60 rounded-2xl p-5 flex flex-col gap-4 transition-all hover:border-emerald-500/50 group cursor-default shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/15 transition-colors">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-600 leading-none">
                  <CountUp to={totalCorrect} />
                </div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-70">Total Correct</div>
              </div>
            </div>
            
            {totalCorrect < 1000 && (
              <div className="space-y-2 pt-1 border-t border-border/40">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-warning-shadow/80">
                  <span>Road to 1K</span>
                  <span><CountUp to={Math.round((totalCorrect / 1000) * 100)} suffix="%" /></span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/40 p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalCorrect / 1000) * 100, 100)}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.5 }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>
            )}
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-card border-2 border-b-4 border-border/60 rounded-2xl p-5 flex flex-col gap-4 transition-all hover:border-blue-500/50 group cursor-default shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/15 transition-colors">
                <Target className="w-7 h-7" />
              </div>
              <div>
                <div className="text-3xl font-black text-blue-600 leading-none">
                  <CountUp to={Math.round(masteryScore)} suffix="%" />
                </div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-70">Mastery Score</div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-muted-foreground/80 pt-1 border-t border-border/40">
              Based on total accuracy
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-card border-2 border-b-4 border-border/60 rounded-2xl p-5 flex flex-col gap-4 transition-all hover:border-warning/50 group cursor-default shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-warning/10 text-warning group-hover:bg-warning/15 transition-colors">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <div className="text-3xl font-black text-warning-shadow leading-none">
                  <CountUp to={totalMistakes} />
                </div>
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-70">To Review</div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-muted-foreground/80 pt-1 border-t border-border/40">
              Unique weak points
            </div>
          </motion.div>
        </motion.div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-primary" />
              LEARNING UNITS
            </h2>
          </div>
          <UnitsList units={units} />
          
          {units.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-10 text-center bg-card border-2 border-dashed border-border/60 rounded-[2rem] space-y-6"
            >
              <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <BookOpen className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-foreground">No Units Found</h3>
                <p className="text-muted-foreground font-bold max-w-xs mx-auto">
                  The curriculum is currently empty. Please wait for your teacher to release the first set of challenges.
                </p>
              </div>
              {profile?.role === "teacher" && (
                <Button 
                  variant="hero" 
                  onClick={() => router.push("/admin")}
                  className="font-black h-12 px-8 rounded-xl"
                >
                  Manage Content
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </motion.main>
    </div>
  );
}
