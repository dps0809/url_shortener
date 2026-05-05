"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { ClayButton } from "@/components/ClayButton";
import { GlassInput } from "@/components/GlassInput";
import { useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('security');

  const tabs = [
    { id: 'security', label: 'Security & Access', icon: 'shield_lock' },
    { id: 'api', label: 'API Infrastructure', icon: 'apiKey' },
    { id: 'preferences', label: 'Preferences', icon: 'settings_suggest' },
    { id: 'billing', label: 'Billing Context', icon: 'credit_card' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* Settings Header */}
      <motion.div {...fadeInUp}>
        <h1 className="text-4xl font-black font-headline text-white tracking-tighter uppercase italic">
          System <span className="opacity-40">Configuration</span>
        </h1>
        <p className="text-lg font-medium text-slate-400 font-body mt-1">
          Control your account environment and security directives.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar (Mini) */}
        <div className="lg:col-span-1 space-y-2">
           {tabs.map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 font-headline font-bold text-sm border ${
                 activeTab === tab.id 
                 ? "bg-primary/20 text-white border-primary/30 shadow-lg shadow-primary/10" 
                 : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
               }`}
             >
               <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
               {tab.label}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'api' && <ApiTab />}
            {activeTab === 'preferences' && <PreferencesTab />}
            {activeTab === 'billing' && <BillingTab />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <GlassCard className="p-10 space-y-10">
      <div className="space-y-2">
        <h3 className="text-2xl font-black font-headline text-white italic uppercase tracking-tight">Security Directives</h3>
        <p className="text-slate-500 font-body text-sm">Update your access credentials and enable enhanced mission protection.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-6">
           <div className="space-y-4">
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Identity Update</p>
             <GlassInput placeholder="New Secure Password" type="password" icon="lock" />
             <GlassInput placeholder="Confirm New Password" type="password" icon="lock_reset" />
             <ClayButton variant="blue" className="w-full h-14 rounded-2xl text-xs tracking-widest uppercase font-black">
               Apply Credentials
             </ClayButton>
           </div>
        </div>

        <div className="space-y-8">
           <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
             <div className="flex items-center gap-3 text-emerald-400">
               <span className="material-symbols-outlined">verified</span>
               <span className="text-[10px] font-black uppercase tracking-widest">Multi-Factor Enabled</span>
             </div>
             <p className="text-sm text-slate-400 font-body leading-relaxed">
               Your mission account is protected by hardware-level authentication. 2FA is currently active.
             </p>
             <button className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
               CONFIGURE BACKUP CODES ↗
             </button>
           </div>
        </div>
      </div>
    </GlassCard>
  );
}

function ApiTab() {
  return (
    <GlassCard className="p-10 space-y-10">
      <div className="space-y-2">
        <h3 className="text-2xl font-black font-headline text-white italic uppercase tracking-tight">Infrastructure Keys</h3>
        <p className="text-slate-500 font-body text-sm">Connect your automated mission scripts directly to our secure redirect backbone.</p>
      </div>

      <div className="p-6 rounded-3xl bg-white/3 border border-white/10 flex items-center justify-between">
        <div className="space-y-1">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PRODUCTION SECRET</p>
           <p className="font-mono text-sm text-white select-all">sk_live_v2_9928_xkja_2291_00Z1</p>
        </div>
        <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-xl">content_copy</span>
        </button>
      </div>

      <div className="space-y-4 pt-4">
         <p className="text-sm text-slate-400 font-body leading-relaxed">
           Use this key in your `Authorization` header as a Bearer token. **Warning**: Mission security will be compromised if this key is leaked.
         </p>
         <div className="flex gap-4">
           <ClayButton variant="glass" className="px-6 py-4 rounded-xl text-xs tracking-widest uppercase font-black">
             Regenerate Secret
           </ClayButton>
         </div>
      </div>
    </GlassCard>
  );
}

function PreferencesTab() {
  return (
    <GlassCard className="p-10 space-y-10">
      <div className="space-y-2">
        <h3 className="text-2xl font-black font-headline text-white italic uppercase tracking-tight">Interface Directives</h3>
        <p className="text-slate-500 font-body text-sm">Customize your monitoring dashboard and notifications.</p>
      </div>

      <div className="space-y-8 pt-4">
         {[
           { label: 'Real-time Deployment Alerts', desc: 'Receive instant feedback on link health.', enabled: true },
           { label: 'Daily Intelligence Reports', desc: 'Summary of all engagement metrics.', enabled: false },
           { label: 'System Sound Effects', desc: 'Auditory feedback for interactions.', enabled: true },
         ].map((item, i) => (
           <div key={i} className="flex items-center justify-between group">
             <div className="space-y-1">
               <p className="font-bold text-white tracking-tight">{item.label}</p>
               <p className="text-xs text-slate-500 font-inter">{item.desc}</p>
             </div>
             <button className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${item.enabled ? 'bg-primary shadow-[0_0_15px_rgba(37,109,240,0.5)]' : 'bg-white/10'}`}>
               <motion.div 
                 animate={{ x: item.enabled ? 20 : 0 }}
                 className="w-5 h-5 rounded-full bg-white shadow-md shadow-black/20"
               />
             </button>
           </div>
         ))}
      </div>
    </GlassCard>
  );
}

function BillingTab() {
  return (
    <GlassCard className="p-10 space-y-10 h-full flex flex-col justify-center items-center text-center bg-primary/3 border-primary/10">
       <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary mb-6 shadow-[0_0_40px_rgba(37,109,240,0.3)]">
         <span className="material-symbols-outlined text-4xl">workspace_premium</span>
       </div>
       <div className="space-y-2 max-w-sm">
          <h3 className="text-3xl font-black font-headline text-white italic uppercase tracking-tight leading-none">Unlimited HQ Clearance</h3>
          <p className="text-slate-400 font-body text-sm leading-relaxed">
            Your Pro Membership is active and managed through the global mission control payment gateway.
          </p>
       </div>
       <div className="pt-8 flex gap-4">
          <ClayButton variant="blue" className="px-10 py-5 rounded-2xl text-xs tracking-widest uppercase font-black">
            Manage Payments ↗
          </ClayButton>
       </div>
    </GlassCard>
  );
}
