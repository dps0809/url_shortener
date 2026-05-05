"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { ClayButton } from "@/components/ClayButton";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Intelligence", href: "/dashboard/analytics", icon: "monitoring" },
  { name: "Link Ecosystem", href: "/dashboard/links", icon: "link" },
  { name: "Bulk Deployment", href: "/dashboard/upload", icon: "upload" },
  { name: "Identity Profile", href: "/dashboard/profile", icon: "person" },
  { name: "System Settings", href: "/dashboard/settings", icon: "settings" },
  { name: "Pricing Tiers", href: "/pricing", icon: "payments" },
  { name: "Control Center", href: "/admin", icon: "admin_panel_settings", adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <aside className="h-full w-64 fixed left-0 top-0 bg-slate-950 flex flex-col p-6 z-50 shadow-2xl border-r border-white/5">
      <div className="mb-10 px-2">
        <Link href="/" className="flex flex-col">
          <h1 className="text-2xl font-black text-white tracking-tighter font-headline uppercase italic">ShortLink</h1>
          <p className="text-slate-500 text-[10px] font-bold tracking-[0.2em] mt-1 uppercase">Premium Ecosystem</p>
        </Link>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== "admin") return null;
          
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-headline font-bold text-[13px] uppercase tracking-tight",
                isActive 
                  ? "text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/5" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className={cn(
                "material-symbols-outlined transition-all duration-300 text-lg",
                isActive && "scale-110",
                isActive ? "text-primary" : "text-slate-500 opacity-60"
              )} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className={cn(
                "tracking-tighter",
                isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
              )}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
               <img 
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'Guest'}&background=random`} 
                alt="User profile" 
                className="w-full h-full object-cover opacity-80"
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-black truncate tracking-tight font-headline italic uppercase">{user?.name || "Anonymous"}</p>
              <p className="text-slate-500 text-[9px] truncate uppercase font-bold tracking-[0.1em] mt-0.5">{user?.role === 'admin' ? 'Root Authority' : 'Tier 1 Member'}</p>
            </div>
          </div>
          <Link href="/pricing" className="relative z-10 block">
            <ClayButton variant="blue" className="w-full py-2.5 text-[9px] font-black font-headline tracking-[0.2em] uppercase">
              Scale Up
            </ClayButton>
          </Link>
          {/* Subtle ambient glow in sidebar card */}
          <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </aside>
  );
}
