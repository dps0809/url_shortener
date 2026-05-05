"use client";

import { motion } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 lg:p-12 overflow-hidden">
      {/* Background Atmospheric Gradient Mesh */}
      <div className="fixed inset-0 z-[-1] bg-slate-950" />
      <div className="fixed inset-0 z-[-1] noise-overlay" />
      
      {/* Abstract Glow Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header / Logo Area */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center clay-button-blue shadow-lg">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-white tracking-tighter">ShortLink</h1>
        </div>
        <p className="text-slate-400 font-inter tracking-wide text-xs uppercase font-bold opacity-60">Premium SaaS Ecosystem</p>
      </motion.div>

      <main className="relative z-10 w-full max-w-6xl">
        {children}
      </main>

      {/* Decorative Bottom Mesh */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-black/50 pointer-events-none z-0" />
    </div>
  );
}
