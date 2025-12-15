import React from 'react';
import { CreatorProfile } from '../types';

interface SettingsViewProps {
  platforms: { id: string; label: string }[];
  tones: { id: string; label: string }[];
  preferences: { defaultPlatform: string; defaultTone: string };
  creatorProfile: CreatorProfile;
  onUpdatePreference: (key: string, value: string) => void;
  onUpdateProfile: (key: keyof CreatorProfile, value: string) => void;
  onClearHistory: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  platforms, 
  tones, 
  preferences, 
  creatorProfile,
  onUpdatePreference, 
  onUpdateProfile,
  onClearHistory 
}) => {
  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight">工作室设置</h2>
        <p className="text-slate-400 mt-2">打造您的专属 IP 人设</p>
      </div>

      {/* Creator Profile Section - NEW */}
      <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900/40 p-6 rounded-xl border border-indigo-500/20 backdrop-blur-sm space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-[40px] pointer-events-none"></div>
        
        <h3 className="text-lg font-bold text-white flex items-center gap-2 relative z-10">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          博主 IP 档案 (Creator DNA)
        </h3>
        <p className="text-xs text-slate-400 -mt-4">AI 将基于此档案为您生成符合人设的内容。</p>
        
        <div className="grid gap-5 relative z-10">
          <div className="space-y-2">
             <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider">核心赛道 (Niche)</label>
             <input 
               type="text"
               value={creatorProfile.niche}
               onChange={(e) => onUpdateProfile('niche', e.target.value)}
               placeholder="例如：美妆护肤、职场干货、情感治愈..."
               className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
             />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider">人设标签 (Persona)</label>
             <input 
               type="text"
               value={creatorProfile.persona}
               onChange={(e) => onUpdateProfile('persona', e.target.value)}
               placeholder="例如：说话犀利的毒舌闺蜜、温柔耐心的邻家大哥..."
               className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider">目标受众 (Audience)</label>
                <input 
                  type="text"
                  value={creatorProfile.targetAudience}
                  onChange={(e) => onUpdateProfile('targetAudience', e.target.value)}
                  placeholder="例如：20-30岁职场女性"
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-200 uppercase tracking-wider">运营目标 (Goal)</label>
                <input 
                  type="text"
                  value={creatorProfile.contentGoal}
                  onChange={(e) => onUpdateProfile('contentGoal', e.target.value)}
                  placeholder="例如：快速涨粉、建立信任、带货..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
                />
             </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-slate-800/40 p-6 rounded-xl border border-white/5 backdrop-blur-sm space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          常规设置
        </h3>
        
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">默认发布平台</label>
            <div className="relative">
              <select 
                value={preferences.defaultPlatform}
                onChange={(e) => onUpdatePreference('defaultPlatform', e.target.value)}
                className="w-full appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 pr-8 font-medium hover:bg-slate-900/80 transition-colors cursor-pointer"
              >
                {platforms.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">默认语气</label>
            <div className="relative">
              <select 
                value={preferences.defaultTone}
                onChange={(e) => onUpdatePreference('defaultTone', e.target.value)}
                className="w-full appearance-none bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 pr-8 font-medium hover:bg-slate-900/80 transition-colors cursor-pointer"
              >
                {tones.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-slate-800/40 p-6 rounded-xl border border-red-900/30 backdrop-blur-sm space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          数据管理
        </h3>
        
        <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-lg border border-red-900/20">
            <div>
                <div className="text-sm font-bold text-red-200">清空历史记录</div>
                <div className="text-xs text-red-400/70">此操作无法撤销，将删除所有本地保存的脚本方案。</div>
            </div>
            <button 
                onClick={onClearHistory}
                className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 text-xs font-bold rounded-lg border border-red-700/50 transition-colors"
            >
                立即清空
            </button>
        </div>
      </div>
    </div>
  );
};