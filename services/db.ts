// ... (imports remain same but cleaning unused)
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  collectionGroup,
  writeBatch,
  Timestamp,
  serverTimestamp,
  Firestore
} from "firebase/firestore";

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  completed: boolean;
  timerSeconds?: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string; // Dynamic
  quizId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: "student" | "teacher";
  isVerified: boolean;
  name: string;
}

export interface MistakeRecord extends Question {
  userId: string;
  userAnswer: string;
  timestamp?: Timestamp;
}

export interface AttemptEntry {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  timeTaken: number;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  quizzes: Quiz[];
}

export interface ProgressData {
  date: string;
  vocabulary: number;
  grammar: number;
}


// Helper to get non-null db or throw (should only be called in browser/admin)
function getDb(): Firestore {
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

// ---------------------------------------------------------------------
// STUDENT SERVICES (HOMEPAGE & QUIZ)
// ---------------------------------------------------------------------

export async function fetchUserProgress(userId: string): Promise<ProgressData[]> {
  try {
    const firestore = getDb();
    
    // Calculate the last 7 days dates in YYYY-MM-DD
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const q = query(
      collection(firestore, "users", userId, "progress"), 
      where("date", ">=", last7Days[0]),
      orderBy("date", "asc")
    );
    const snapshot = await getDocs(q);
    
    const dataMap = new Map(snapshot.docs.map(doc => [doc.data().date, doc.data() as ProgressData]));
    
    // Always return exactly 7 days to ensure Recharts draws a valid Area shape
    return last7Days.map(date => {
      return dataMap.get(date) || { date, vocabulary: 0, grammar: 0 };
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return [];
  }
}

export interface UserAnalytics {
  daily: ProgressData[];
  completed: (Quiz & { attemptHistory: AttemptEntry[], completedAt: Timestamp, score: number })[];
}

export interface GlobalQuestionStats {
  questionId: string;
  text: string;
  topic: string;
  unitTitle: string;
  totalAttempts: number;
  failureRate: number; // 0 to 1
  averageTimeTaken: number;
  distractors: Record<string, number>;
}

export async function fetchAllUserProgress(userId: string): Promise<UserAnalytics> {
  try {
    const firestore = getDb();
    
    // 1. Fetch daily progress points (for the chart)
    const progressQ = query(collection(firestore, "users", userId, "progress"));
    const progressSnap = await getDocs(progressQ);
    const progressDocs = progressSnap.docs.map(doc => doc.data() as ProgressData);

    // 2. Fetch all completed quizzes with attempt history
    const completedQ = query(collection(firestore, "users", userId, "completedQuizzes"), orderBy("completedAt", "desc"));
    const completedSnap = await getDocs(completedQ);
    const completedQuizzes = completedSnap.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id
      } as Quiz & { attemptHistory: AttemptEntry[], completedAt: Timestamp, score: number };
    });

    return {
      daily: progressDocs,
      completed: completedQuizzes
    };
  } catch (error) {
    console.error(`[DB Service] Failed to aggregate progress for user ${userId}:`, error);
    return { daily: [], completed: [] };
  }
}

export async function fetchUnits(userId?: string): Promise<Unit[]> {
  try {
    const firestore = getDb();
    
    // 1. Fetch all units
    const unitsSnapshot = await getDocs(collection(firestore, "units"));
    const units = unitsSnapshot.docs.map(doc => {
      const data = doc.data();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = data;
      return { ...rest, id: doc.id } as Unit;
    });

    // 2. If userId is provided, merge completion status
    if (userId) {
      const completedQuery = query(collection(firestore, "users", userId, "completedQuizzes"));
      const completedSnapshot = await getDocs(completedQuery);
      const completedIds = new Set(completedSnapshot.docs.map(doc => doc.id));
      
      return units.map(unit => ({
        ...unit,
        quizzes: (unit.quizzes || []).map(q => ({
          ...q,
          completed: completedIds.has(q.id)
        }))
      }));
    }

    return units;
  } catch (error) {
    console.error("Error fetching units:", error);
    return [];
  }
}

