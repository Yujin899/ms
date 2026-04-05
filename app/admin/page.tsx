"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileJson, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users as UsersIcon,
  ShieldCheck,
  ShieldX,
  Globe
} from "lucide-react";
import { GlobalMasteryHeatmap } from "@/components/admin/GlobalMasteryHeatmap";
import { NuclearDeleteModal } from "@/components/admin/NuclearDeleteModal";
import { ProgressChart } from "@/components/home/ProgressChart";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  fetchUnits, 
  addUnit, 
  updateUnit, 
  deleteUnit, 
  addQuizToUnit, 
  bulkUploadQuestions,
  fetchAllUsers,
  updateUserVerification,
  fetchAllMistakes,
  UserProfile,
  Unit,
  MistakeRecord,
  Question
} from "@/services/db";
import { useAuth } from "@/context/auth-context";

type Tab = "overview" | "content" | "json" | "users" | "heatmap";

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  // Form States
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [quizTopic, setQuizTopic] = useState("vocabulary");
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [quizTimer, setQuizTimer] = useState("30");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<UserProfile | null>(null);
  const [jsonInput, setJsonInput] = useState("");

  const [state, setState] = useState<{
    selectedStudent: UserProfile | null;
  }>({
    selectedStudent: null
  });

  const { selectedStudent } = state;

  const loadAllData = useCallback(async () => {
    try {
      const [unitsData, usersData, mistakesData] = await Promise.all([
        fetchUnits(),
        fetchAllUsers(),
        fetchAllMistakes()
      ]);
      setUnits(unitsData);
      setUsers(usersData);
      setMistakes(mistakesData);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!profile || profile.role !== "teacher") {
        router.push("/");
      } else {
        loadAllData();
      }
    }
  }, [profile, authLoading, router, loadAllData]);

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleNuclearDelete = async (uid: string) => {
    try {
      const { nuclearDeleteUser } = await import("@/services/db");
      await nuclearDeleteUser(uid);
      await loadAllData();
      showStatus('success', 'User data purged successfully.');
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to purge user data.');
    }
  };

  const handleCreateUnit = async () => {
    const title = prompt("Enter Unit Title:");
    if (!title) return;
    try {
      await addUnit({ title, description: "", quizzes: [] });
      loadAllData();
      showStatus('success', 'Unit created!');
    } catch (err) {
      console.error(err);
      showStatus('error', 'Failed to create unit');
    }
  };


  const handleBulkUpload = async () => {
    if (!selectedUnitId || !quizTitle || !jsonInput) {
      showStatus('error', 'Please fill all fields');
      return;
    }

    try {
      const questions: Partial<Question>[] = JSON.parse(jsonInput);
      const quizId = await addQuizToUnit(selectedUnitId, {
        title: quizTitle,
        topic: quizTopic,
        timerSeconds: Number(quizTimer) || 30
      });
      await bulkUploadQuestions(quizId, questions as Question[]);
      
      setQuizTitle("");
      setJsonInput("");
      loadAllData();
      showStatus('success', `Quiz "${quizTitle}" uploaded with ${questions.length} questions!`);
    } catch (err) {
      console.error(err);
      showStatus('error', 'Invalid JSON or upload failed');
    }
  };

  const handleCopyTemplate = () => {
    const template = `[
  {
    "text": "The ______ of the Nile is essential for Egypt.",
    "options": ["flood", "flow", "water", "river"],
    "correctAnswer": "flood",
    "explanation": "Historically, the annual flooding (flood) of the Nile brought fertile soil.",
    "topic": "vocabulary"
  }
]`;
    setJsonInput(template);
    showStatus('success', 'Template copied to editor!');
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-black text-muted-foreground uppercase text-xs tracking-widest">Initialising Command Center</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-nunito">
      <header className="sticky top-0 z-40 w-full border-b-2 border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-6xl flex h-20 items-center px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-2xl bg-primary w-12 h-12 border-b-4 border-primary-shadow">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground leading-none">Command Center</h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Lync Admin Console</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
             <Button variant="ghost" onClick={() => router.push("/")} className="font-bold rounded-xl">Exit Console</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-10 space-y-10">
        <div className="max-w-4xl mx-auto space-y-10">
          <AnimatePresence>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-2xl border-2 border-b-4 font-bold flex items-center gap-3 ${
                  status.type === 'success' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {status.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Navigation */}
          <div className="flex p-1 bg-muted/30 rounded-2xl border-2 border-border/40 overflow-hidden overflow-x-auto no-scrollbar">
            {(["overview", "content", "json", "users", "heatmap"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                    : "text-muted-foreground hover:bg-white/50"
                }`}
              >
                {tab === "overview" && <LayoutDashboard className="w-4 h-4" />}
                {tab === "content" && <BookOpen className="w-4 h-4" />}
                {tab === "json" && <FileJson className="w-4 h-4" />}
                {tab === "users" && <UsersIcon className="w-4 h-4" />}
                {tab === "heatmap" && <Globe className="w-4 h-4" />}
                <span className="capitalize">{tab === "heatmap" ? "Heatmap" : tab}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="relative min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  {selectedStudent ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <ProgressChart userId={selectedStudent.uid} />
                      </div>
                      <Card className="border-2 border-b-4 border-border/60 shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-lg font-black">Student Info</CardTitle>
                          <Button variant="ghost" size="sm" onClick={() => setState(p => ({ ...p, selectedStudent: null }))} className="text-xs font-bold text-muted-foreground hover:text-destructive">
                            Deselect
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black">
                            {selectedStudent.name[0]}
                            </div>
                            <div>
                              <p className="font-black text-foreground">{selectedStudent.name}</p>
                              <p className="text-xs font-bold text-muted-foreground">{selectedStudent.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/40 rounded-xl text-center">
                              <p className="text-xs font-bold text-muted-foreground uppercase">Units</p>
                              <p className="text-2xl font-black text-foreground">{units.length}</p>
                            </div>
                            <div className="p-3 bg-muted/40 rounded-xl text-center">
                              <p className="text-xs font-bold text-muted-foreground uppercase">Mistakes</p>
                              <p className="text-2xl font-black text-destructive">{mistakes.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-card border-2 border-dashed border-border/60 rounded-[2rem] space-y-4">
                      <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                        <UsersIcon className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-foreground">Select a Student</h3>
                        <p className="text-muted-foreground font-bold max-w-xs mx-auto">
                          Go to the **Users** tab and select a student to see their individual progress and mistakes.
                        </p>
                      </div>
                      <Button variant="secondary" onClick={() => setActiveTab("users")} className="font-black h-12 px-8 rounded-xl border-b-4 border-black/10">
                        Go to Users
                      </Button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-xl font-extrabold text-foreground px-1 flex items-center gap-2">
                      {selectedStudent ? `${selectedStudent.name.split(' ')[0]}'s Mistakes` : "Latest Student Mistakes"}
                    </h3>
                    <div className="grid gap-4">
                      {mistakes.slice(0, 5).map((m, idx) => (
                        <div key={idx} className="bg-card border-2 border-b-4 border-border/60 rounded-2xl p-4 flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-2 rounded-lg bg-destructive/10 text-destructive text-xs font-bold uppercase ring-1 ring-destructive/20">
                              {m.topic}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground">
                              {m.timestamp?.toDate().toLocaleDateString() || "Recent"}
                            </span>
                          </div>
                          <p className="font-bold text-foreground">{m.text}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-destructive/5 text-destructive border border-destructive/20">
                              <XCircle className="w-4 h-4 shrink-0" />
                              <span className="text-sm font-bold">Student: {m.userAnswer}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-primary/5 text-primary border border-primary/20">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span className="text-sm font-bold font-primary">Correct: {m.correctAnswer}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {mistakes.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed border-border/40 font-bold">
                          No student mistakes recorded yet!
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "content" && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black">Manage Learning Path</h3>
                    <div className="flex gap-3">
                      <Button onClick={handleCreateUnit} variant="secondary" className="gap-2">
                        <Plus className="w-4 h-4" /> Add Unit
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {units.map((unit) => (
                      <div key={unit.id} className="group bg-card border-2 border-b-4 border-border/60 rounded-2xl overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b-2 border-border/20">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                              {unit.title.slice(0, 1)}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-lg text-foreground">{unit.title}</h4>
                              <p className="text-xs font-bold text-muted-foreground uppercase">{unit.quizzes.length} Quizzes</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted" onClick={() => updateUnit(unit.id, { title: prompt("New Title:", unit.title) || unit.title })}>
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => deleteUnit(unit.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/10 space-y-2">
                          {unit.quizzes.map((quiz) => (
                            <div key={quiz.id} className="flex items-center justify-between p-3 bg-white border-2 border-border/40 rounded-xl shadow-sm">
                              <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${quiz.topic === 'grammar' ? 'bg-secondary' : 'bg-primary'}`} />
                                <span className="font-bold text-sm">{quiz.title}</span>
                                <span className="text-[10px] uppercase font-black text-muted-foreground/60">{quiz.topic}</span>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => { setActiveTab('json'); setSelectedUnitId(unit.id); setQuizTitle(quiz.title); }}>
                                <FileJson className="w-4 h-4 mr-2" /> Questions
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "json" && (
                <motion.div
                  key="json"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-black">Create & Bulk Edit Quizzes</h3>
                    <p className="text-muted-foreground font-medium text-sm">
                      Choose a unit, name your quiz, and paste the question data below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-black uppercase text-muted-foreground px-1">1. Select Unit</label>
                          <select 
                            value={selectedUnitId}
                            onChange={(e) => setSelectedUnitId(e.target.value)}
                            className="w-full p-4 rounded-2xl border-2 border-b-4 border-border/60 bg-card font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          >
                            <option value="">Target Unit...</option>
                            {units.map(u => (
                              <option key={u.id} value={u.id}>{u.title}</option>
                            ))}
                          </select>
                        </div>

                         <div className="space-y-2">
                          <label className="text-sm font-black uppercase text-muted-foreground px-1">2. Quiz Topic</label>
                          <div className="flex flex-wrap gap-2 min-h-[58px]">
                            {['vocabulary', 'grammar', 'both', 'custom'].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  if (t === 'custom') {
                                    setIsCustomTopic(true);
                                    setQuizTopic("");
                                  } else {
                                    setIsCustomTopic(false);
                                    setQuizTopic(t);
                                  }
                                }}
                                className={`flex-1 min-w-[80px] rounded-xl border-2 border-b-4 font-bold capitalize transition-all ${
                                  (isCustomTopic && t === 'custom') || (!isCustomTopic && quizTopic === t)
                                    ? "bg-primary border-primary-shadow text-white translate-y-[2px]" 
                                    : "border-border/60 bg-card text-muted-foreground hover:border-border"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                          {isCustomTopic && (
                            <motion.input
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              type="text"
                              placeholder="Enter custom topic..."
                              value={quizTopic}
                              onChange={(e) => setQuizTopic(e.target.value)}
                              className="w-full mt-2 p-3 rounded-xl border-2 border-b-4 border-border/60 bg-card font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-black uppercase text-muted-foreground px-1">3. Quiz Title</label>
                          <input 
                            type="text"
                            value={quizTitle}
                            onChange={(e) => setQuizTitle(e.target.value)}
                            placeholder="e.g. Present Continuous Practice"
                            className="w-full p-4 rounded-2xl border-2 border-b-4 border-border/60 bg-card font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-black uppercase text-muted-foreground px-1">4. Per-Question Timer (Seconds)</label>
                          <div className="relative">
                            <input 
                              type="number"
                              value={quizTimer}
                              onChange={(e) => setQuizTimer(e.target.value)}
                              min="5"
                              max="300"
                              placeholder="30"
                              className="w-full p-4 rounded-2xl border-2 border-b-4 border-border/60 bg-card font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all pr-12"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-sm">SEC</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-1 pt-2">
                          <label className="text-sm font-black uppercase text-muted-foreground">5. Question Data (JSON)</label>
                          <button 
                            onClick={handleCopyTemplate}
                            className="text-xs font-black text-primary hover:underline flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy Template
                          </button>
                        </div>
                        <textarea
                          value={jsonInput}
                          onChange={(e) => setJsonInput(e.target.value)}
                          placeholder='[{"text": "...", "options": [...], "correctAnswer": "..."}]'
                          className="w-full h-80 p-4 rounded-3xl border-2 border-b-4 border-border/60 bg-card font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner"
                        />
                      </div>

                      <Button 
                        onClick={handleBulkUpload} 
                        className="w-full h-14 text-lg font-black gap-2 mt-4"
                        disabled={!selectedStudent && (!selectedUnitId || !quizTitle || !jsonInput)}
                      >
                        <Save className="w-5 h-5" /> Save Quiz & Questions
                      </Button>
                    </div>

                    <div className="space-y-6">
                      <Card className="border-2 border-b-4 border-border/60 bg-muted/10 shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-black flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-primary" />
                            How to create
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="text-[11px] font-bold text-muted-foreground space-y-2">
                            <p>1. Select the Unit where this quiz belongs.</p>
                            <p>2. Give it a descriptive Title.</p>
                            <p>3. Choose the Topic type.</p>
                            <p>4. Paste your JSON array and hit Save!</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "users" && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black">User Management</h3>
                      <p className="text-muted-foreground font-bold text-sm">Verify students and teachers to grant access.</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {users.map((u) => (
                      <div key={u.uid} className="bg-card border-2 border-b-4 border-border/60 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white ${
                            u.role === 'teacher' ? 'bg-secondary' : 'bg-primary'
                          }`}>
                            {u.name.slice(0,1)}
                          </div>
                          <div>
                            <p className="font-extrabold text-foreground">{u.name} <span className="text-xs font-black uppercase text-muted-foreground ml-2">({u.role})</span></p>
                            <p className="text-xs font-bold text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {u.isVerified ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                              <ShieldCheck className="w-4 h-4" />
                              <span className="text-xs font-black uppercase">Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                              <ShieldX className="w-4 h-4" />
                              <span className="text-xs font-black uppercase">Pending</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            {u.role === 'student' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="font-bold border-2 rounded-xl"
                                onClick={() => {
                                  setState(prev => ({ ...prev, selectedStudent: u }));
                                  setActiveTab("overview");
                                }}
                              >
                                View Profile
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant={u.isVerified ? "ghost" : "secondary"}
                              className="font-bold rounded-xl"
                              onClick={async () => {
                                await updateUserVerification(u.uid, !u.isVerified);
                                loadAllData();
                                showStatus('success', `${u.name} ${u.isVerified ? 'unverified' : 'verified'}!`);
                              }}
                            >
                              {u.isVerified ? "Revoke" : "Verify"}
                            </Button>
                            <Button 
                               size="sm" 
                               variant="ghost"
                               className="font-bold rounded-xl text-destructive hover:bg-destructive/10"
                               onClick={() => {
                                 setSelectedUserForDelete(u);
                                 setIsDeleteModalOpen(true);
                               }}
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <div className="p-12 text-center text-muted-foreground font-bold bg-muted/10 rounded-3xl border-2 border-dashed border-border/40">
                        No users registered yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "heatmap" && (
                <motion.div
                  key="heatmap"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <GlobalMasteryHeatmap />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <NuclearDeleteModal 
          user={selectedUserForDelete}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleNuclearDelete}
        />
      </main>
    </div>
  );
}
