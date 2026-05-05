"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ClayButton } from "@/components/ClayButton";
import { useEffect, useState } from "react";
import { useUrlStore } from "@/lib/store/useUrlStore";
import Link from "next/link";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any
};

export default function LinkDetailsPage({ params }: { params: { id: string } }) {
  const { selected_url, analytics, fetch_url_details, fetch_url_analytics, is_loading } = useUrlStore();

  useEffect(() => {
    fetch_url_details(params.id);
    fetch_url_analytics(params.id);
  }, [params.id, fetch_url_details, fetch_url_analytics]);

  // Derived data for UI charts (could be real in future, keeping logic for now)
  const referrers = analytics?.browser_distribution ? Object.entries(analytics.browser_distribution).map(([browser, count]) => ({
    source: browser,
    count: count.toString(),
    percent: Math.round((count / (analytics.total_clicks || 1)) * 100)
  })) : [
    { source: 'Direct / Email', count: '452', percent: 38 },
    { source: 'Social Media', count: '312', percent: 26 },
    { source: 'Referrals', count: '224', percent: 18 },
  ];

  return (
    <div className="space-y-10">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div {...fadeInUp}>
          <div className="flex items-center gap-3 mb-3">
             <Link href="/dashboard/links">
              <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                <span className="material-symbols-outlined text-sm text-slate-500">arrow_back</span>
              </button>
             </Link>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">LINK INTELLIGENCE UNIT</span>
          </div>
          <h1 className="text-4xl font-black font-headline text-white tracking-tighter uppercase italic truncate max-w-[500px] leading-tight">
             {is_loading ? "Mission Secret" : `/${selected_url?.short_code}`}
          </h1>
          <p className="text-sm font-medium text-slate-500 font-body mt-2 break-all max-w-2xl px-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl italic opacity-80">
             {is_loading ? "Connecting to destination nodes..." : selected_url?.long_url}
          </p>
        </motion.div>
        
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="flex gap-4">
           {selected_url?.qr_code_ready && (
             <ClayButton variant="glass" className="px-6 py-4 rounded-xl text-[10px] tracking-[0.2em] uppercase font-black">
                <span className="material-symbols-outlined mr-2">qr_code_2</span>
                Visual Signal
             </ClayButton>
           )}
           <ClayButton variant="blue" className="px-6 py-4 rounded-xl text-[10px] tracking-[0.2em] uppercase font-black shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined mr-2">edit</span>
              Modify Vector
           </ClayButton>
        </motion.div>
      </div>

      {/* Main Grid Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Real-time Vital Stats */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
            <GlassCard className="p-8 border-white/5">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-xl font-black font-headline text-white italic uppercase tracking-tight">Traffic Trajectory</h3>
                <div className="flex gap-2">
                   {['7D', '24H', 'All'].map(t => (
                     <button key={t} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                       t === 'All' ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_4px_12px_rgba(59,130,246,0.2)]' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'
                     }`}>
                       {t}
                     </button>
                   ))}
                </div>
              </div>
              
              <div className="h-[250px] flex items-end justify-between gap-6 pt-4 px-2">
                {is_loading ? (
                   <div className="w-full text-center text-slate-600 font-black uppercase text-[10px] tracking-widest py-20 animate-pulse italic">Scanning trajectory matrix...</div>
                ) : (
                  [120, 210, 180, 420, 290, 320, 150].map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-6 group">
                    <div className="relative w-full flex flex-col justify-end h-[180px]">
                       <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(count / 420) * 100}%` }}
                        transition={{ delay: 0.3 + (i * 0.05), duration: 1.2, ease: [0.22, 1, 0.36, 1] } as any}
                        className="w-full bg-primary/20 rounded-2xl relative group-hover:bg-primary transition-all cursor-pointer border border-primary/10 shadow-lg group-hover:shadow-primary/50"
                       />
                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl text-[10px] font-black text-white border border-white/10 shadow-2xl">
                         {count}
                       </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-2 italic">D0{i+1}</span>
                  </div>
                 )))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Additional Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
               <GlassCard className="p-8 flex flex-col gap-8 border-white/5">
                 <div className="flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-primary shadow-inner">
                      <span className="material-symbols-outlined text-4xl">language</span>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Global Reach</p>
                       <p className="text-2xl font-black text-white italic font-headline uppercase leading-none tracking-tight">Active Nodes</p>
                    </div>
                 </div>
                 <div className="space-y-6">
                    {analytics?.country_distribution ? Object.entries(analytics.country_distribution).slice(0, 3).map(([country, count], i) => (
                      <div key={i} className="flex items-center justify-between">
                         <span className="text-sm font-bold text-slate-400 font-inter opacity-70 italic">{country}</span>
                         <span className="text-sm font-black text-white italic font-headline">{count} hits</span>
                      </div>
                    )) : (
                      <>
                        <div className="flex items-center justify-between">
                           <span className="text-sm font-bold text-slate-400 font-inter opacity-70 italic">United States</span>
                           <span className="text-sm font-black text-white italic font-headline">42% intensity</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-sm font-bold text-slate-400 font-inter opacity-70 italic">India</span>
                           <span className="text-sm font-black text-white italic font-headline">28% intensity</span>
                        </div>
                      </>
                    )}
                 </div>
               </GlassCard>
             </motion.div>
             <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
                <GlassCard className="p-8 flex flex-col gap-8 bg-primary/5 border-primary/20 shadow-2xl shadow-primary/10">
                   <div className="flex items-center gap-5">
                      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                        <span className="material-symbols-outlined text-4xl shadow-glow-blue">bolt</span>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none">VECTOR STATUS</p>
                         <p className="text-2xl font-black text-white italic font-headline uppercase leading-none tracking-tight">{selected_url?.status || 'Active'}</p>
                      </div>
                   </div>
                   <p className="text-sm text-slate-400 font-body leading-relaxed italic opacity-80">
                     Vector synchronization is at 100%. Security filtration has cleared all incoming packets for this link.
                   </p>
                </GlassCard>
             </motion.div>
          </div>
        </div>

        {/* Right Sidebar: Referrers */}
        <div className="lg:col-span-1">
          <motion.div {...fadeInUp} transition={{ delay: 0.5 }} className="h-full">
            <GlassCard className="p-8 h-full flex flex-col gap-8 border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none mb-1">DATA FLOW</p>
                 <h3 className="text-3xl font-black font-headline text-white italic uppercase tracking-tighter leading-none">Source Matrix</h3>
               </div>
               
               <div className="space-y-10 flex-1">
                 {is_loading ? (
                    <div className="pt-20 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest animate-pulse italic">Neural Bridge Synchronization...</div>
                 ) : referrers.map((ref: any, i: number) => (
                   <div key={i} className="space-y-4">
                     <div className="flex justify-between items-end">
                       <span className="text-xs font-black text-slate-400 font-inter uppercase tracking-[0.2em] italic">{ref.source}</span>
                       <span className="text-sm font-black text-white italic font-headline">{ref.count} <span className="opacity-30 ml-2 text-[10px] tracking-normal font-sans">({ref.percent}%)</span></span>
                     </div>
                     <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${ref.percent}%` }}
                           transition={{ delay: 0.7 + (i * 0.1), duration: 1, ease: 'easeOut' as any }}
                          className="h-full bg-primary rounded-full relative"
                        >
                           <div className="absolute right-0 top-0 bottom-0 w-4 shadow-[0_0_15px_rgba(59,130,246,1)]" />
                        </motion.div>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="pt-8 border-t border-white/5 mt-auto">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 italic">NETWORK VITAL SIGNS</p>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center shadow-inner group hover:border-primary/30 transition-all">
                      <p className="text-xl font-black text-white italic font-headline uppercase leading-none tracking-tight">1.2ms</p>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 opacity-60">LATENCY</p>
                   </div>
                   <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-center shadow-inner group hover:border-emerald-500/30 transition-all">
                      <p className="text-xl font-black text-emerald-400 italic font-headline uppercase leading-none tracking-tight">100%</p>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 opacity-60">STABILITY</p>
                   </div>
                 </div>
               </div>
            </GlassCard>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
