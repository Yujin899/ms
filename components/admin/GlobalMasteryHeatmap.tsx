"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GlobalQuestionStats, 
  fetchGlobalQuestionStats, 
  UserProfile, 
  Unit, 
  fetchQuizCompletion, 
  getQuizQuestions, 
  Question, 
  AttemptEntry 
} from "@/services/db";
import { Mastery3DCard } from "./Mastery3DCard";
import { DistractorPopup } from "./DistractorPopup";
import { Loader2, AlertCircle, Brain, Zap, Clock, Target, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  selectedStudent: UserProfile | null;
  units: Unit[];
}

export function GlobalMasteryHeatmap({ selectedStudent, units }: Props) {
  const [globalStats, setGlobalStats] = useState<GlobalQuestionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStats, setSelectedStats] = useState<GlobalQuestionStats | null>(null);
  
  // Student Specific State
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [studentQuizData, setStudentQuizData] = useState<{
    questions: Question[],
    attempts: AttemptEntry[]
  } | null>(null);
  const [fetchingStudent, setFetchingStudent] = useState(false);

  // 1. Initial Load of Global Data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchGlobalQuestionStats();
        setGlobalStats(data);
      } catch (err) {
        console.error("Global stats fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 2. Fetch Student Quiz Data when quiz is selected
  useEffect(() => {
    async function loadStudentData() {
      if (!selectedStudent || !selectedQuizId) {
        setStudentQuizData(null);
        return;
      }
      
      setFetchingStudent(true);
      try {
        const [completion, questions] = await Promise.all([
          fetchQuizCompletion(selectedStudent.uid, selectedQuizId),
          getQuizQuestions(selectedQuizId)
        ]);
        
        if (completion && questions.length > 0) {
          setStudentQuizData({
            questions,
            attempts: completion.attemptHistory
          });
        } else {
          setStudentQuizData(null);
        }
      } catch (err) {
        console.error("Student quiz fetch failed", err);
        setStudentQuizData(null);
      } finally {
        setFetchingStudent(false);
      }
    }
    loadStudentData();
  }, [selectedStudent, selectedQuizId]);

  // 3. Reset quiz selection if student changes
  useEffect(() => {
    setSelectedQuizId(null);
  }, [selectedStudent?.uid]);

  // --- GLOBAL VIEW HELPERS ---
  const groupedGlobalStats = useMemo(() => {
    const groups: Record<string, GlobalQuestionStats[]> = {};
    globalStats.forEach(s => {
      if (!groups[s.unitTitle]) groups[s.unitTitle] = [];
      groups[s.unitTitle].push(s);
    });
    return groups;
  }, [globalStats]);

  // --- STUDENT VIEW HELPERS (QUADRANTS) ---
  const quadrants = useMemo(() => {
    if (!studentQuizData) return null;
    
    // Performance Threshold (1/3 of typical 30s timer = 10s)
    const SPEED_THRESHOLD = 10;

    const sections = {
      speedsters: [] as (Question & { attempt: AttemptEntry })[],
      deepThinkers: [] as (Question & { attempt: AttemptEntry })[],
      impulsive: [] as (Question & { attempt: AttemptEntry })[],
      struggling: [] as (Question & { attempt: AttemptEntry })[],
    };

    studentQuizData.attempts.forEach(attempt => {
      const q = studentQuizData.questions.find(quest => quest.id === attempt.questionId);
      if (!q) return;

      const item = { ...q, attempt };

      if (attempt.isCorrect) {
        if (attempt.timeTaken < SPEED_THRESHOLD) {
          sections.speedsters.push(item);
        } else {
          sections.deepThinkers.push(item);
        }
      } else {
        if (attempt.timeTaken < SPEED_THRESHOLD) {
          sections.impulsive.push(item);
        } else {
          sections.struggling.push(item);
        }
      }
    });

    return sections;
  }, [studentQuizData]);

  // --- RENDERING ---

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-black uppercase text-xs tracking-widest text-center px-4">Aggregating Mastery Data...</p>
      </div>
    );
  }

  // A. STUDENT DIAGNOSTIC VIEW
  if (selectedStudent) {
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-8 bg-primary/5 rounded-[3rem] border-2 border-primary/20 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg uppercase">
              {selectedStudent.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="text-2xl font-black text-foreground">Diagnostic Explorer</h3>
              </div>
              <p className="text-muted-foreground font-bold leading-relaxed">
                Analyzing cognitive profiles for <span className="text-primary">{selectedStudent.name}</span>.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 min-w-[200px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Practice Set</label>
            <select 
              value={selectedQuizId || ""}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="p-3 px-4 rounded-2xl border-2 border-b-4 border-primary/20 bg-background font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Choose Quiz...</option>
              {units.map(u => (
                <optgroup key={u.id} label={u.title}>
                  {u.quizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {!selectedQuizId ? (
          <div className="p-20 text-center bg-muted/20 rounded-[3rem] border-2 border-dashed border-border/40 space-y-4">
             <div className="w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Target className="w-8 h-8" />
             </div>
             <p className="font-bold text-muted-foreground">Select a quiz above to reveal {selectedStudent.name.split(' ')[0]}&apos;s performance profile.</p>
          </div>
        ) : fetchingStudent ? (
           <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Deconstructing History...</p>
           </div>
        ) : !quadrants ? (
           <div className="p-16 text-center bg-destructive/5 rounded-[3rem] border-2 border-destructive/20 space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <p className="font-bold text-destructive">No attempt history found for this student on this specific quiz.</p>
              <Button variant="outline" onClick={() => setSelectedQuizId(null)} className="rounded-xl border-2">Select another</Button>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QuadrantGroup 
              title="Speedsters" 
              subtitle="Quick & Correct" 
              icon={<Zap className="w-5 h-5 text-emerald-600" />} 
              items={quadrants.speedsters}
              color="emerald"
            />
            <QuadrantGroup 
              title="Deep Thinkers" 
              subtitle="Concentrated Mastery" 
              icon={<Brain className="w-5 h-5 text-blue-600" />} 
              items={quadrants.deepThinkers}
              color="blue"
            />
            <QuadrantGroup 
              title="Impulsive" 
              subtitle="Fast but Careless" 
              icon={<XCircle className="w-5 h-5 text-amber-600" />} 
              items={quadrants.impulsive}
              color="amber"
            />
            <QuadrantGroup 
              title="Struggling" 
              subtitle="High Cognitive Load" 
              icon={<Clock className="w-5 h-5 text-rose-600" />} 
              items={quadrants.struggling}
              color="rose"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="p-6 bg-amber-500/5 rounded-[2.5rem] border-2 border-b-6 border-amber-500/10 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Target className="w-5 h-5 text-amber-600" />
             <h3 className="text-xl font-black text-amber-900">Global Curriculum Heatmap</h3>
          </div>
          <p className="text-sm font-bold text-amber-600/70 max-w-2xl leading-relaxed">
            Visualizing collective performance across all students.
            Cards turn **Red** when the failure rate exceeds 50%. 
            Heavy **bottom borders** indicate longer average response cycles.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {Object.entries(groupedGlobalStats).map(([unit, unitStats], uIdx) => (
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
               <span className="text-xs font-black uppercase text-muted-foreground tracking-widest shrink-0">
                {unitStats.length} Question Nodes
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

function QuadrantGroup({ title, subtitle, icon, items, color }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: (Question & { attempt: AttemptEntry })[];
  color: "emerald" | "blue" | "amber" | "rose";
}) {
  const colorMap = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-700",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-700",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-700",
  };

  const bgStyle = colorMap[color].split(' ')[0];
  const borderStyle = colorMap[color].split(' ')[1];
  const titleStyle = colorMap[color].split(' ')[2];

  return (
    <div className={`p-6 rounded-[2.5rem] border-2 border-b-6 flex flex-col h-full ${bgStyle} ${borderStyle}`}>
      <div className="flex items-center justify-between mb-4 px-2">
         <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-card shadow-sm border border-border/20">
               {icon}
            </div>
            <div>
               <h4 className={`text-lg font-black leading-none mb-1 ${titleStyle}`}>{title}</h4>
               <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60 text-foreground">{subtitle}</p>
            </div>
         </div>
         <div className={`text-xl font-black ${titleStyle} opacity-40`}>
            {items.length}
         </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-2 customized-scroll">
         {items.map((item, idx) => (
           <div key={idx} className="bg-card/80 backdrop-blur-sm p-4 rounded-2xl border border-border/40 shadow-sm space-y-2">
              <p className="text-sm font-bold text-foreground leading-snug">{item.text}</p>
              <div className="flex flex-wrap gap-2 items-center text-[10px] font-black uppercase">
                 <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.attempt.timeTaken}s
                 </span>
                 {item.attempt.isCorrect ? (
                    <span className="text-primary flex items-center gap-1">
                       <CheckCircle2 className="w-3 h-3" /> Correct
                    </span>
                 ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                       <XCircle className="w-3 h-3" /> Wrong: {item.attempt.selectedOption}
                    </span>
                 )}
              </div>
           </div>
         ))}
         {items.length === 0 && (
           <div className="flex items-center justify-center h-32 text-[10px] font-black uppercase text-muted-foreground opacity-40">
             Void Space
           </div>
         )}
      </div>
    </div>
  );
}
