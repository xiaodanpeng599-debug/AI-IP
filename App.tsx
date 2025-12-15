import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { VideoPlanDisplay } from './components/VideoPlanDisplay';
import { SettingsView } from './components/SettingsView';
import { AuthScreen } from './components/AuthScreen';
import { analyzeViralAngles, generateVideoPlan } from './services/geminiService';
import { GenerationState, HistoryItem, ViralAngle, CreatorProfile, VideoPlan, User } from './types';

// Icons
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/></svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);

const FireIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.3.9.8 2.3 2.9 2.8Z"/></svg>
);

// Constants
const PLATFORMS = [
  { id: '抖音 (Douyin)', label: '抖音' },
  { id: '小红书 (Red)', label: '小红书' },
  { id: '视频号 (WeChat)', label: '视频号' },
  { id: 'YouTube Shorts', label: 'YouTube Shorts' },
];

const TONES = [
  { id: '像朋友聊天 (Conversational)', label: '像朋友聊天 (自然)' },
  { id: '幽默搞笑 (Humorous)', label: '幽默搞笑 (轻松)' },
  { id: '专业干货 (Professional)', label: '专业干货 (严肃)' },
  { id: '情感共鸣 (Emotional)', label: '情感共鸣 (走心)' },
  { id: '犀利吐槽 (Controversial)', label: '犀利吐槽 (观点)' },
];

const DURATIONS = [
  { id: 'Short', label: '短视频 (15-30秒)', desc: '高密度、强节奏' },
  { id: 'Medium', label: '中视频 (30-60秒)', desc: '标准叙事、完整' },
  { id: 'Long', label: '长视频 (60秒+)', desc: '深度干货、沉浸' },
];