export async function saveQuizCompletion(userId: string, quizId: string, score: number, attempts: AttemptEntry[]) {
  try {
    const firestore = getDb();
    const completionRef = doc(firestore, "users", userId, "completedQuizzes", quizId);
    
    await setDoc(completionRef, {
      quizId,
      score,
      attemptHistory: attempts,
      completedAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving quiz completion:", error);
  }
}

export async function fetchQuizCompletion(userId: string, quizId: string) {
  try {
    const firestore = getDb();
    const completionRef = doc(firestore, "users", userId, "completedQuizzes", quizId);
    const snap = await getDoc(completionRef);
    if (snap.exists()) {
      return snap.data() as { 
        quizId: string; 
        score: number; 
        attemptHistory: AttemptEntry[]; 
        completedAt: Timestamp 
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching quiz completion:", error);
    return null;
  }
}

export async function getQuizQuestions(quizId: string): Promise<Question[]> {
  try {
    const firestore = getDb();
    const q = query(collection(firestore, "questions"), where("quizId", "==", quizId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = data;
      return { ...rest, id: doc.id } as Question;
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
}



export async function saveMistake(userId: string, question: Question, userAnswer: string) {
  try {
    const firestore = getDb();
    const mistakeData = {
      ...question,
      userId,
      userAnswer,
      timestamp: Timestamp.now()
    };
    // Use deterministic ID to prevent duplicate and allow easy resolution
    const mistakeRef = doc(firestore, "mistakes", `${userId}_${question.id}`);
    await setDoc(mistakeRef, mistakeData);
    
    // Keep local backup for speed
    const raw = localStorage.getItem("ms_mistakes_log");
    const mistakes: MistakeRecord[] = raw ? JSON.parse(raw) : [];
    const index = mistakes.findIndex((m) => m.id === question.id);
    if (index === -1) {
      mistakes.push(mistakeData as unknown as MistakeRecord);
    } else {
      mistakes[index] = mistakeData as unknown as MistakeRecord;
    }
    localStorage.setItem("ms_mistakes_log", JSON.stringify(mistakes));
  } catch (error) {
    console.error("Error saving mistake:", error);
  }
}

export async function resolveMistake(userId: string, questionId: string) {
  try {
    const firestore = getDb();
    const mistakeRef = doc(firestore, "mistakes", `${userId}_${questionId}`);
    await deleteDoc(mistakeRef);
    
    // Clear from local backup
    const raw = localStorage.getItem("ms_mistakes_log");
    if (raw) {
      const mistakes: MistakeRecord[] = JSON.parse(raw);
      const filtered = mistakes.filter((m) => m.id !== questionId);
      localStorage.setItem("ms_mistakes_log", JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Error resolving mistake:", error);
  }
}

export function getMistakes(): MistakeRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("ms_mistakes_log");
  return raw ? JSON.parse(raw) : [];
}

export async function fetchUserMistakes(userId: string): Promise<MistakeRecord[]> {
  try {
    const firestore = getDb();
    const q = query(
      collection(firestore, "mistakes"), 
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as MistakeRecord[];
  } catch (error) {
    console.error("Error fetching user mistakes:", error);
    return [];
  }
}

export async function fetchTotalMistakesCount(userId: string): Promise<number> {
  try {
    const firestore = getDb();
    const q = query(collection(firestore, "mistakes"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    
    // Count unique question IDs only
    const uniqueQuestionIds = new Set<string>();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.id) {
        uniqueQuestionIds.add(data.id);
      }
    });
    
    return uniqueQuestionIds.size;
  } catch (error) {
    console.error("Error fetching total mistakes count:", error);
    return 0;
  }
}

// ---------------------------------------------------------------------
// ADMIN SERVICES (DASHBOARD)
// ---------------------------------------------------------------------

export async function fetchAllMistakes(): Promise<MistakeRecord[]> {
  try {
    const firestore = getDb();
    const q = query(collection(firestore, "mistakes"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as MistakeRecord[];
  } catch (error) {
    console.error("Error fetching all mistakes:", error);
    return [];
  }
}

export async function fetchGlobalQuestionStats(): Promise<GlobalQuestionStats[]> {
  try {
    const firestore = getDb();
    
    // 1. Fetch all questions and units first (to mapping purposes)
    const [questionsSnap, units] = await Promise.all([
      getDocs(collection(firestore, "questions")),
      fetchUnits()
    ]);

    const unitMap = new Map();
    units.forEach(u => u.quizzes.forEach(q => unitMap.set(q.id, u.title)));

    const questionMap = new Map<string, Question>();
    questionsSnap.docs.forEach(doc => {
      const data = doc.data() as Question;
      questionMap.set(doc.id, { ...data, id: doc.id });
    });

    // 2. Fetch all student attempts from all users via collectionGroup
    const completionsSnap = await getDocs(collectionGroup(firestore, "completedQuizzes"));
    
    const stats: Record<string, {
      correct: number, 
      incorrect: number, 
      totalTime: number, 
      distractors: Record<string, number>
    }> = {};

    completionsSnap.docs.forEach(doc => {
      const history = (doc.data().attemptHistory || []) as AttemptEntry[];
      
      history.forEach(attempt => {
        if (!stats[attempt.questionId]) {
          stats[attempt.questionId] = { correct: 0, incorrect: 0, totalTime: 0, distractors: {} };
        }
        
        const s = stats[attempt.questionId];
        s.totalTime += attempt.timeTaken;
        
        if (attempt.isCorrect) {
          s.correct += 1;
        } else {
          s.incorrect += 1;
          const option = attempt.selectedOption;
          s.distractors[option] = (s.distractors[option] || 0) + 1;
        }
      });
    });

    // 3. Transform into final payload
    return Object.entries(stats).map(([qId, s]) => {
      const q = questionMap.get(qId);
      const total = s.correct + s.incorrect;
      
      return {
        questionId: qId,
        text: q?.text || "Unknown Question",
        topic: q?.topic || "Unknown",
        unitTitle: q?.quizId ? (unitMap.get(q.quizId) || "General") : "General",
        totalAttempts: total,
        failureRate: total > 0 ? (s.incorrect / total) : 0,
        averageTimeTaken: total > 0 ? (s.totalTime / total) : 0,
        distractors: s.distractors
      };
    });
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return [];
  }
}

export async function addUnit(unit: Omit<Unit, "id">) {
  const firestore = getDb();
  return await addDoc(collection(firestore, "units"), unit);
}

export async function updateUnit(id: string, unit: Partial<Unit>) {
  const firestore = getDb();
  const unitRef = doc(firestore, "units", id);
  return await updateDoc(unitRef, unit);
}

export async function deleteUnit(id: string) {
  const firestore = getDb();
  return await deleteDoc(doc(firestore, "units", id));
}

export async function addQuizToUnit(unitId: string, quizData: Omit<Quiz, "id" | "completed">) {
  const firestore = getDb();
  const unitRef = doc(firestore, "units", unitId);
  const quizId = `q-${Date.now()}`;
  const newQuiz: Quiz = { ...quizData, id: quizId, completed: false };
  
  const unitDoc = await getDoc(unitRef);
  if (!unitDoc.exists()) throw new Error("Unit not found");
  
  const currentQuizzes = (unitDoc.data() as Unit).quizzes || [];
  await updateDoc(unitRef, {
    quizzes: [...currentQuizzes, newQuiz]
  });

  return quizId;
}


export async function bulkUploadQuestions(quizId: string, questions: Question[]) {
  try {
    const firestore = getDb();
    // Delete existing questions for this quiz first
    const q = query(collection(firestore, "questions"), where("quizId", "==", quizId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(firestore, "questions", d.id)));
    await Promise.all(deletePromises);

    // Upload new ones
    const uploadPromises = questions.map(q => addDoc(collection(firestore, "questions"), {
      ...q,
      quizId
    }));
    await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Bulk upload failed:", error);
    throw error;
  }
}

export async function saveUserProgress(userId: string, topic: string, score: number) {
  try {
    const firestore = getDb();
    const today = new Date().toISOString().split('T')[0];
    const progressRef = doc(firestore, "users", userId, "progress", today);
    
    let currentData = { date: today, vocabulary: 0, grammar: 0 };
    const progDoc = await getDoc(progressRef);
    if (progDoc.exists()) {
      currentData = progDoc.data() as ProgressData;
    }
    
    if (topic === "vocabulary") {
      currentData.vocabulary += score;
    } else if (topic === "grammar") {
      currentData.grammar += score;
    } else if (topic === "both") {
      // Split points for a "both" quiz to avoid inflating the total
      const half = Math.floor(score / 2);
      currentData.vocabulary += half;
      currentData.grammar += (score - half);
    }
    
    await setDoc(progressRef, currentData);
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

export async function saveUserProfile(profile: UserProfile) {
  const firestore = getDb();
  return await setDoc(doc(firestore, "users", profile.uid), profile);
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = getDb();
  const userDoc = await getDoc(doc(firestore, "users", uid));
  return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  const firestore = getDb();
  const snapshot = await getDocs(collection(firestore, "users"));
  return snapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function updateUserVerification(uid: string, isVerified: boolean) {
  const firestore = getDb();
  return await updateDoc(doc(firestore, "users", uid), { isVerified });
}

export async function nuclearDeleteUser(uid: string): Promise<void> {
  try {
    const firestore = getDb();
    const batch = writeBatch(firestore);

    // 1. Delete Mistakes (Top-level collection)
    const mistakesQ = query(collection(firestore, "mistakes"), where("userId", "==", uid));
    const mistakesSnap = await getDocs(mistakesQ);
    mistakesSnap.forEach(d => batch.delete(d.ref));

    // 2. Delete Progress (Sub-collection)
    const progressSnap = await getDocs(collection(firestore, "users", uid, "progress"));
    progressSnap.forEach(d => batch.delete(d.ref));

    // 3. Delete Completed Quizzes (Sub-collection)
    const completedSnap = await getDocs(collection(firestore, "users", uid, "completedQuizzes"));
    completedSnap.forEach(d => batch.delete(d.ref));

    // 4. Delete Main Profile
    batch.delete(doc(firestore, "users", uid));

    await batch.commit();
    console.info(`Nuclear delete successful for user: ${uid}`);
  } catch (error) {
    console.error("Nuclear delete failed:", error);
    throw error;
  }
}





