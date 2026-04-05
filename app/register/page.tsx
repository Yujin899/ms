"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { UserCircle, GraduationCap, UserCheck, Mail, Lock, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/services/auth";
import { playClickSound } from "@/lib/audio";

export default function RegisterPage() {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakeFields, setShakeFields] = useState<string[]>([]);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    // Validation Shakes
    const missing: string[] = [];
    if (!name) missing.push("name");
    if (!email) missing.push("email");
    if (!password) missing.push("password");

    if (missing.length > 0) {
      setShakeFields(missing);
      setTimeout(() => setShakeFields([]), 500);
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await registerUser(email, password, name, role);
      router.push("/pending");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Registration failed. Try again.");
      setShakeFields(["name", "email", "password"]);
      setTimeout(() => setShakeFields([]), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card border-2 border-b-8 border-border/60 rounded-[2rem] p-8 space-y-8 shadow-xl"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl border-2 border-primary/20 mb-2">
            <UserPlus className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Join MS</h1>
          <p className="text-muted-foreground font-bold">Start your English journey today.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <label className="text-sm font-black uppercase text-muted-foreground px-1">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setRole("student");
                }}
                className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-b-6 transition-all ${
                  role === "student" 
                    ? "bg-primary border-primary-shadow text-white translate-y-[2px]" 
                    : "bg-white border-border/60 text-muted-foreground hover:border-border"
                }`}
              >
                <GraduationCap className="w-10 h-10" />
                <span className="font-black">Student</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setRole("teacher");
                }}
                className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-b-6 transition-all ${
                  role === "teacher" 
                    ? "bg-secondary border-secondary-shadow text-white translate-y-[2px]" 
                    : "bg-white border-border/60 text-muted-foreground hover:border-border"
                }`}
              >
                <UserCheck className="w-10 h-10" />
                <span className="font-black">Teacher</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <motion.div 
                animate={shakeFields.includes("name") ? { x: [-4, 4, -4, 4, 0] } : {}}
                className="relative group"
              >
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors z-10" />
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-b-4 border-border/60 bg-background font-bold outline-none focus:border-amber-500/50 focus:border-b-2 focus:translate-y-[2px] focus:bg-muted/30 focus:shadow-inner transition-all placeholder:text-muted-foreground/50"
                />
              </motion.div>
            </div>

            <div className="space-y-2">
              <motion.div 
                animate={shakeFields.includes("email") ? { x: [-4, 4, -4, 4, 0] } : {}}
                className="relative group"
              >
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors z-10" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-b-4 border-border/60 bg-background font-bold outline-none focus:border-amber-500/50 focus:border-b-2 focus:translate-y-[2px] focus:bg-muted/30 focus:shadow-inner transition-all placeholder:text-muted-foreground/50"
                />
              </motion.div>
            </div>

            <div className="space-y-2">
              <motion.div 
                animate={shakeFields.includes("password") ? { x: [-4, 4, -4, 4, 0] } : {}}
                className="relative group"
              >
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors z-10" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-b-4 border-border/60 bg-white font-bold outline-none focus:border-amber-500/50 focus:border-b-2 focus:translate-y-[2px] focus:bg-muted/30 focus:shadow-inner transition-all"
                />
              </motion.div>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ x: 0 }}
              animate={{ x: [-4, 4, -4, 4, 0] }}
              transition={{ duration: 0.4 }}
              className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 text-sm font-bold flex items-center gap-3 shadow-lg shadow-amber-500/5"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left">{error}</span>
            </motion.div>
          )}

          <Button 
            type="submit" 
            variant="hero"
            disabled={loading}
            className="w-full h-16 text-xl"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-center text-muted-foreground font-bold text-sm pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
