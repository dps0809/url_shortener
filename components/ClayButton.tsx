"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "blue" | "purple" | "glass";
  children: React.ReactNode;
}

export function ClayButton({ variant = "blue", children, className, ...props }: ClayButtonProps) {
  const baseClasses = "relative px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 overflow-hidden";
  
  const variants = {
    blue: "clay-button-blue text-white hover:brightness-110",
    purple: "clay-button-purple text-white hover:brightness-110",
    glass: "glass-card text-white hover:bg-white/10 transition-all",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={cn(baseClasses, variants[variant], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
