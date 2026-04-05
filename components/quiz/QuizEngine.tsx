"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { getQuizQuestions, Question, saveMistake, saveUserProgress, saveQuizCompletion, fetchUnits, AttemptEntry, fetchQuizCompletion } from "@/services/db";
import { useAuth } from "@/context/auth-context";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { playClickSound, playCorrectSound, playWrongSound } from "@/lib/audio";
import { motion } from "framer-motion";

interface QuizEngineProps {
  quizId: string;
  mode?: "preview";
}

export function QuizEngine({ quizId, mode }: QuizEngineProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // Default 30s
  const [attempts, setAttempts] = useState<AttemptEntry[]>([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [isReviewMode, setIsReviewMode] = useState(mode === "preview");
  const [pastAttempts, setPastAttempts] = useState<AttemptEntry[]>([]);

  useEffect(() => {
    async function load() {
      const [data, units] = await Promise.all([getQuizQuestions(quizId), fetchUnits()]);
      setQuestions(data);
      
      // Find the quiz in units to get its timerSeconds
      for (const unit of units) {
        const q = unit.quizzes.find(item => item.id === quizId);
        if (q?.timerSeconds) {
          setTimeLimit(q.timerSeconds);
          setTimeLeft(q.timerSeconds);
          break;
        }
      }

      // If in preview mode, fetch past completion
      if (mode === "preview" && profile?.uid) {
        const completion = await fetchQuizCompletion(profile.uid, quizId);
        if (completion) {
          setPastAttempts(completion.attemptHistory);
          setIsReviewMode(true);
          
          // Sync first question state if in review mode
          const firstPast = completion.attemptHistory.find(a => a.questionId === data[0]?.id);
          if (firstPast) {
            setSelectedOption(firstPast.selectedOption === "Timeout" ? null : firstPast.selectedOption);
            setIsSubmitted(true);
          }
        } else {
          // If no past completion, just start as normal quiz
          setIsReviewMode(false);
        }
      }
    }
    load();
  }, [quizId, mode, profile?.uid]);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedOption === currentQuestion?.correctAnswer;

  const handleTimeout = useCallback(() => {
    // Only proceed if not already submitted or in review mode
    if (isSubmitted || isFinished || !currentQuestion || isReviewMode) return;
    
    setIsSubmitted(true);
    playWrongSound();
    
    // Auto-save as mistake on timeout
    const uid = profile?.uid;
    if (uid) {
      saveMistake(uid, currentQuestion, selectedOption || "Timeout");
    }
    
    // Record as attempt
    setAttempts(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedOption: selectedOption || "Timeout",
      isCorrect: false,
      timeTaken: timeLimit
    }]);
  }, [isSubmitted, isFinished, profile?.uid, currentQuestion, selectedOption, timeLimit, isReviewMode]);

  // Per-question timer logic
  useEffect(() => {
    if (isFinished || isSubmitted || questions.length === 0) return;
    
    const interval = setInterval(() => {
      if (isReviewMode) {
        clearInterval(interval);
        return;
      }
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isFinished, isSubmitted, questions.length, handleTimeout, isReviewMode]);

  // Save progress when finished
  useEffect(() => {
    if (isFinished && questions.length > 0 && profile?.uid && !isReviewMode) {
      const topic = questions[0].topic || "vocabulary";
      saveUserProgress(profile.uid, topic, score);
      saveQuizCompletion(profile.uid, quizId, score, attempts);
    }
  }, [isFinished, questions, score, profile?.uid, quizId, attempts, isReviewMode]);

  if (questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-lg px-8">
          <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
          <div className="h-[200px] bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }

  // Progress starts from (1 / total) on the first question and increases as you move through
  const progressValue = ((currentIndex + 1) / questions.length) * 100;

  const handleSubmit = () => {
    if (!selectedOption || !currentQuestion) return;
    
    setIsSubmitted(true);
    const timeSpent = timeLimit - timeLeft;
    
    // Record attempt
    setAttempts(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedOption: selectedOption,
      isCorrect,
      timeTaken: timeSpent
    }]);
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
      playCorrectSound();
    } else {
      if (profile?.uid) {
        saveMistake(profile.uid, currentQuestion, selectedOption);
      }
      playWrongSound();
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    // SECURITY: Reset timer state FIRST to prevent leaks into next question
    setTimeLeft(timeLimit);
    
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      
      if (isReviewMode) {
        const past = pastAttempts.find(a => a.questionId === questions[nextIndex].id);
        setSelectedOption(past?.selectedOption === "Timeout" ? null : (past?.selectedOption || null));
        setIsSubmitted(true);
      } else {
        setIsSubmitted(false);
        setSelectedOption(null);
      }
    } else {
      setIsFinished(true); // Show results
    }
  };

  const handleRetake = () => {
    playClickSound();
    setIsReviewMode(false);
    setIsFinished(false);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setAttempts([]);
    setTimeLeft(timeLimit);
  };

  // --- RESULTS VIEW ---
  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    const totalSeconds = attempts.reduce((acc, curr) => acc + curr.timeTaken, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="max-w-lg w-full text-center space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">Quiz Complete!</h1>
            <p className="text-lg sm:text-xl font-medium text-muted-foreground">
              You scored {score} out of {questions.length} in {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
          </div>
          
          <div className="flex items-center justify-center my-6 sm:my-8 shrink-0">
            <div className="relative flex items-center justify-center h-40 w-40 sm:h-48 sm:w-48 rounded-full border-[6px] sm:border-8 border-muted/50">
               <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                 <circle
                   cx="50%"
                   cy="50%"
                   r="46%"
                   className={`fill-none stroke-primary transition-all duration-1000 ease-in-out`}
                   strokeWidth="8%"
                   strokeDasharray="289"
                   strokeDashoffset={289 - (289 * percentage) / 100}
                   strokeLinecap="round"
                 />
               </svg>
               <span className="text-4xl sm:text-5xl font-black text-primary">{percentage}%</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 pt-4 sm:pt-8 w-full">
            {isReviewMode ? (
              <Button size="lg" className="w-full text-base sm:text-lg h-12 sm:h-14 shrink-0 transition-all shadow-xl shadow-primary/20" onClick={handleRetake}>
                Retake Quiz
              </Button>
            ) : (
              <>
                <Button size="lg" variant="secondary" className="w-full text-base sm:text-lg h-12 sm:h-14 shrink-0 transition-all" onClick={() => router.push("/mistakes")}>
                  Review Mistakes
                </Button>
                <Button size="lg" className="w-full text-base sm:text-lg h-12 sm:h-14 shrink-0" onClick={() => router.push("/")}>
                  Continue Learning
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- QUIZ VIEW ---
  return (
    <div className="min-h-screen bg-background flex flex-col font-nunito">
      {/* Interactive Question Timer - Static Blue -> Urgent Amber */}
      <div className="fixed top-0 left-0 right-0 z-60 h-2 bg-muted overflow-hidden">
        <motion.div 
          initial={false}
          animate={{ 
            width: `${(timeLeft / timeLimit) * 100}%`,
            backgroundColor: (timeLeft <= 15 || isReviewMode) ? (isReviewMode ? "var(--primary)" : "var(--warning)") : "var(--secondary)",
            opacity: timeLeft <= 10 && !isSubmitted && !isReviewMode ? [1, 0.6, 1] : 1
          }}
          transition={{ 
            width: { duration: 1, ease: "linear" },
            backgroundColor: { duration: 0.5 },
            opacity: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
          }}
          className="h-full shadow-[0_0_12px_rgba(var(--secondary-rgb),0.3)] relative"
        >
          {timeLeft <= 15 && !isSubmitted && (
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          )}
        </motion.div>
      </div>

      {/* Quiz Header & Progress */}
      <header className="p-4 sm:p-6 flex items-center gap-4 max-w-3xl mx-auto w-full mt-1.5">
        <button 
          onClick={() => {
            playClickSound();
            router.push("/");
          }}
          className="text-muted-foreground hover:text-foreground transition-colors p-2"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <Progress value={progressValue}>
            <ProgressTrack className="h-4 bg-muted/60 border-2 border-border/40 overflow-hidden rounded-full">
              <ProgressIndicator className="h-full bg-primary transition-all duration-500 ease-out border-b-4 border-primary-shadow/50 rounded-full" />
            </ProgressTrack>
          </Progress>
        </div>
        {isReviewMode && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetake}
            className="h-9 px-4 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-black uppercase tracking-tighter"
          >
            Retake
          </Button>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 pb-32">
        <div className="mb-8">
          <Badge 
            variant="outline" 
            className="mb-4 text-xs font-bold uppercase tracking-wider py-1 border-primary/20 bg-primary/10 text-primary"
          >
            {currentQuestion.topic}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {currentQuestion.text}
          </h2>
        </div>

        {/* Options */}
        <div className="grid gap-3">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            
            // Determine styles based on submission state
            let boxStyles = "border-border/60 hover:bg-muted/40 cursor-pointer text-foreground border-b-4 active:border-b-0 active:translate-y-[2px] focus-visible:ring-3 focus-visible:ring-secondary/50 focus-visible:outline-none";
            let indicator = null;

            if (isSubmitted) {
              boxStyles = "border-border/60 opacity-40 shadow-none cursor-default border-b-2 translate-y-[2px] focus-visible:ring-0"; // Default submitted state
              if (isCorrect) {
                boxStyles = "border-primary border-b-primary-shadow bg-primary/5 text-primary border-2 border-b-4 shadow-sm font-bold opacity-100 focus-visible:ring-primary/50";
                indicator = <CheckCircle2 className="w-6 h-6 text-primary" />;
              } else if (isSelected && !isCorrect) {
                // Use supportive Warning (Amber/Coral) instead of destructive Red
                boxStyles = "border-warning border-b-warning-shadow bg-warning/10 text-warning-shadow border-2 border-b-4 shadow-sm font-bold opacity-100 focus-visible:ring-warning/50";
                indicator = <XCircle className="w-6 h-6 text-warning" />;
              }
            } else if (isSelected) {
              boxStyles = "border-secondary border-b-secondary-shadow bg-secondary/10 border-2 border-b-4 font-bold shadow-sm -translate-y-[2px] focus-visible:ring-secondary/50";
            }

            return (
              <button
                key={option}
                type="button"
                disabled={isSubmitted || isReviewMode}
                onClick={() => {
                  if (isReviewMode) return;
                  playClickSound();
                  setSelectedOption(option);
                }}
                className={`w-full flex items-center justify-between pt-[14px] pb-[18px] sm:pt-[18px] sm:pb-[22px] px-4 sm:px-5 rounded-2xl border-2 transition-all ${boxStyles}`}
              >
                <span className="text-lg font-bold text-left -translate-y-px">{option}</span>
                <div className="-translate-y-px">{indicator}</div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer / Notification Bar */}
      {isSubmitted && (
        <div className={`fixed bottom-0 left-0 right-0 p-4 sm:p-6 border-t-4 font-semibold animate-in slide-in-from-bottom-full duration-300 ${timeLeft <= 0 || selectedOption !== currentQuestion.correctAnswer ? 'bg-warning/10 border-warning/20 text-warning-shadow' : 'bg-primary/5 border-primary/20 text-primary'}`}>
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-2 sm:p-3 rounded-2xl ${timeLeft <= 0 ? 'bg-warning text-white shadow-[0_4px_0_#d97706]' : selectedOption === currentQuestion.correctAnswer ? 'bg-primary text-white shadow-[0_4px_0_#46a302]' : 'bg-warning text-white shadow-[0_4px_0_#ff9600]'}`}>
                {timeLeft <= 0 ? (
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8"/>
                ) : selectedOption === currentQuestion.correctAnswer ? (
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8"/>
                ) : (
                  <XCircle className="w-6 h-6 sm:w-8 sm:h-8"/>
                )}
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black mb-0.5 sm:mb-1">
                  {isReviewMode 
                    ? (selectedOption === currentQuestion.correctAnswer ? "Correct Answer" : selectedOption === null ? "Time's Up (Missed)" : "Your Selection")
                    : (timeLeft <= 0 ? "Time's Up!" : selectedOption === currentQuestion.correctAnswer ? "Excellent!" : "Not quite!")
                  }
                </div>
                <p className="text-sm sm:text-base font-bold text-foreground/80 leading-relaxed font-arabic" dir="rtl">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {isReviewMode && currentIndex === questions.length - 1 && (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-12 sm:h-14 px-6 text-lg font-black rounded-2xl border-2"
                  onClick={handleRetake}
                >
                  RETAKE
                </Button>
              )}
              <Button 
                size="lg" 
                className={`h-12 sm:h-14 px-8 sm:px-12 text-lg sm:text-xl font-black rounded-2xl transition-all ${
                  (selectedOption === currentQuestion.correctAnswer && timeLeft > 0) || isReviewMode
                    ? 'bg-primary border-primary-shadow hover:bg-primary/90' 
                    : 'bg-warning border-warning-shadow hover:bg-warning/90'
                } text-white`}
                onClick={handleNext}
              >
                {isReviewMode && currentIndex === questions.length - 1 ? "FINISH" : "CONTINUE"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Only if not submitted) */}
      {!isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-background/80 backdrop-blur border-t-2 border-border/60">
          <div className="max-w-3xl mx-auto flex justify-end">
            <Button
              size="lg"
              disabled={!selectedOption}
              onClick={handleSubmit}
              className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg"
            >
              Check Answer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
