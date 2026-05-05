"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ClayButton } from "@/components/ClayButton";
import { GlassInput } from "@/components/GlassInput";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  // Mock data for profile stats as per Stitch "Ethereal" design
  const stats = [
    { label: "Links Deployed", value: "1,204", icon: "link", color: "text-primary" },
    { label: "Total Engagement", value: "84.2K", icon: "trending_up", color: "text-emerald-400" },
    { label: "System Authority", value: "Pro", icon: "verified", color: "text-amber-400" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Profile Header Block */}
      <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center">
        <motion.div {...fadeInUp} className="relative group">
          <div className="w-32 h-32 rounded-3xl bg-white/5 border-2 border-white/10 overflow-hidden shadow-2xl relative">
            <img 
              src={user?.avatar || "https://ui-avatars.com/api/?name=" + (user?.name || "User") + "&background=random"} 
              alt="Profile Identity" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <span className="material-symbols-outlined text-white">photo_camera</span>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-950 flex items-center justify-center shadow-lg">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </motion.div>

        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="flex-1 space-y-3">
          <div className="flex items-center gap-4">
             <h1 className="text-5xl font-black font-headline text-white tracking-tighter uppercase italic truncate">
               {user?.name || "Mission Identity"}
             </h1>
             <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(37,109,240,0.15)]">
               Pro Active
             </div>
          </div>
          <p className="text-xl font-medium text-slate-400 font-body">
            Level 4 Redirect Specialist • Member since Oct 2023
          </p>
          <div className="flex gap-4 pt-4">
             <ClayButton variant="blue" className="px-6 py-4 rounded-xl text-xs tracking-widest uppercase font-black">
               Edit Credentials
             </ClayButton>
             <ClayButton variant="glass" className="px-6 py-4 rounded-xl text-xs tracking-widest uppercase font-black">
               Export Intelligence
             </ClayButton>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div key={i} {...fadeInUp} transition={{ delay: 0.2 + (i * 0.1) }}>
            <GlassCard className="p-8 flex items-center gap-6 group hover:bg-white/5 transition-all border-white/5">
              <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${stat.color} group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{stat.label}</p>
                 <p className="text-3xl font-black text-white italic font-headline tracking-tighter">{stat.value}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div {...fadeInUp} transition={{ delay: 0.5 }}>
          <GlassCard className="p-10 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black font-headline text-white italic uppercase tracking-tight">Identity Details</h3>
              <span className="material-symbols-outlined text-slate-600">verified_user</span>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Secure Username</label>
                 <GlassInput value={user?.username || "root"} readOnly icon="person" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Email Authority</label>
                 <GlassInput value={user?.email || "internal@system.sh"} readOnly icon="alternate_email" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Assigned Role</label>
                 <div className="flex items-center h-14 w-full bg-white/3 border border-white/5 rounded-2xl px-5 text-slate-400 font-medium">
                   {user?.role === 'admin' ? 'System Administrator' : 'Standard Operative'}
                 </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div {...fadeInUp} transition={{ delay: 0.6 }}>
          <GlassCard className="p-10 space-y-8 h-full bg-primary/3 border-primary/10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black font-headline text-white italic uppercase tracking-tight">System Authority</h3>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(37,109,240,0.3)]">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
            </div>
            
            <p className="text-slate-400 font-body text-lg leading-relaxed pt-2">
              Your account currently holds **Pro-Active** clearance. You have unrestricted access to mission-critical redirects, bulk operations, and high-fidelity intelligence reports.
            </p>

            <div className="space-y-4 pt-10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">ACTIVE DIRECTIVES</p>
              <ul className="space-y-4">
                 {[
                   'Priority background malware neutralization',
                   'Instant QR generation for all deployments',
                   'Infinite retention of engagement metadata',
                   'Tier 1 technical support gateway'
                 ].map((t, i) => (
                   <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300">
                     <span className="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                     {t}
                   </li>
                 ))}
              </ul>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
