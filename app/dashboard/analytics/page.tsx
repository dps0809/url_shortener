"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ClayButton } from "@/components/ClayButton";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any
};

export default function AnalyticsHub() {
  return (
    <div className="space-y-12 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <motion.div {...fadeInUp}>
          <h1 className="text-4xl font-black font-headline text-white tracking-tighter uppercase italic">
            Intelligence <span className="opacity-40">Hub</span>
          </h1>
          <p className="text-lg font-medium text-slate-400 font-body mt-1">
            Global traffic telemetry and mission-critical referral matrices.
          </p>
        </motion.div>
        
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">LIVE TELEMETRY</span>
          </div>
          <ClayButton variant="glass" className="h-10 px-6 text-[10px] tracking-widest uppercase font-black">
            Export Dataset
          </ClayButton>
        </motion.div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="md:col-span-2">
          <GlassCard className="h-[400px] flex flex-col p-8 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black font-headline text-white italic uppercase tracking-tighter">Traffic Trajectory</h3>
              <div className="flex gap-2">
                {['24H', '7D', '30D', 'ALL'].map(t => (
                  <button key={t} className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${t === '7D' ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Visualizer Simulation */}
            <div className="flex-1 flex items-end gap-3 pb-4">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.3, 0.8, 1, 0.7, 0.5, 0.9, 0.4, 0.6, 0.8, 0.9, 1, 0.5, 0.8, 0.6, 0.4].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 + (i * 0.05), ease: [0.22, 1, 0.36, 1] } as any}
                  className="flex-1 bg-primary/40 rounded-t-lg group-hover:bg-primary group-hover:shadow-[0_0_20px_rgba(37,109,240,0.3)] transition-all"
                />
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
          <GlassCard className="h-[400px] p-8 flex flex-col justify-between border-white/10">
            <div className="space-y-2">
              <h3 className="text-xl font-black font-headline text-white italic uppercase tracking-tighter">Global Matrix</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Top Geographic Nodes</p>
            </div>
            
            <div className="space-y-6">
              {[
                { country: 'United States', code: 'US', value: 45, color: 'text-primary' },
                { country: 'United Kingdom', code: 'UK', value: 28, color: 'text-purple-400' },
                { country: 'Germany', code: 'DE', value: 15, color: 'text-emerald-400' },
                { country: 'Japan', code: 'JP', value: 12, color: 'text-amber-400' },
              ].map((item, i) => (
                <div key={item.code} className="space-y-2 group/item">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]">
                    <span className="text-slate-400 group-hover/item:text-white transition-colors">{item.country}</span>
                    <span className={item.color}>{item.value}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1, delay: 1 + (i * 0.2) }}
                      className={`h-full bg-current ${item.color} rounded-full`} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5">
              <ClayButton variant="glass" className="w-full text-[9px] tracking-widest uppercase font-black">
                Full Connectivity Map
              </ClayButton>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Unique Deployments" value="2,410" trend="+12.4%" />
        <StatsCard label="System Throughput" value="1.2 Gbps" trend="+4.2%" />
        <StatsCard label="Threat Prevention" value="99.9%" trend="Steady" />
        <StatsCard label="API Latency" value="12ms" trend="-2ms" />
      </div>
    </div>
  );
}

function StatsCard({ label, value, trend }: any) {
  return (
    <motion.div {...fadeInUp} transition={{ delay: 0.3 } as any}>
      <GlassCard className="p-8 group hover:bg-white/10 transition-all border-white/10">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{label}</p>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'text-emerald-400 bg-emerald-400/10' : trend.startsWith('-') ? 'text-blue-400 bg-blue-400/10' : 'text-slate-400 bg-white/5'}`}>
              {trend}
            </span>
          </div>
          <p className="text-3xl font-black text-white italic font-headline tracking-tighter leading-none">{value}</p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
