import React, { useState } from 'react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulation of API call delay
    setTimeout(() => {
      if (!email || !password) {
        setError('请输入所有必填项');
        setIsLoading(false);
        return;
      }

      if (!isLogin && !name) {
          setError('请输入您的昵称');
          setIsLoading(false);
          return;
      }

      // Mock Database Logic to persist names across sessions
      // This ensures that when a user logs back in, we recall their registered name
      // instead of falling back to the email prefix.
      const MOCK_DB_KEY = 'viralflow_users_db';
      let mockDb: Record<string, string> = {};
      try {
          const dbStr = localStorage.getItem(MOCK_DB_KEY);
          if (dbStr) mockDb = JSON.parse(dbStr);
      } catch (e) {
          console.error("Failed to load mock DB");
      }

      let displayName = name;

      if (!isLogin) {
          // Registration: Save name to mock DB
          mockDb[email] = name;
          localStorage.setItem(MOCK_DB_KEY, JSON.stringify(mockDb));
      } else {
          // Login: Retrieve name from mock DB if exists
          if (mockDb[email]) {
              displayName = mockDb[email];
          } else {
              // Fallback if no record found (e.g. first time mock login or cleared cache)
              displayName = email.split('@')[0];
          }
      }

      // Mock User Data
      // In a real app, this would hit a backend API
      const user: User = {
        id: email.replace(/[^a-zA-Z0-9]/g, ''), // Simple ID from email
        email: email,
        name: displayName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
      };

      onLogin(user);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px]"></div>
      
      <div className="relative w-full max-w-md p-8 animate-fade-in-up">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20 transform rotate-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
                <path d="M15 3v6h6" />
                <path d="M10 18v-4" />
                <path d="M8 14h4" />
              </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">EasyStudio 智影工坊</h1>
          <p className="text-slate-400 text-sm">您的 AI 爆款内容合伙人</p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
           <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 pb-2 text-sm font-bold transition-all relative ${isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                登录
                {isLogin && <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 pb-2 text-sm font-bold transition-all relative ${!isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                注册新账号
                {!isLogin && <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
              </button>
           </div>

           <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-500 ml-1">昵称</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="您希望我们怎么称呼您？"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-xs uppercase font-bold text-slate-500 ml-1">邮箱账号</label>
                 <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs uppercase font-bold text-slate-500 ml-1">密码</label>
                 <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                 />
              </div>

              {error && (
                  <div className="text-red-400 text-xs bg-red-900/20 p-3 rounded-lg border border-red-900/50 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                  </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                {isLogin ? '进入工作台' : '创建账号'}
              </button>
           </form>

           <p className="mt-6 text-center text-xs text-slate-500">
              {isLogin ? "没有账号？" : "已有账号？"}
              <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-400 hover:text-indigo-300 ml-1 font-bold transition-colors">
                  {isLogin ? "立即注册" : "直接登录"}
              </button>
           </p>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">Powered by Google Gemini</p>
        </div>
      </div>
    </div>
  );
};