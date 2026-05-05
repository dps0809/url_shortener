"use client";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { ThemeToggle } from "./ThemeToggle";
import { Search, Bell, LogOut, User as UserIcon } from "lucide-react";

export function DashboardHeader() {
  const { user, logout } = useAuthStore();

  return (
    <header className="fixed top-0 right-0 left-64 h-20 z-40 bg-slate-950/50 backdrop-blur-3xl flex justify-between items-center px-10 w-[calc(100%-16rem)] border-b border-white/5 transition-all duration-500 group">
      {/* Search HUD */}
      <div className="flex-1 max-w-xl">
        <div className="relative group/search">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within/search:text-primary transition-all duration-300" />
          <input 
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-[13px] font-body text-white placeholder-slate-600 focus:ring-1 focus:ring-primary/30 transition-all outline-none focus:bg-white/[0.08] focus:border-white/10" 
            placeholder="Interrogate mission-critical link registry..." 
            type="text"
          />
          {/* Keyboard Shortcut Indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-40 group-focus-within/search:opacity-0 transition-opacity">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-black font-headline tracking-tighter text-slate-300 uppercase">CMD</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-black font-headline tracking-tighter text-slate-300 uppercase">K</kbd>
          </div>
        </div>
      </div>
      
      {/* Action Protocol Cluster */}
      <div className="flex items-center gap-8">
        <ThemeToggle />
        
        <div className="flex items-center gap-4 border-l border-white/5 pl-8">
          <button className="text-slate-500 hover:text-white transition-all transform hover:scale-110 relative group/btn">
            <Bell size={20} strokeWidth={2.5} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(37,109,240,0.8)]" />
          </button>
          
          <button className="text-slate-500 hover:text-red-400 transition-all transform hover:scale-110" onClick={logout}>
            <LogOut size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Identity Terminal */}
        <div className="flex items-center gap-4 group/user cursor-pointer">
          <div className="h-10 w-10 rounded-[1rem] bg-white/5 overflow-hidden border border-white/10 group-hover/user:border-primary/50 transition-all duration-500 shadow-2xl relative">
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/user:opacity-100 transition-opacity" />
            <img 
              alt="User avatar" 
              className="w-full h-full object-cover opacity-80 group-hover/user:opacity-100 transition-opacity"
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Guest'}&background=random`} 
            />
          </div>
        </div>
      </div>
    </header>
  );
}
