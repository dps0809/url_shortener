"use client";

import { cn } from "@/lib/utils";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  error?: string;
  label?: string;
}

export function GlassInput({ icon, error, label, className, ...props }: GlassInputProps) {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider font-inter">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        <input
          className={cn(
            "w-full bg-white/5 border-none focus:ring-1 focus:ring-primary/50 text-white placeholder-slate-500 rounded-lg transition-all duration-300",
            icon ? "pl-11 pr-4" : "px-4",
            "py-3.5 font-body",
            error && "focus:ring-red-500/50 bg-red-500/5",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-[10px] ml-1 font-semibold">{error}</p>}
    </div>
  );
}
