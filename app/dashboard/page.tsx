"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ClayButton } from "@/components/ClayButton";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useUrlStore } from "@/lib/store/useUrlStore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { urls, fetch_urls, is_loading } = useUrlStore();
  const [stats, setStats] = useState<any>({
    total_clicks: '0',
    active_links: '0',
    total_links: '0',
    trends: { clicks: '0%', links: '0 new' }
  });

  useEffect(() => {
    fetch_urls();
    
    // Fetch stats separately as they might not be in the URL store
    const fetchStats = async () => {
      const response = await apiClient.get<any>('/stats/overview');
      if (response.data) {
        setStats(response.data);
      } else {
        // Fallback for demo if endpoint not yet implemented
        setStats({
          total_clicks: '12,450',
          active_links: urls.length.toString(),
          total_links: urls.length.toString(),
          trends: { clicks: '+12%', links: '+4 new' }
        });
      }
    };
    fetchStats();
  }, [fetch_urls, urls.length]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <motion.div {...fadeInUp}>
          <h2 className="text-3xl font-black font-headline text-white tracking-tight leading-none">Dashboard Overview</h2>
          <p className="text-slate-400 font-body mt-2">Welcome back, {user?.name || user?.username || 'Pilot'}. System status is nominal.</p>
        </motion.div>
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <Link href="/dashboard/upload">
            <ClayButton variant="blue" className="px-6 py-4 rounded-xl shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Generate New Link
            </ClayButton>
          </Link>
        </motion.div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <GlassCard className="p-8 group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <span className="material-symbols-outlined">ads_click</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-400/10 rounded-full border border-emerald-400/20">{stats?.trends?.clicks}</span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Atmospheric Clicks</p>
            <h3 className="text-5xl font-black font-headline text-white tracking-tighter">
              {is_loading ? "..." : stats?.total_clicks}
            </h3>
          </GlassCard>
        </motion.div>

        <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
          <GlassCard className="p-8 hover:border-purple-400/30 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-white/5 rounded-full uppercase tracking-tighter border border-white/10 italic">Nominal</span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Active Vectors</p>
            <h3 className="text-5xl font-black font-headline text-white tracking-tighter">
              {is_loading ? "..." : stats?.active_links}
            </h3>
          </GlassCard>
        </motion.div>

        <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
          <GlassCard className="p-8 hover:border-emerald-400/30 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="material-symbols-outlined">link</span>
              </div>
              <span className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full border border-primary/20">{stats?.trends?.links}</span>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Total Data-Links</p>
            <h3 className="text-5xl font-black font-headline text-white tracking-tighter">
              {is_loading ? "..." : stats?.total_links}
            </h3>
          </GlassCard>
        </motion.div>
      </div>

      {/* Main Dashboard Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Links Table (2/3 width) */}
        <motion.div {...fadeInUp} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <GlassCard className="p-0 overflow-hidden border-white/5">
            <div className="px-8 py-6 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
              <h4 className="text-xl font-bold font-headline text-white tracking-tight uppercase italic">Active Link Grid</h4>
              <button className="text-primary text-xs font-bold hover:underline tracking-widest uppercase">Full Manifest</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] border-b border-white/5 bg-white/[0.01]">
                    <th className="px-8 py-5">Short Code</th>
                    <th className="px-8 py-5">Destination Vector</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Created</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body divide-y divide-white/5">
                  {is_loading ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center text-slate-500 uppercase text-[10px] tracking-widest animate-pulse">Synchronizing Neural Network...</td>
                    </tr>
                  ) : urls.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center text-slate-500 uppercase text-[10px] tracking-widest">No links found in manifest.</td>
                    </tr>
                  ) : urls.map((link, idx) => (
                    <tr key={link.url_id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-black font-headline tracking-tighter text-base group-hover:text-blue-400 transition-colors">/{link.short_code}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-slate-400 max-w-[200px] truncate font-inter italic opacity-70">{link.long_url}</td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-widest ${
                          link.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {link.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-inter text-[10px] tracking-widest uppercase">
                        {new Date(link.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions / Analytics Preview (1/3 width) */}
        <div className="space-y-6">
          <motion.div {...fadeInUp} transition={{ delay: 0.5 }}>
            <GlassCard className="p-8 relative overflow-hidden group border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
              <div className="relative z-10">
                <h4 className="text-xl font-bold font-headline text-white mb-8 tracking-tight uppercase italic underline decoration-primary underline-offset-8">Neural Flow</h4>
                <div className="space-y-8">
                  {[
                    { label: 'Cloud Distribution', value: 65, color: 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]' },
                    { label: 'Edge Proximity', value: 25, color: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' },
                    { label: 'Bot Filtration', value: 10, color: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' },
                  ].map((insight) => (
                    <div key={insight.label}>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] mb-3">
                        <span className="text-slate-500">{insight.label}</span>
                        <span className="text-white">{insight.value}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${insight.value}%` }}
                          transition={{ duration: 1, delay: 0.8 }}
                          className={`h-full ${insight.color} rounded-full`} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000 rotate-12">
                <span className="material-symbols-outlined text-[180px]">hub</span>
              </div>
            </GlassCard>
          </motion.div>

          {/* Promo Card matching Stitch clay style */}
          <motion.div {...fadeInUp} transition={{ delay: 0.6 }}>
            <div className="clay-button-purple rounded-3xl p-8 text-white relative overflow-hidden group shadow-[0_20px_40px_rgba(147,51,234,0.15)] flex flex-col justify-between h-56">
              <div className="relative z-10">
                <h4 className="text-2xl font-black font-headline mb-3 leading-none italic tracking-tighter">Atmospheric Tier</h4>
                <p className="text-xs opacity-70 mb-6 font-body leading-relaxed max-w-[180px]">Upgrade to kinetic precision with branding layers.</p>
              </div>
              <div className="relative z-10">
                <button className="bg-white text-purple-600 px-8 py-3 rounded-full text-[10px] font-black font-headline uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-1">
                  Elevate Now
                </button>
              </div>
              <div className="absolute right-0 bottom-0 top-0 left-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:-translate-x-4 group-hover:-translate-y-4 transition-transform duration-1000">
                <span className="material-symbols-outlined text-[100px]">auto_awesome</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
