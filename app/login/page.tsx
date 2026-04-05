"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginUser } from "@/services/auth";
import { playClickSound } from "@/lib/audio";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakeFields, setShakeFields] = useState<string[]>([]);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    
    // Validation Shakes
    const missing: string[] = [];
    if (!email) missing.push("email");
    if (!password) missing.push("password");
    
    if (missing.length > 0) {
      setShakeFields(missing);
      setTimeout(() => setShakeFields([]), 500);
      setError("Please enter your credentials.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await loginUser(email, password);
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      setError("Invalid email or password.");
      setShakeFields(["email", "password"]);
      setTimeout(() => setShakeFields([]), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-card border-2 border-b-8 border-border/60 rounded-[2rem] p-8 space-y-8 shadow-xl"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl border-2 border-primary/20 mb-2">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground font-bold">Sign in to continue learning.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-muted-foreground px-1 pl-2">Email</label>
              <motion.div 
                animate={shakeFields.includes("email") ? { x: [-4, 4, -4, 4, 0] } : {}}
                className="relative group"
              >
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors z-10" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-b-4 border-border/60 bg-background font-bold outline-none focus:border-amber-500/50 focus:border-b-2 focus:translate-y-[2px] focus:bg-muted/30 focus:shadow-inner transition-all placeholder:text-muted-foreground/50"
                />
              </motion.div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-muted-foreground px-1 pl-2">Password</label>
              <motion.div 
                animate={shakeFields.includes("password") ? { x: [-4, 4, -4, 4, 0] } : {}}
                className="relative group"
              >
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors z-10" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-b-4 border-border/60 bg-background font-bold outline-none focus:border-amber-500/50 focus:border-b-2 focus:translate-y-[2px] focus:bg-muted/30 focus:shadow-inner transition-all placeholder:text-muted-foreground/50"
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
              <span className="flex-1">{error}</span>
            </motion.div>
          )}

          <Button 
            type="submit" 
            variant="hero"
            disabled={loading}
            className="w-full h-16 text-xl"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <p className="text-center text-muted-foreground font-bold text-sm pt-2">
            New to MS?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
