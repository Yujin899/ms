"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background Ambiance - Glowing Light Trails */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-warning/5 rounded-full blur-[120px] animate-pulse duration-5000" />
      </div>

      <div className="container max-w-lg mx-auto flex flex-col items-center gap-10 px-6 relative z-10">
        {/* 3D MS Logo Animation */}
        <div className="relative group">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotateY: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] bg-primary border-b-8 border-primary-shadow shadow-2xl shadow-primary/40 text-white font-black text-5xl sm:text-6xl select-none"
          >
            MS
          </motion.div>
          {/* Supportive Amber Glow */}
          <div className="absolute -inset-4 bg-warning/20 rounded-full blur-2xl -z-10 animate-pulse" />
        </div>

        {/* Localized Copy */}
        <div className="text-center space-y-4 max-w-sm">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-black text-foreground leading-tight px-4"
          >
            <span className="text-primary tracking-tighter">Loading Dashboard...</span>
            <br />
            <span className="text-warning-shadow/80 text-xl sm:text-2xl">Get Ready for Fun!</span>
          </motion.h2>
          <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest animate-pulse">
            Loading Data...
          </p>
        </div>

        {/* Segment-based Progressive Bar */}
        <div className="w-full max-w-[280px] space-y-3">
          <div className="flex gap-1.5 h-3">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.1, scale: 0.8 }}
                animate={{ 
                  opacity: [0.1, 1, 0.1],
                  scale: [0.8, 1.1, 0.8]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
                className="flex-1 rounded-sm bg-primary border-b-2 border-primary-shadow/60"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tactile Textures/Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
    </div>
  );
}
