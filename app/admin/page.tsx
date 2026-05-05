"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ClayButton } from "@/components/ClayButton";
import { GlassInput } from "@/components/GlassInput";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Sidebar } from "@/components/Sidebar";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
  avatar?: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<User[]>("/admin/users");
      
      // Mock fallback as per "mock them for now"
      setUsers(response.data || [
        { id: '1', name: 'Divyaksh', email: 'divyaksh@system.sh', role: 'admin', created_at: '2023-10-01T00:00:00Z' },
        { id: '2', name: 'Sarah Connor', email: 'sarah@resistance.net', role: 'user', created_at: '2023-10-05T00:00:00Z' },
        { id: '3', name: 'Neo Anderson', email: 'neo@matrix.io', role: 'user', created_at: '2023-10-08T00:00:00Z' },
        { id: '4', name: 'Ellen Ripley', email: 'ripley@weyland.corp', role: 'admin', created_at: '2023-10-12T00:00:00Z' },
      ]);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (error) {
      // Local state update for mock mode
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <motion.div {...fadeInUp} className="space-y-1">
          <h1 className="text-4xl font-black font-headline text-white tracking-tighter uppercase italic">
            Control <span className="opacity-40">Center</span>
          </h1>
          <p className="text-lg font-medium text-slate-400 font-body">
            System-wide management & mission-critical monitoring.
          </p>
        </motion.div>
        
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="flex items-center gap-4">
          <StatsMini label="CPU" value="12%" icon="memory" />
          <StatsMini label="Uptime" value="99.9%" icon="history" />
        </motion.div>
      </div>

      {/* Admin Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
            <AdminStatsCard 
              label="Total Ecosystem Users" 
              value={users.length.toString()} 
              icon="groups" 
              color="text-primary"
            />
          </motion.div>
          <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
            <AdminStatsCard 
              label="Threats Neutralized" 
              value="412" 
              icon="shield_with_heart" 
              color="text-red-500"
            />
          </motion.div>
        </div>
        <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
          <GlassCard className="h-full flex flex-col justify-center gap-4 bg-primary/5 border-primary/20 p-8 shadow-[0_0_50px_rgba(37,109,240,0.1)]">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">SYSTEM STATUS</p>
              <p className="text-2xl font-black text-white italic uppercase font-headline">All Systems Nominal</p>
              <div className="flex gap-1.5 pt-2">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <motion.div 
                    key={i} 
                    initial={{ scaleY: 0.5 }}
                    animate={{ scaleY: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    className="h-2 flex-1 bg-emerald-500 rounded-full opacity-60" 
                  />
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* User Management Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-black font-headline text-white tracking-tight">Ecosystem Directory</h2>
          <div className="w-full sm:w-96 text-xs italic opacity-80">
            <GlassInput
              placeholder="Search by identity or credentials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon="search"
            />
          </div>
        </div>

        <motion.div {...fadeInUp} transition={{ delay: 0.5 }}>
          <GlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Identity</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Authority Level</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Onboarding</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Directives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-body">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-500 italic font-medium tracking-widest uppercase text-xs">
                        <span className="animate-pulse">Accessing secure identity storage...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.map((user, i) => (
                    <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5 text-xs text-white uppercase italic font-bold">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                             <img 
                              src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                              alt="User avatar" 
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white tracking-tight leading-none">{user.name}</span>
                            <span className="text-[10px] text-slate-500 font-inter font-medium mt-1 tracking-tighter lowercase">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border ${
                          user.role === "admin" 
                            ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(37,109,240,0.15)]" 
                            : "bg-white/5 text-slate-500 border-white/5"
                        }`}>
                          {user.role === 'admin' ? <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> : null}
                          {user.role}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-400 font-inter text-[11px] tracking-tighter uppercase font-bold">
                        {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-3">
                          <ClayButton
                            variant={user.role === 'admin' ? "glass" : "blue"}
                            className="h-10 px-5 text-[10px] tracking-widest uppercase font-black"
                            onClick={() => toggleAdmin(user.id, user.role)}
                          >
                            <span className="material-symbols-outlined text-sm mr-2">
                              {user.role === 'admin' ? 'person_off' : 'verified_user'}
                            </span>
                            {user.role === 'admin' ? 'Demote' : 'Promote'}
                          </ClayButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

function AdminStatsCard({ label, value, icon, color }: any) {
  return (
    <GlassCard className="p-8 group hover:bg-white/10 transition-all border-white/10">
      <div className="flex items-center gap-6">
        <div className={`p-5 rounded-2xl bg-white/5 border border-white/5 transition-transform group-hover:scale-110 ${color}`}>
          <span className="material-symbols-outlined text-4xl">{icon}</span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</p>
          <p className="text-4xl font-black text-white italic font-headline tracking-tighter leading-none">{value}</p>
        </div>
      </div>
    </GlassCard>
  );
}

function StatsMini({ label, value, icon }: any) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 group hover:border-primary/30 transition-colors cursor-crosshair">
      <span className="material-symbols-outlined text-base text-slate-500 group-hover:text-primary transition-colors">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] leading-none mb-1">{label}</span>
        <span className="text-xs font-bold text-white leading-none">{value}</span>
      </div>
    </div>
  );
}
