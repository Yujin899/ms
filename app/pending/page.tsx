"use client";

import { motion } from "framer-motion";
import { Clock, ShieldAlert, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/services/auth";

export default function PendingPage() {

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-card border-4 border-b-12 border-border/80 rounded-[3rem] p-12 text-center space-y-10 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full -ml-12 -mb-12" />

        <div className="space-y-6 relative z-10">
          <div className="flex justify-center relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center"
            >
              <Clock className="w-12 h-12 text-primary" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -bottom-2 -right-2 bg-secondary text-white p-2 rounded-xl shadow-lg border-2 border-white"
            >
              <ShieldAlert className="w-5 h-5" />
            </motion.div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Awaiting Approval
            </h1>
            <p className="text-xl font-bold text-muted-foreground max-w-sm mx-auto">
              Your account is currenty pending verification by the teacher.
            </p>
          </div>

          <div className="p-6 bg-muted/40 rounded-3xl border-2 border-border/40 text-left space-y-3">
            <p className="text-sm font-black uppercase text-muted-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary fill-primary" /> What happens next?
            </p>
            <p className="text-sm font-bold text-foreground/80 leading-relaxed">
              To keep our learning community safe, every student needs to be manually verified by the admin. Once approved, you&apos;ll get full access to all units and quizzes!
            </p>
          </div>
        </div>

        <div className="pt-4 relative z-10">
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="w-full h-14 text-lg font-black gap-3 border-b-4 border-black/20 active:border-b-0 active:translate-y-[2px] shadow-sm transition-all rounded-2xl"
          >
            <LogOut className="w-5 h-5 transition-transform" />
            Sign Out
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
