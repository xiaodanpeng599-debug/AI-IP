import React from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'create' | 'history' | 'settings';
  onNavigate: (view: 'create' | 'history' | 'settings') => void;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar / Mobile Header */}
      <header className="md:w-64 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between shrink-0 h-auto md:h-screen sticky top-0">
        <div>
          <div className="flex items-center gap-3 mb-8 cursor-pointer group" onClick={() => onNavigate('create')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/50 group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                <path d="M15 3v6h6" />
                <path d="M10 18v-4" />
                <path d="M8 14h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 leading-tight">
                EasyStudio
              </h1>
              <p className="text-[11px] text-indigo-400 font-bold tracking-wider uppercase">智影工坊</p>
            </div>
          </div>
          
          <nav className="space-y-2 text-sm text-slate-400">
            <button 
              onClick={() => onNavigate('create')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-3 ${currentView === 'create' ? 'bg-indigo-600/10 text-white border-l-4 border-indigo-500 shadow-sm' : 'hover:text-slate-200 hover:bg-slate-900/50 border-l-4 border-transparent'}`}
            >
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              新建企划
            </button>
            <button 
              onClick={() => onNavigate('history')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-3 ${currentView === 'history' ? 'bg-indigo-600/10 text-white border-l-4 border-indigo-500 shadow-sm' : 'hover:text-slate-200 hover:bg-slate-900/50 border-l-4 border-transparent'}`}
            >
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              创意资产库
            </button>
            <button 
              onClick={() => onNavigate('settings')}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-medium transition-all flex items-center gap-3 ${currentView === 'settings' ? 'bg-indigo-600/10 text-white border-l-4 border-indigo-500 shadow-sm' : 'hover:text-slate-200 hover:bg-slate-900/50 border-l-4 border-transparent'}`}
            >
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              工作室设置
            </button>
          </nav>
        </div>
        
        <div className="space-y-4 mt-8 md:mt-0">
           {/* User Profile Card */}
           <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center gap-3 relative group">
              <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} className="w-10 h-10 rounded-full bg-slate-800 object-cover" />
              <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
              <button onClick={onLogout} className="text-slate-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors" title="退出登录">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </button>
           </div>

           <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-white/5 shadow-inner">
              <div className="flex justify-between items-center mb-2">
                 <p className="text-[10px] text-slate-400 font-bold uppercase">AI 引擎状态</p>
                 <div className="flex items-center gap-1.5">
                     <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     <span className="text-[10px] text-emerald-400 font-bold">Online</span>
                 </div>
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                 <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                 Gemini 2.5 Flash
              </div>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};