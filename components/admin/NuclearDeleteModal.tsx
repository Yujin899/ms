"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { UserProfile } from "@/services/db";
import { playClickSound } from "@/lib/audio";

interface NuclearDeleteModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (uid: string) => Promise<void>;
}

export function NuclearDeleteModal({ user, isOpen, onClose, onConfirm }: NuclearDeleteModalProps) {
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setConfirmName("");
      setHoldProgress(0);
      setIsHolding(false);
      setIsDeleting(false);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen]);

  const nameMatches = confirmName.trim().toLowerCase() === user?.name.toLowerCase();

  const handleStartHold = () => {
    if (!nameMatches || isDeleting) {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      return;
    }

    setIsHolding(true);
    const startTime = Date.now();
    const duration = 3000;

    progressIntervalRef.current = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        handleConfirm();
      }
    }, 50);
  };

  const handleStopHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleConfirm = async () => {
    if (!user) return;
    setIsHolding(false);
    setIsDeleting(true);

    try {
      playClickSound();
      await onConfirm(user.uid);
      onClose();
    } catch (error) {
      console.error("Purge failed:", error);
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                x: shouldShake ? [0, -10, 10, -10, 10, 0] : 0
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-card w-full max-w-md rounded-[2.5rem] border-2 border-b-8 border-[#ff4b4b] shadow-2xl overflow-hidden shadow-[#ff4b4b]/10"
          >
            {/* Header */}
            <div className="p-8 bg-[#ff4b4b]/5 border-b-2 border-[#ff4b4b]/10 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#ff4b4b]/10 text-[#ff4b4b] flex items-center justify-center border-2 border-[#ff4b4b]/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-[#ff4b4b]">Nuclear Purge</h3>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">High Stakes Operation</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="p-4 bg-muted/30 rounded-2xl border-2 border-dashed border-border/40 text-center">
                <p className="text-sm font-medium text-muted-foreground">You are about to permanently destroy all data for:</p>
                <p className="text-xl font-black text-foreground mt-1">{user?.name}</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">
                  Type Student Name to Unlock
                </label>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={user?.name}
                  className="w-full p-4 rounded-xl border-2 border-b-4 border-border/40 bg-background font-bold focus:outline-none focus:ring-2 focus:ring-[#ff4b4b] transition-all"
                />
              </div>

              <div className="relative pt-4">
                <button
                  onMouseDown={handleStartHold}
                  onMouseUp={handleStopHold}
                  onMouseLeave={handleStopHold}
                  onTouchStart={handleStartHold}
                  onTouchEnd={handleStopHold}
                  disabled={!nameMatches || isDeleting}
                  className={`
                    group relative w-full h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:translate-y-1 overflow-hidden
                    ${nameMatches && !isDeleting
                      ? "bg-[#ff4b4b] text-white border-b-4 border-[#d43f3f] shadow-lg shadow-[#ff4b4b]/20 cursor-pointer"
                      : "bg-muted text-muted-foreground border-b-4 border-border/40 cursor-not-allowed"
                    }
                  `}
                >
                  {isDeleting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      <span>{isHolding ? "HOLDING..." : "PURGE EVERYTHING"}</span>
                    </>
                  )}

                  {/* Progress Indicator */}
                  {isHolding && (
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all duration-75"
                      style={{ width: `${holdProgress}%` }}
                    />
                  )}
                </button>
                <p className="text-[10px] text-center font-black text-muted-foreground mt-3 tracking-widest uppercase">
                  Requires 3-Second Physical Intent
                </p>
              </div>
            </div>

            <footer className="px-8 pb-8 flex items-center justify-center">
              <button 
                onClick={onClose}
                className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors p-2 underline"
                disabled={isDeleting}
              >
                Cancel Operation
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
