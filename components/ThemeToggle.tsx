"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-10 h-10" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 group overflow-hidden"
      aria-label="Toggle mission atmosphere"
    >
      <AnimatePresence mode="wait">
        {theme === "dark" ? (
          <motion.span
            key="dark"
            initial={{ y: 20, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="material-symbols-outlined text-[20px] text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          >
            dark_mode
          </motion.span>
        ) : (
          <motion.span
            key="light"
            initial={{ y: 20, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="material-symbols-outlined text-[20px] text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          >
            light_mode
          </motion.span>
        )}
      </AnimatePresence>

      {/* Hover Particle Effect */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 bg-primary/5 pointer-events-none"
      />
    </button>
  );
}