interface UserPreferences {
  defaultPlatform: string;
  defaultTone: string;
}

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  const [view, setView] = useState<'create' | 'history' | 'settings'>('create');
  const [userInput, setUserInput] = useState('');
  
  // Settings State
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultPlatform: PLATFORMS[0].id,
    defaultTone: TONES[0].id
  });

  // Creator Profile State
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile>({
      niche: '',
      targetAudience: '',
      persona: '',
      contentGoal: ''
  });

  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0].id);
  const [selectedTone, setSelectedTone] = useState(TONES[0].id);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[1].id); // Default to Medium

  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Track the ID of the current history item we are working on
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    sources: []
  });

  // Load User from LocalStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('viralflow_user');
    if (storedUser) {
        try {
            setUser(JSON.parse(storedUser));
        } catch (e) {
            console.error("Failed to parse user");
        }
    }
  }, []);

  // Load user-specific data when user changes
  useEffect(() => {
    if (!user) {
        setHistory([]);
        setCreatorProfile({ niche: '', targetAudience: '', persona: '', contentGoal: '' });
        return;
    }

    // Load History (User scoped)
    const savedHistory = localStorage.getItem(`viralflow_history_${user.id}`);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    } else {
        setHistory([]);
    }

    // Load Preferences (User scoped)
    const savedPrefs = localStorage.getItem(`viralflow_preferences_${user.id}`);
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences(parsed);
        setSelectedPlatform(parsed.defaultPlatform || PLATFORMS[0].id);
        setSelectedTone(parsed.defaultTone || TONES[0].id);
      } catch (e) {
        console.error("Failed to load preferences", e);
      }
    }

    // Load Profile (User scoped)
    const savedProfile = localStorage.getItem(`viralflow_profile_${user.id}`);
    if (savedProfile) {
        try {
            setCreatorProfile(JSON.parse(savedProfile));
        } catch (e) {
            console.error("Failed to load profile", e);
        }
    } else {
        setCreatorProfile({ niche: '', targetAudience: '', persona: '', contentGoal: '' });
    }
  }, [user]);

  const handleLogin = (newUser: User) => {
      setUser(newUser);
      localStorage.setItem('viralflow_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('viralflow_user');
      setView('create');
      setState({ status: 'idle', sources: [] });
      setUserInput('');
      setCurrentHistoryId(null);
  };

  const addToHistory = (item: HistoryItem) => {
    if (!user) return;
    const newHistory = [item, ...history];
    setHistory(newHistory);
    localStorage.setItem(`viralflow_history_${user.id}`, JSON.stringify(newHistory));
    setCurrentHistoryId(item.id); 
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    if (!user) return;
    e.stopPropagation();
    if (window.confirm('确定要删除这条记录吗？')) {
      const newHistory = history.filter(h => h.id !== id);
      setHistory(newHistory);
      localStorage.setItem(`viralflow_history_${user.id}`, JSON.stringify(newHistory));
      if (currentHistoryId === id) {
          setCurrentHistoryId(null);
          setState({ status: 'idle', sources: [] });
      }
    }
  };

  const clearAllHistory = () => {
    if (!user) return;
    if (window.confirm('确定要清空所有历史记录吗？此操作无法撤销。')) {
      setHistory([]);
      localStorage.removeItem(`viralflow_history_${user.id}`);
      setCurrentHistoryId(null);
      alert("历史记录已清空。");
    }
  };

  const handlePlanUpdate = (updatedPlan: VideoPlan) => {
      if (!user) return;
      setState(prev => ({ ...prev, plan: updatedPlan }));

      if (currentHistoryId) {
          const updatedHistory = history.map(item => 
              item.id === currentHistoryId 
                  ? { ...item, plan: updatedPlan } 
                  : item
          );
          setHistory(updatedHistory);
          localStorage.setItem(`viralflow_history_${user.id}`, JSON.stringify(updatedHistory));
      }
  };

  const updatePreference = (key: string, value: string) => {
    if (!user) return;
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem(`viralflow_preferences_${user.id}`, JSON.stringify(newPrefs));
  };

  const updateProfile = (key: keyof CreatorProfile, value: string) => {
      if (!user) return;
      const newProfile = { ...creatorProfile, [key]: value };
      setCreatorProfile(newProfile);
      localStorage.setItem(`viralflow_profile_${user.id}`, JSON.stringify(newProfile));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setUserInput(item.topic);
    setState({
      status: 'complete',
      plan: item.plan,
      inspirationSummary: item.inspirationSummary,
      sources: item.sources
    });
    setCurrentHistoryId(item.id); 
    setView('create');
  };

  const hasProfileSet = creatorProfile.niche || creatorProfile.persona;

  // Step 1: Analyze Angles
  const handleAnalyze = async () => {
    if (!userInput.trim()) return;
    if (!process.env.API_KEY) {
        alert("API Key missing");
        return;
    }

    setState(prev => ({ ...prev, status: 'analyzing', error: undefined, viralAngles: [], selectedAngle: undefined }));
    setCurrentHistoryId(null); 

    try {
      const angles = await analyzeViralAngles(userInput);
      setState(prev => ({
        ...prev,
        status: 'selecting_angle',
        viralAngles: angles
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: "分析爆款角度失败，请重试。" 
      }));
    }
  };

  // Step 2: Generate Plan with Selected Angle
  const handleSelectAngleAndGenerate = async (angle: ViralAngle) => {
      setState(prev => ({ ...prev, status: 'drafting', selectedAngle: angle }));
      
      try {
        const { plan, inspiration } = await generateVideoPlan(
            userInput,
            angle,
            selectedTone,
            selectedPlatform,
            selectedDuration, 
            hasProfileSet ? creatorProfile : undefined
        );

        setState(prev => ({
            ...prev,
            status: 'complete',
            plan,
            inspirationSummary: inspiration.summary,
            sources: inspiration.sources
        }));

        addToHistory({
            id: Date.now().toString(),
            timestamp: Date.now(),
            topic: userInput,
            plan: plan,
            inspirationSummary: inspiration.summary,
            sources: inspiration.sources,
            angleUsed: angle.title
        });
      } catch (error) {
        console.error(error);
        setState(prev => ({ 
            ...prev, 
            status: 'error', 
            error: "生成脚本失败，请重试。" 
        }));
      }
  };

  // Render Auth Screen if not logged in
  if (!user) {
      return <AuthScreen onLogin={handleLogin} />;
  }

  // Render Main App
  return (
    <Layout currentView={view} onNavigate={setView} user={user} onLogout={handleLogout}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="space-y-12 pb-20">
        
        {view === 'create' && (
          <>
            {/* HERO SECTION */}
            <div className="text-center md:text-left space-y-6 animate-fade-in-down pt-8">
              <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter leading-tight">
                <span className="block text-2xl md:text-3xl text-slate-400 font-bold mb-2">你好, {user.name}</span>
                你的才华<br className="md:hidden"/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  本该就是爆款
                </span>
              </h2>
              <div className="flex flex-col md:flex-row gap-2 md:items-center text-slate-400 text-lg font-light">
                <span className="font-bold text-white">EasyStudio 智影工坊</span>
                <span className="hidden md:inline text-slate-600">|</span>
                <p>AI 经纪人已就位，带你 C 位出道。</p>
              </div>
            </div>

            {/* INPUT SECTION - Command Center Style */}
            <div className="relative group animate-fade-in-up mt-8">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-50 blur group-hover:opacity-75 transition duration-1000"></div>
              <div className="relative bg-slate-900 rounded-2xl p-1">
                 <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 md:p-8">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            本期选题灵感 (Topic)
                        </label>
                        {hasProfileSet ? (
                            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-xs text-indigo-300">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                已应用 IP 人设: <span className="font-bold">{creatorProfile.persona}</span>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setView('settings')} 
                                className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                未设置 IP 档案
                            </button>
                        )}
                    </div>
                    <textarea
                      className="w-full h-32 bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none mb-6 text-lg"
                      placeholder={hasProfileSet ? `基于【${creatorProfile.niche}】赛道，输入您的选题想法...` : "例如：我想拍一个关于“职场反内卷”的视频..."}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      disabled={state.status !== 'idle' && state.status !== 'complete' && state.status !== 'error'}
                    />

                    <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
                      {/* SETTINGS */}
                      <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        
                        {/* Platform Selector */}
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                          <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">发布平台</label>
                          <div className="relative">
                            <select 
                                value={selectedPlatform}
                                onChange={(e) => setSelectedPlatform(e.target.value)}
                                disabled={state.status !== 'idle' && state.status !== 'complete' && state.status !== 'error'}
                                className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-8 hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                          </div>
                        </div>

                        {/* Duration Selector (NEW) */}
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                          <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">预估时长</label>
                          <div className="relative">
                            <select 
                                value={selectedDuration}
                                onChange={(e) => setSelectedDuration(e.target.value)}
                                disabled={state.status !== 'idle' && state.status !== 'complete' && state.status !== 'error'}
                                className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-8 hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                {DURATIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                          </div>
                        </div>

                        {/* Tone Selector */}
                        {!hasProfileSet && (
                             <div className="flex flex-col gap-2 w-full md:w-auto">
                             <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">语气 (临时)</label>
                             <div className="relative">
                               <select 
                                   value={selectedTone}
                                   onChange={(e) => setSelectedTone(e.target.value)}
                                   disabled={state.status !== 'idle' && state.status !== 'complete' && state.status !== 'error'}
                                   className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-8 hover:bg-slate-700 transition-colors cursor-pointer"
                               >
                                   {TONES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                               </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                   <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                               </div>
                             </div>
                           </div>
                        )}
                      </div>

                      {/* ACTION BUTTON */}
                      {state.status === 'idle' || state.status === 'complete' || state.status === 'error' ? (
                         <button
                            onClick={handleAnalyze}
                            disabled={!userInput.trim()}
                            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-xl shadow-blue-900/20 transition-all w-full md:w-auto mt-4 md:mt-0
                            ${!userInput.trim()
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:shadow-purple-500/25 active:scale-95 transform'
                            }`}
                        >
                            <SparklesIcon />
                            {state.status === 'complete' ? '重置并分析' : '打造爆款内容'}
                        </button>
                      ) : (
                        <button disabled className="flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-bold text-white bg-slate-800 border border-slate-700 cursor-wait w-full md:w-auto mt-4 md:mt-0">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-blue-400 rounded-full animate-spin" />
                            {state.status === 'analyzing' ? '正在匹配 4 大心理驱动力...' : '正在撰写脚本...'}
                        </button>
                      )}
                    </div>
                 </div>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {state.status === 'error' && (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-3 animate-fade-in backdrop-blur-sm">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                 {state.error}
              </div>
            )}

            {/* STEP 2: ANGLE SELECTION UI */}
            {state.status === 'selecting_angle' && state.viralAngles && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <span className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-blue-500/30">2</span>
                            选择叙事切入点
                        </h3>
                        <span className="text-slate-400 text-sm hidden md:block">
                            AI 为您的选题匹配了 4 大心理驱动力 (快乐/共鸣/知识/震撼)
                        </span>
                    </div>
                    

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {state.viralAngles.map((angle) => (
                            <div 
                                key={angle.id}
                                onClick={() => handleSelectAngleAndGenerate(angle)}
                                className="group bg-slate-800/40 backdrop-blur-sm border border-white/5 hover:border-blue-500/50 hover:bg-slate-800/80 p-6 rounded-2xl cursor-pointer transition-all relative overflow-hidden shadow-lg hover:shadow-blue-500/10"
                            >
                                {/* Hover Gradient Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>

                                <div className="absolute top-0 right-0 p-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                                        <FireIcon />
                                        热度 {angle.viralScore}/10
                                    </div>
                                </div>

                                <h4 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors pr-24">
                                    {angle.title}
                                </h4>
                                <p className="text-slate-300 text-sm mb-5 min-h-[40px] leading-relaxed">
                                    {angle.description}
                                </p>
                                
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 mb-5 group-hover:border-white/10 transition-colors">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1 tracking-wider">底层驱动力 (Core Driver)</span>
                                    <p className="text-xs text-slate-400 font-medium">{angle.whyItWorks}</p>
                                </div>

                                <div className="flex items-center justify-between relative z-10 pt-2 border-t border-white/5">
                                    <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                                        angle.difficulty === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        angle.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    }`}>
                                        制作难度: {angle.difficulty === 'Low' ? '简单' : angle.difficulty === 'Medium' ? '中等' : '困难'}
                                    </span>
                                    <button className="text-white text-sm font-bold group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                        生成脚本 <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RESULTS AREA */}
            {(state.status === 'complete' || state.status === 'drafting') && (
              <div className="space-y-8 animate-fade-in-up">
                
                {state.selectedAngle && (
                    <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/40 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between backdrop-blur-sm">
                         <div className="flex items-center gap-4">
                             <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                                 <SparklesIcon />
                             </div>
                             <div>
                                 <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider mb-0.5">当前使用的爆款模型</div>
                                 <div className="text-white font-bold text-lg">{state.selectedAngle.title}</div>
                             </div>
                         </div>
                         <button 
                           onClick={handleAnalyze} 
                           className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors border border-white/5"
                           disabled={state.status === 'drafting'}
                         >
                            重选模型
                         </button>
                    </div>
                )}

                {/* INSPIRATION SOURCES */}
                {state.sources.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2 pl-1">
                      <SearchIcon />
                      参考资料 (Search Context)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {state.sources.slice(0, 3).map((source, idx) => (
                        <a 
                          key={idx} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block p-4 bg-slate-800/40 border border-white/5 rounded-xl hover:bg-slate-800 hover:border-blue-500/30 transition-all group"
                        >
                          <h4 className="text-sm font-medium text-slate-200 group-hover:text-blue-400 truncate">
                            {source.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 truncate font-mono opacity-70">{source.uri}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* MAIN PLAN DISPLAY */}
                {state.plan && (
                  <VideoPlanDisplay 
                    plan={state.plan} 
                    creatorProfile={creatorProfile}
                    onPlanUpdate={handlePlanUpdate}
                  />
                )}
              </div>
            )}
          </>
        )}
        
        {view === 'history' && (
          /* HISTORY VIEW */
          <div className="space-y-8 animate-fade-in">
             <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <h2 className="text-3xl font-bold text-white tracking-tight">创意资产库</h2>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-400 border border-white/5">共 {history.length} 条</span>
             </div>

             {history.length === 0 ? (
               <div className="text-center py-24 bg-slate-800/20 rounded-2xl border border-slate-700/50 border-dashed backdrop-blur-sm">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <SparklesIcon />
                 </div>
                 <p className="text-slate-400 mb-4 text-lg">暂无创意记录</p>
                 <button 
                   onClick={() => setView('create')}
                   className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                 >
                   开始孵化
                 </button>
               </div>
             ) : (
               <div className="grid gap-4">
                 {history.map((item) => (
                   <div 
                     key={item.id}
                     onClick={() => loadHistoryItem(item)}
                     className="bg-slate-800/40 p-6 rounded-xl border border-white/5 hover:border-blue-500/30 hover:bg-slate-800/60 transition-all cursor-pointer group relative backdrop-blur-sm"
                   >
                     <div className="flex justify-between items-start mb-2">
                       <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 pr-10">
                         {item.plan.script.title}
                       </h3>
                       <button
                         onClick={(e) => deleteHistoryItem(item.id, e)}
                         className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-400/10 rounded-lg transition-colors absolute top-4 right-4 opacity-0 group-hover:opacity-100"
                         title="删除"
                       >
                         <TrashIcon />
                       </button>
                     </div>
                     <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                       {item.topic}
                     </p>
                     
                     <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="font-mono">{new Date(item.timestamp).toLocaleString('zh-CN')}</span>
                        {item.angleUsed && (
                             <span className="bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-md border border-blue-500/20 font-medium">
                                {item.angleUsed}
                             </span>
                        )}
                        <span className="bg-slate-700/50 px-2.5 py-1 rounded-md text-slate-300 border border-white/5">
                          {item.plan.shotList.length} 镜头
                        </span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {view === 'settings' && (
          <SettingsView 
            platforms={PLATFORMS}
            tones={TONES}
            preferences={preferences}
            creatorProfile={creatorProfile}
            onUpdatePreference={updatePreference}
            onUpdateProfile={updateProfile}
            onClearHistory={clearAllHistory}
          />
        )}
      </div>
    </Layout>
  );
}