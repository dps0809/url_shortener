"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-50 bg-white/5 dark:bg-slate-800/10 backdrop-blur-xl flex justify-between items-center px-8 border-b border-white/10">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center clay-button-blue scale-90 group-hover:scale-100 transition-transform">
            <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
          </div>
          <span className="font-headline font-extrabold text-white text-xl tracking-tighter">ShortLink</span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link 
          href={user ? "/dashboard" : "/login"} 
          className={cn(
            "text-sm font-bold font-headline transition-colors",
            pathname === "/dashboard" ? "text-white" : "text-slate-400 hover:text-white"
          )}
        >
          Dashboard
        </Link>
        <Link href="#features" className="text-slate-400 hover:text-white transition-all text-sm font-headline">Features</Link>
        <Link href="#pricing" className="text-slate-400 hover:text-white transition-all text-sm font-headline">Pricing</Link>
        <Link href="#api" className="text-slate-400 hover:text-white transition-all text-sm font-headline">API</Link>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-primary/50 transition-colors">
                <img 
                  src={user.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuB_0OoQ9nsL8mhgQV6WypKJHgZRDPAEeOE8nmTIqi8qKWYxR6qKDtktyBJMQZtL6y7uItYphyJxy4nn-uyPWT-L3DMcCUxVSeDpfR-oEJAKSXl4D_4UGPMW3y0iA-Tz_ysC2aO6kUX7EUzj3doA217J9kkPDSuMfvfJurQVt6uxlAacdFkXwdn4etIOdbJyS7CSM1NgPpZ4nY05-4cGoqIkaPiE-UWoTB8-_fgO6ZifevSmfbxDs03vMsla3AMonAP7IM_ShYltW4g"} 
                  alt="User avatar" 
                />
              </div>
            </Link>
            <button 
              onClick={logout}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        ) : (
          !isAuthPage && (
            <Link href="/login">
              <button className="clay-button-blue text-white px-5 py-2 rounded-lg font-bold text-sm">
                Login
              </button>
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
