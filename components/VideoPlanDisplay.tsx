import React, { useState, useEffect } from 'react';
import { VideoPlan, TabView, CreatorProfile } from '../types';
import { generateHookVariations, HookVariation, generateTitleVariations, generateShotImage, generateScriptAudio, generateThumbnail, analyzeScriptPotential, rewriteScriptSection, runScriptAudit } from '../services/geminiService';
import * as XLSX from 'xlsx';
import { Teleprompter } from './Teleprompter';

interface VideoPlanDisplayProps {
  plan: VideoPlan;
  creatorProfile?: CreatorProfile;
  onPlanUpdate: (updatedPlan: VideoPlan) => void;
}

export const VideoPlanDisplay: React.FC<VideoPlanDisplayProps> = ({ plan: initialPlan, creatorProfile, onPlanUpdate }) => {
  const [plan, setPlan] = useState<VideoPlan>(initialPlan);
  const [activeTab, setActiveTab] = useState<TabView>(TabView.SCRIPT);
  
  // Hook Optimization State
  const [isOptimizingHook, setIsOptimizingHook] = useState(false);
  const [hookVariations, setHookVariations] = useState<HookVariation[]>([]);
  const [showVariations, setShowVariations] = useState(false);

  // Hook Visual State (New)
  const [isGeneratingHookVisual, setIsGeneratingHookVisual] = useState(false);
  const [hookVisualUrl, setHookVisualUrl] = useState<string | null>(null);

  // Script Body Polish State (New)
  const [isPolishingBody, setIsPolishingBody] = useState(false);

  // Script Audit State (New)
  const [isAuditing, setIsAuditing] = useState(false);

  // Teleprompter State
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  // Title Generator State
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [titleVariations, setTitleVariations] = useState<string[]>([]);

  // Audio Generation State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Image Generation State
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  
  // Thumbnail Generation State
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  // Diagnostics State
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // UI State
  const [shotViewMode, setShotViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    setPlan(initialPlan);
    setHookVariations([]);
    setShowVariations(false);
    setTitleVariations([]);
    setAudioError(null);
    setIsDiagnosing(false);
    setHookVisualUrl(null); // Reset hook visual on new plan
    setIsAuditing(false);
  }, [initialPlan]);

  const calculateDuration = (text: string) => {
    const cleanText = text.replace(/[^\u4e00-\u9fa5]/g, "");
    const seconds = Math.ceil(cleanText.length / 4.5);
    return seconds;
  };

  const totalDuration = calculateDuration(plan.script.hook + plan.script.body + plan.script.cta);

  const handleOptimizeHook = async () => {
    if (isOptimizingHook) return;
    setIsOptimizingHook(true);
    setHookVariations([]);
    
    try {
        const variations = await generateHookVariations(plan.script.hook, plan.script.title, plan.script.tone);
        setHookVariations(variations);
        setShowVariations(true);
    } catch (e) {
        console.error("Failed to optimize hook");
    } finally {
        setIsOptimizingHook(false);
    }
  };

  const handleGenerateHookVisual = async () => {
    if (isGeneratingHookVisual) return;
    setIsGeneratingHookVisual(true);
    try {
        // Use the first shot description or the hook text itself to generate a high-impact visual
        const prompt = plan.shotList[0]?.description || plan.script.hook;
        // Check if first shot has an image to use as reference
        const refImage = plan.shotList[0]?.imageUrl;
        const url = await generateShotImage(prompt, "Cinematic, High Impact, Viral Video Opener, 4k", refImage);
        setHookVisualUrl(url);
    } catch (e) {
        console.error("Hook visual failed");
    } finally {
        setIsGeneratingHookVisual(false);
    }
  };

  const handlePolishBody = async (instruction: string) => {
    if (isPolishingBody) return;
    setIsPolishingBody(true);
    try {
        const newBody = await rewriteScriptSection(plan.script.body, instruction, plan.script.title);
        const newPlan = { ...plan, script: { ...plan.script, body: newBody } };
        setPlan(newPlan);
        onPlanUpdate(newPlan);
    } catch (e) {
        console.error("Polish failed");
    } finally {
        setIsPolishingBody(false);
    }
  };

  const handleScriptAudit = async () => {
      if (isAuditing) return;
      setIsAuditing(true);
      try {
          const result = await runScriptAudit(plan.script);
          const newPlan = { ...plan, scriptAudit: result };
          setPlan(newPlan);
          onPlanUpdate(newPlan);
      } catch (e) {
          console.error("Audit failed");
      } finally {
          setIsAuditing(false);
      }
  };

  const handleRunDiagnostics = async () => {
      if (isDiagnosing) return;
      setIsDiagnosing(true);
      try {
          // Updated to pass the full plan and profile for better accuracy
          const result = await analyzeScriptPotential(plan, creatorProfile);
          const newPlan = { ...plan, diagnostics: result };
          setPlan(newPlan);
          onPlanUpdate(newPlan);
      } catch (e) {
          console.error("Diagnosis failed");
      } finally {
          setIsDiagnosing(false);
      }
  };

  const handleGenerateTitles = async () => {
    if (isGeneratingTitles) return;
    setIsGeneratingTitles(true);
    try {
      const titles = await generateTitleVariations(plan.script.title, plan.script.body);
      setTitleVariations(titles);
    } catch (e) {
      console.error("Failed to generate titles");
    } finally {
      setIsGeneratingTitles(false);
    }
  }

  const handleGenerateAudio = async () => {
      if (isGeneratingAudio) return;
      setIsGeneratingAudio(true);
      setAudioError(null);

      try {
          const fullText = `${plan.script.hook}。${plan.script.body}。${plan.script.cta}`;
          const url = await generateScriptAudio(fullText);
          const newPlan = { ...plan, script: { ...plan.script, audioUrl: url } };
          setPlan(newPlan);
          onPlanUpdate(newPlan);
      } catch (e: any) {
          console.error("Audio generation failed", e);
          setAudioError("生成失败，请重试");
      } finally {
          setIsGeneratingAudio(false);
      }
  };

  const handleGenerateImage = async (shotId: string, description: string, currentImageUrl?: string) => {
      if (generatingImages[shotId]) return;
      
      setGeneratingImages(prev => ({ ...prev, [shotId]: true }));
      try {
          // Pass currentImageUrl as reference if it exists (Img2Img)
          const imageUrl = await generateShotImage(description, plan.editing.visualStyle, currentImageUrl);
          const newPlan = {
              ...plan,
              shotList: plan.shotList.map(shot => 
                  shot.id === shotId ? { ...shot, imageUrl } : shot
              )
          };
          setPlan(newPlan);
          onPlanUpdate(newPlan);
      } catch (e) {
          console.error("Image gen failed", e);
      } finally {
          setGeneratingImages(prev => ({ ...prev, [shotId]: false }));
      }
  };

  // New: Handle File Upload
  const handleImageUpload = (shotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          const base64 = reader.result as string;
          const newPlan = {
              ...plan,
              shotList: plan.shotList.map(shot => 
                  shot.id === shotId ? { ...shot, imageUrl: base64 } : shot
              )
          };
          setPlan(newPlan);
          onPlanUpdate(newPlan);
      };
      reader.readAsDataURL(file);
      // Reset input value to allow re-uploading same file if needed
      e.target.value = '';
  };

  const handleGenerateThumbnail = async () => {
    if (isGeneratingThumbnail) return;
    setIsGeneratingThumbnail(true);
    try {
        const url = await generateThumbnail(plan.publishing.thumbnailIdea, plan.script.title);
        const newPlan = { ...plan, publishing: { ...plan.publishing, thumbnailImageUrl: url } };
        setPlan(newPlan);
        onPlanUpdate(newPlan);
    } catch (e) {
        console.error("Thumbnail gen failed", e);
    } finally {
        setIsGeneratingThumbnail(false);
    }
  };

  const applyHook = (newHook: string) => {
      const newPlan = { ...plan, script: { ...plan.script, hook: newHook } };
      setPlan(newPlan);
      onPlanUpdate(newPlan);
  };

  const applyTitle = (newTitle: string) => {
    const newPlan = { ...plan, script: { ...plan.script, title: newTitle } };
    setPlan(newPlan);
    onPlanUpdate(newPlan);
  };

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Script Sheet
    const scriptData = [
      ["模块 (Section)", "内容 (Content)"],
      ["标题 (Title)", plan.script.title],
      ["基调 (Tone)", plan.script.tone],
      ["预估时长 (Est. Duration)", `~${totalDuration} 秒`],
      ["Hook (黄金3秒)", plan.script.hook],
      ["正文 (Body)", plan.script.body],
      ["CTA (行动号召)", plan.script.cta],
    ];
    const wsScript = XLSX.utils.aoa_to_sheet(scriptData);
    wsScript['!cols'] = [{ wch: 20 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsScript, "脚本 Script");

    // 2. Shot List Sheet
    const shotHeaders = ["序号 (#)", "类型 (Type)", "画面描述 (Description)", "音效/配乐 (Audio Cue)", "时长 (Duration)", "B-Roll"];
    const shotRows = plan.shotList.map((s, i) => [
      i + 1, s.type, s.description, s.audioCue || "", s.duration, s.isBroll ? "是 (Yes)" : "否 (No)"
    ]);
    const wsShots = XLSX.utils.aoa_to_sheet([shotHeaders, ...shotRows]);
    wsShots['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 60 }, { wch: 30 }, { wch: 12 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsShots, "分镜表 Shot List");

    // 3. Operations Sheet (Publishing, Editing, Interaction, Data Strategy)
    const opsData = [
      ["分类 (Category)", "项目 (Item)", "内容 (Content)"],
      // Data Strategy (Updated Labels)
      ["关注路径 (Path)", "第1秒: 视觉吸引 (1s Visual)", plan.dataStrategy?.visualAttraction_1s || "-"],
      ["关注路径 (Path)", "第3秒: 价值钩子 (3s Hook)", plan.dataStrategy?.valueHook_3s || "-"],
      ["关注路径 (Path)", "第10秒: 情绪触发 (10s Emotion)", plan.dataStrategy?.emotionalTrigger_10s || "-"],
      ["关注路径 (Path)", "结尾: 互动设计 (Interaction)", plan.dataStrategy?.interactionDesign_end || "-"],
      // Publishing
      ["发布 (Publishing)", "标题文案 (Caption)", plan.publishing.caption],
      ["发布 (Publishing)", "标签 (Hashtags)", plan.publishing.hashtags.join(" ")],
      ["发布 (Publishing)", "BGM建议", plan.publishing.suggestedMusic],
      ["发布 (Publishing)", "封面创意", plan.publishing.thumbnailIdea],
      // Editing
      ["剪辑 (Editing)", "节奏 (Pacing)", plan.editing.pacing],
      ["剪辑 (Editing)", "视觉风格 (Visuals)", plan.editing.visualStyle],
      ["剪辑 (Editing)", "音效 (Sound)", plan.editing.soundDesign],
      ["剪辑 (Editing)", "转场 (Transitions)", plan.editing.transitions],
      // Interaction
      ["互动 (Interaction)", "置顶评论", plan.interaction.pinnedComment],
      ["互动 (Interaction)", "引导提问", plan.interaction.engagementQuestion],
      ["互动 (Interaction)", "负评应对", plan.interaction.negativeFeedbackHandling],
    ];
    const wsOps = XLSX.utils.aoa_to_sheet(opsData);
    wsOps['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsOps, "运营 Operations");

    const safeTitle = plan.script.title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 30);
    XLSX.writeFile(wb, `${safeTitle}_plan.xlsx`);
  };

  const handleDownloadMarkdown = () => {
    const mdContent = `# ${plan.script.title}\n\n${plan.script.body}`; 
    const blob = new Blob([mdContent.trim()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (showTeleprompter) {
    const fullScript = `${plan.script.hook}\n\n${plan.script.body}\n\n${plan.script.cta}`;
    return <Teleprompter text={fullScript} onClose={() => setShowTeleprompter(false)} />;
  }

  // Helper for Diagnostics Progress Bar
  const ScoreBar = ({ label, score, color }: { label: string, score: number, color: string }) => (
    <div className="flex items-center gap-3">
        <span className="text-[10px] w-24 text-slate-400 text-right truncate" title={label}>{label}</span>
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${color}`} 
              style={{ width: `${score}%` }}
            ></div>
        </div>
        <span className="text-xs font-bold text-slate-300 w-8">{score}</span>
    </div>
  );

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50 animate-fade-in relative ring-1 ring-white/5">
       {/* Actions Header */}
       <div className="absolute top-4 right-4 z-10 hidden md:flex gap-2">
         <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg border border-emerald-500/30 transition-all backdrop-blur-md">
            Excel
         </button>
         <button onClick={handleDownloadMarkdown} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg border border-slate-600/30 transition-all backdrop-blur-md">
            MD
         </button>
       </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-slate-900/50 overflow-x-auto pr-32 md:pr-0">
        {[
          { id: TabView.SCRIPT, label: '文案 & 诊断', icon: '📈' }, 
          { id: TabView.SHOTS, label: '分镜 & 绘图', icon: '🎨' },
          { id: TabView.PUBLISH, label: '发布 & 封面', icon: '🚀' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] py-4 px-6 text-sm font-medium transition-all flex items-center justify-center gap-2 relative
              ${activeTab === tab.id 
                ? 'text-white bg-white/5' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
            )}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8 min-h-[400px]">
        {/* SCRIPT VIEW */}
        {activeTab === TabView.SCRIPT && (
          <div className="space-y-8">
             {/* Title Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
                 <div className="flex-1 space-y-2">
                     <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-3xl font-black text-white tracking-tight">{plan.script.title}</h3>
                        <button onClick={handleGenerateTitles} disabled={isGeneratingTitles} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-purple-400 transition-colors">
                             <svg className={`w-5 h-5 ${isGeneratingTitles ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        </button>
                     </div>
                     {titleVariations.length > 0 && (
                        <div className="flex flex-wrap gap-2 animate-fade-in-down">
                            {titleVariations.map((t, i) => (
                                <button key={i} onClick={() => applyTitle(t)} className="text-xs bg-slate-800/80 border border-slate-700 text-slate-300 px-3 py-1 rounded-full hover:border-purple-500 hover:text-white transition-all">
                                    {t}
                                </button>
                            ))}
                        </div>
                     )}
                     <div className="flex gap-2 pt-1">
                        <span className="px-3 py-1 bg-white/5 text-slate-300 text-xs rounded-full border border-white/10">
                            ⏱️ ~{totalDuration}s
                        </span>
                        {plan.platform && (
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30 flex items-center gap-1">
                                📱 {plan.platform}
                            </span>
                        )}
                     </div>
                 </div>
                 <button 
                     onClick={() => setShowTeleprompter(true)}
                     className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 group"
                   >
                     <span className="group-hover:animate-pulse">⏺</span> 提词器模式
                 </button>
             </div>

            {/* DATA STRATEGY (UPDATED LABELS) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    <div className="text-[10px] text-red-400 uppercase font-bold mb-1 tracking-wider">第1秒 (视觉吸引)</div>
                    <p className="text-xs text-red-100 font-medium leading-tight">{plan.dataStrategy?.visualAttraction_1s || "Strong Cover"}</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                    <div className="text-[10px] text-orange-400 uppercase font-bold mb-1 tracking-wider">第3秒 (价值钩子)</div>
                    <p className="text-xs text-orange-100 font-medium leading-tight">{plan.dataStrategy?.valueHook_3s || "Curiosity Gap"}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                    <div className="text-[10px] text-blue-400 uppercase font-bold mb-1 tracking-wider">第10秒 (情绪触发)</div>
                    <p className="text-xs text-blue-100 font-medium leading-tight">{plan.dataStrategy?.emotionalTrigger_10s || "Pacing Change"}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                    <div className="text-[10px] text-green-400 uppercase font-bold mb-1 tracking-wider">结尾 (互动设计)</div>
                    <p className="text-xs text-green-100 font-medium leading-tight">{plan.dataStrategy?.interactionDesign_end || "Call to Action"}</p>
                </div>
            </div>

            {/* DIAGNOSTICS CARD */}
            <div className="bg-slate-800/50 rounded-xl p-1 relative overflow-hidden group border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50"></div>
                <div className="relative p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="bg-white/10 p-1.5 rounded-lg"><svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg></span>
                            {plan.platform ? `${plan.platform.split(' ')[0]} 算法模拟` : 'AI 算法模拟'}
                        </h4>
                        {!plan.diagnostics && (
                            <button 
                                onClick={handleRunDiagnostics}
                                disabled={isDiagnosing}
                                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2"
                            >
                                {isDiagnosing ? '算法模拟中...' : '开始模拟诊断'}
                            </button>
                        )}
                    </div>
                    
                    {plan.diagnostics ? (
                        <div className="animate-fade-in-down grid md:grid-cols-2 gap-6">
                            <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg">
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-slate-400 text-xs">综合推荐分</span>
                                    <span className="text-3xl font-black text-purple-400">{plan.diagnostics.overallScore}</span>
                                </div>
                                {/* Updated Metrics Display */}
                                <ScoreBar label="1s 视觉吸引" score={plan.diagnostics.metrics.visualAttraction} color="bg-red-500" />
                                <ScoreBar label="3s 价值钩子" score={plan.diagnostics.metrics.valueProposition} color="bg-orange-500" />
                                <ScoreBar label="情绪/留存" score={plan.diagnostics.metrics.emotionalResonance} color="bg-blue-500" />
                                <ScoreBar label="互动/传播" score={plan.diagnostics.metrics.interactionPotential} color="bg-green-500" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm text-slate-300 italic">"{plan.diagnostics.analysis}"</p>
                                <div className="space-y-2">
                                    <span className="text-[10px] uppercase font-bold text-slate-500">优化建议</span>
                                    {plan.diagnostics.suggestions.map((s, i) => (
                                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-white/5 p-2 rounded">
                                            <span className="text-purple-400 font-bold">•</span>
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="text-center py-6 text-slate-500 text-sm border-t border-white/5 mt-4 border-dashed">
                             <p>点击诊断，让 AI 模拟“{plan.platform || '平台'}”算法对脚本进行压力测试。</p>
                         </div>
                    )}
                </div>
            </div>

            {/* Audio Player */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-1 p-[1px] bg-gradient-to-r from-white/10 to-transparent">
                <div className="bg-slate-900/90 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">AI 智能配音 (TTS)</h4>
                            <p className="text-xs text-slate-400">生成自然流畅的参考音轨</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {plan.script.audioUrl ? (
                            <audio controls src={plan.script.audioUrl} className="h-8 w-full md:w-64 opacity-80 hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="h-8 w-full md:w-64 bg-white/5 rounded-full flex items-center justify-center text-xs text-slate-600">
                                等待生成...
                            </div>
                        )}
                        <button
                            onClick={handleGenerateAudio}
                            disabled={isGeneratingAudio}
                            className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-all whitespace-nowrap border border-white/10
                            ${isGeneratingAudio 
                                ? 'bg-indigo-900/50 cursor-wait' 
                                : 'bg-white/10 hover:bg-indigo-600 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20'}`}
                        >
                            {isGeneratingAudio ? '生成中...' : (plan.script.audioUrl ? '重新生成' : '生成配音')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Script Content - HOOK SECTION (Enhanced) */}
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-900/20 to-slate-900/40 p-6 rounded-xl border border-purple-500/20 relative group transition-all hover:border-purple-500/40 flex flex-col md:flex-row gap-6">
                  {/* Left: Hook Text */}
                  <div className="flex-1">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-xs uppercase tracking-wider text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">🔥 黄金 3 秒 (Hook)</span>
                          
                          <button 
                            onClick={handleOptimizeHook}
                            disabled={isOptimizingHook}
                            className={`text-xs flex items-center gap-1 text-purple-300 hover:text-white transition-colors ${isOptimizingHook ? 'opacity-50' : ''}`}
                          >
                              <svg className={`w-3 h-3 ${isOptimizingHook ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                              {isOptimizingHook ? 'AI 思考中...' : '优化开场'}
                          </button>
                      </div>
                      <p className="text-xl md:text-2xl font-medium text-white leading-relaxed">{plan.script.hook}</p>
                  </div>

                  {/* Right: Visual Preview (New) */}
                  <div className="w-full md:w-48 shrink-0">
                      {hookVisualUrl ? (
                          <div className="relative aspect-[9/16] rounded-lg overflow-hidden border border-purple-500/30 group/visual">
                              <img src={hookVisualUrl} alt="Hook Visual" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2 opacity-0 group-hover/visual:opacity-100 transition-opacity">
                                   <button 
                                      onClick={handleGenerateHookVisual}
                                      className="text-[10px] text-white bg-white/20 hover:bg-white/30 backdrop-blur rounded py-1 px-2"
                                   >
                                      重新生成
                                   </button>
                              </div>
                          </div>
                      ) : (
                          <div 
                             onClick={handleGenerateHookVisual}
                             className={`h-full min-h-[160px] border-2 border-dashed border-purple-500/20 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-purple-500/10 hover:border-purple-500/50 transition-all text-center
                             ${isGeneratingHookVisual ? 'opacity-50 cursor-wait' : ''}`}
                          >
                             {isGeneratingHookVisual ? (
                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                             ) : (
                                <svg className="w-8 h-8 text-purple-500/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                             )}
                             <span className="text-xs text-purple-300 font-bold">
                                 {isGeneratingHookVisual ? '绘制画面中...' : '生成画面预演'}
                             </span>
                             <span className="text-[10px] text-purple-400/60 mt-1">看到爆款的第一秒</span>
                          </div>
                      )}
                  </div>
                </div>

                {showVariations && (
                    <div className="grid md:grid-cols-3 gap-4 animate-fade-in-down">
                        {hookVariations.map((v, i) => (
                            <div 
                                key={i}
                                onClick={() => applyHook(v.content)}
                                className="bg-slate-800/40 p-4 rounded-xl border border-white/5 hover:border-purple-500/50 hover:bg-slate-800/80 cursor-pointer group transition-all"
                            >
                                <div className="text-xs font-bold text-purple-400 mb-2">{v.type}</div>
                                <p className="text-sm text-slate-300 group-hover:text-white line-clamp-3 mb-2">{v.content}</p>
                                <div className="text-[10px] text-slate-500">{v.reason}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Script Body Section (Enhanced with Magic Polish) */}
            <div className="bg-slate-800/20 p-6 rounded-xl border border-white/5 relative group">
              <div className="flex justify-between items-start mb-4">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">正文脚本</span>
                  
                  <div className="flex items-center gap-3">
                      {/* Script Audit Button */}
                       <button 
                          onClick={handleScriptAudit}
                          disabled={isAuditing}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                          ${plan.scriptAudit 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20'}`}
                       >
                          <svg className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          {isAuditing ? '正在体检...' : (plan.scriptAudit ? '重新体检' : '文案深度体检')}
                       </button>

                      {/* Magic Polish Tools */}
                      <div className="flex flex-wrap items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-slate-500 uppercase font-bold hidden md:inline">魔法润色:</span>
                          <button 
                            onClick={() => handlePolishBody("Make it more conversational and natural")}
                            disabled={isPolishingBody}
                            className="px-2 py-1 bg-slate-700/50 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-white/5 transition-colors"
                          >
                             🗣️ 更口语
                          </button>
                          <button 
                            onClick={() => handlePolishBody("Make it more emotional and touching")}
                            disabled={isPolishingBody}
                            className="px-2 py-1 bg-slate-700/50 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-white/5 transition-colors"
                          >
                             ❤️ 更走心
                          </button>
                          <button 
                            onClick={() => handlePolishBody("Make it sharper and slightly controversial")}
                            disabled={isPolishingBody}
                            className="px-2 py-1 bg-slate-700/50 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-white/5 transition-colors"
                          >
                             🔪 更犀利
                          </button>
                          
                          <div className="w-px h-4 bg-white/10 mx-1 hidden md:block"></div> {/* Separator */}

                          <button 
                            onClick={() => handlePolishBody("Rewrite this to be more concise and punchy. Reduce length by roughly 30% while keeping the core hook and value.")}
                            disabled={isPolishingBody}
                            className="px-2 py-1 bg-slate-700/50 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-white/5 transition-colors"
                          >
                             📉 更精简
                          </button>
                          <button 
                            onClick={() => handlePolishBody("Expand this with more vivid details, examples, or emotional context. Increase length by roughly 30%.")}
                            disabled={isPolishingBody}
                            className="px-2 py-1 bg-slate-700/50 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-white/5 transition-colors"
                          >
                             📈 更丰富
                          </button>
                          
                          {isPolishingBody && <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>}
                      </div>
                  </div>
              </div>

              {/* Script Audit Result Display */}
              {plan.scriptAudit && (
                <div className="mb-6 bg-slate-900/50 rounded-lg p-4 border border-emerald-500/20 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                         <div className="bg-emerald-500/20 p-1.5 rounded-md text-emerald-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                         </div>
                         <h4 className="text-sm font-bold text-white">文案体检报告</h4>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <ScoreBar label="清晰度 (Clarity)" score={plan.scriptAudit.scores.clarity} color="bg-emerald-400" />
                                <ScoreBar label="流畅度 (Flow)" score={plan.scriptAudit.scores.flow} color="bg-blue-400" />
                                <ScoreBar label="吸引力 (Engagement)" score={plan.scriptAudit.scores.engagement} color="bg-purple-400" />
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-3">
                                "{plan.scriptAudit.critique}"
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">修改建议</span>
                            <ul className="space-y-2">
                                {plan.scriptAudit.suggestions.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                        <span className="text-emerald-500 mt-0.5">✓</span>
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
              )}

              <p className="text-slate-200 whitespace-pre-line leading-loose text-lg font-light">{plan.script.body}</p>
            </div>

            <div className="bg-blue-900/10 p-6 rounded-xl border border-blue-500/20 text-center">
              <span className="text-xs uppercase tracking-wider text-blue-400 font-bold block mb-2">CTA (行动号召)</span>
              <p className="text-blue-100 font-medium text-lg">{plan.script.cta}</p>
            </div>
            
          </div>
        )}

        {/* SHOT LIST & EDITING VIEW */}
        {activeTab === TabView.SHOTS && (
          <div className="space-y-6">
             {/* View Toggle & Editing Guide Header */}
             <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xl font-bold text-white">分镜 & 视觉</h3>
                 <div className="flex bg-slate-800 p-1 rounded-lg border border-white/10">
                    <button 
                        onClick={() => setShotViewMode('list')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${shotViewMode === 'list' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        列表
                    </button>
                    <button 
                        onClick={() => setShotViewMode('grid')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${shotViewMode === 'grid' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                        故事板
                    </button>
                 </div>
             </div>

             {/* Editing Guide (Compact) */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                      { l: '节奏', v: plan.editing.pacing },
                      { l: '风格', v: plan.editing.visualStyle },
                      { l: '音效', v: plan.editing.soundDesign },
                      { l: '转场', v: plan.editing.transitions }
                  ].map((item, i) => (
                      <div key={i} className="bg-slate-800/40 border border-white/5 rounded-lg p-3">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">{item.l}</span>
                          <p className="text-xs text-slate-300 font-medium line-clamp-2">{item.v}</p>
                      </div>
                  ))}
             </div>

             {/* Audio Checklist */}
             <div className="flex flex-wrap gap-2 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider mr-2 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                    音效库
                </span>
                {Array.from(new Set(plan.shotList.map(s => s.audioCue).filter(Boolean))).map((cue, i) => (
                    <span key={i} className="text-xs bg-yellow-900/20 text-yellow-200 px-2 py-0.5 rounded border border-yellow-700/20">
                        {cue}
                    </span>
                ))}
             </div>
               
             {/* SHOTS GRID VIEW */}
             {shotViewMode === 'grid' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                     {plan.shotList.map((shot, idx) => (
                         <div key={idx} className="bg-slate-800/40 rounded-xl overflow-hidden border border-white/5 group hover:border-blue-500/30 transition-all flex flex-col">
                             {/* Image Area */}
                             <div className="relative aspect-[9/16] bg-slate-900/80 border-b border-white/5 group/image">
                                 {shot.imageUrl ? (
                                     <img src={shot.imageUrl} alt={shot.description} className="w-full h-full object-cover" />
                                 ) : (
                                     <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                                         <p className="text-xs text-slate-500 mb-4 line-clamp-3">{shot.description}</p>
                                         <div className="flex gap-2">
                                             <button
                                                onClick={() => handleGenerateImage(shot.id, shot.description, shot.imageUrl)}
                                                disabled={generatingImages[shot.id]}
                                                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-blue-500/20"
                                             >
                                                {generatingImages[shot.id] ? 'AI 绘图...' : '✨ AI 绘图'}
                                             </button>
                                             {/* Upload Button Grid Empty */}
                                             <label className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-white/10 cursor-pointer flex items-center gap-1">
                                                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(shot.id, e)} />
                                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                 上传
                                             </label>
                                         </div>
                                     </div>
                                 )}
                                 {/* Overlay Controls */}
                                 {shot.imageUrl && (
                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                         <a href={shot.imageUrl} download={`shot_${idx+1}.png`} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur" title="下载"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg></a>
                                         <button onClick={() => handleGenerateImage(shot.id, shot.description, shot.imageUrl)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur" title="AI 重绘 (Img2Img)"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>
                                         <label className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur cursor-pointer" title="上传素材">
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(shot.id, e)} />
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                         </label>
                                     </div>
                                 )}
                                 <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white backdrop-blur font-mono">
                                     #{idx + 1}
                                 </div>
                                 <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white backdrop-blur">
                                     {shot.duration}
                                 </div>
                             </div>
                             
                             {/* Text Content */}
                             <div className="p-4 flex-1 flex flex-col">
                                 <div className="flex items-center gap-2 mb-2">
                                     <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${shot.isBroll ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                         {shot.type}
                                     </span>
                                 </div>
                                 <p className="text-sm text-slate-300 mb-3 flex-1">{shot.description}</p>
                                 <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500">
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                                     {shot.audioCue || "无"}
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             )}

             {/* SHOTS LIST VIEW */}
             {shotViewMode === 'list' && (
               <div className="grid gap-4 animate-fade-in-up">
                 {plan.shotList.map((shot, idx) => (
                   <div key={idx} className="flex flex-col lg:flex-row gap-4 p-5 bg-slate-800/30 rounded-xl border border-white/5 hover:bg-slate-800/50 hover:border-white/10 transition-colors group">
                     {/* Text Info */}
                     <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400 font-mono">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${shot.isBroll ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                {shot.type}
                              </span>
                              <span className="text-xs text-slate-500">{shot.duration}</span>
                            </div>
                            <p className="text-slate-200 text-sm leading-relaxed">{shot.description}</p>
                            
                            <div className="text-xs text-slate-500 flex items-center gap-1 bg-black/20 self-start px-2 py-1 rounded inline-flex">
                               <svg className="w-3 h-3 text-yellow-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                               {shot.audioCue || "无音效"}
                            </div>
                        </div>
                     </div>

                     {/* Image Actions */}
                     <div className="w-full lg:w-48 shrink-0 flex flex-col justify-center">
                        {shot.imageUrl ? (
                             <div className="group/img relative aspect-video rounded-lg overflow-hidden border border-white/10">
                                 <img src={shot.imageUrl} className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity gap-2">
                                     <a href={shot.imageUrl} download className="p-1.5 bg-white/20 rounded-full text-white" title="下载"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg></a>
                                     {/* Upload Button List View Overlay */}
                                     <label className="p-1.5 bg-white/20 rounded-full text-white cursor-pointer hover:bg-white/40" title="替换素材">
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(shot.id, e)} />
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                     </label>
                                 </div>
                             </div>
                        ) : (
                            <div className="w-full h-full min-h-[100px] flex flex-col gap-2">
                                <button
                                    onClick={() => handleGenerateImage(shot.id, shot.description)}
                                    disabled={generatingImages[shot.id]}
                                    className="flex-1 rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center text-xs text-slate-500 hover:text-blue-300 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all gap-1"
                                >
                                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    {generatingImages[shot.id] ? '生成中...' : 'AI 绘图'}
                                </button>
                                {/* Upload Button List View Empty */}
                                <label className="flex-1 rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center text-xs text-slate-500 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all gap-1 cursor-pointer">
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(shot.id, e)} />
                                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    上传素材
                                </label>
                            </div>
                        )}
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {/* PUBLISHING & OPERATIONS VIEW - Kept mostly same but ensuring types match */}
        {activeTab === TabView.PUBLISH && (
          <div className="space-y-8">
             <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-6">
                 {/* Caption */}
                 <div className="bg-slate-800/30 p-6 rounded-xl border border-white/5">
                   <div className="flex justify-between items-center mb-3">
                      <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">视频文案</span>
                      <button 
                         onClick={() => navigator.clipboard.writeText(`${plan.publishing.caption}\n\n${plan.publishing.hashtags.join(' ')}`)}
                         className="text-xs text-blue-400 hover:text-white transition-colors"
                       >
                         复制全部
                       </button>
                   </div>
                   <p className="text-sm text-slate-300 leading-relaxed font-mono bg-black/20 p-4 rounded-lg border border-white/5 select-all whitespace-pre-line">
                     {plan.publishing.caption}
                     <br /><br />
                     {plan.publishing.hashtags.map(h => `${h} `)}
                   </p>
                 </div>

                 {/* Hashtags */}
                 <div className="bg-slate-800/30 p-6 rounded-xl border border-white/5">
                   <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-4">推荐标签</span>
                   <div className="flex flex-wrap gap-2">
                     {plan.publishing.hashtags.map((tag, i) => (
                       <span key={i} className="text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-white/5 transition-colors cursor-pointer select-all">
                         {tag}
                       </span>
                     ))}
                   </div>
                 </div>
               </div>

               <div className="space-y-6">
                 {/* Thumbnail Generator */}
                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-white/10 relative overflow-hidden group">
                     <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-4">封面设计</span>
                     
                     <div className="flex flex-col items-center">
                         {plan.publishing.thumbnailImageUrl ? (
                             <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-2xl border border-white/10 group/thumb">
                                 <img src={plan.publishing.thumbnailImageUrl} className="w-full h-full object-cover" alt="Generated Thumbnail" />
                                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                                     <a 
                                       href={plan.publishing.thumbnailImageUrl} 
                                       download={`thumbnail_${plan.script.title}.png`}
                                       className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition-transform"
                                     >
                                        下载图片
                                     </a>
                                     <button 
                                        onClick={handleGenerateThumbnail}
                                        className="px-4 py-2 bg-white/20 text-white text-xs font-bold rounded-full hover:bg-white/30 backdrop-blur"
                                     >
                                        重新生成
                                     </button>
                                 </div>
                             </div>
                         ) : (
                             <div className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 bg-white/5">
                                 <p className="text-sm text-slate-300 font-medium mb-2">创意方向</p>
                                 <p className="text-xs text-slate-500 mb-6 line-clamp-3">{plan.publishing.thumbnailIdea}</p>
                                 
                                 <button
                                    onClick={handleGenerateThumbnail}
                                    disabled={isGeneratingThumbnail}
                                    className={`px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-all transform hover:-translate-y-1
                                    ${isGeneratingThumbnail 
                                        ? 'bg-slate-700 text-slate-400 cursor-wait' 
                                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30'}`}
                                 >
                                    {isGeneratingThumbnail ? 'AI 绘制中...' : '✨ 生成高点击封面'}
                                 </button>
                             </div>
                         )}
                     </div>
                 </div>

                 {/* Music */}
                 <div className="bg-slate-800/30 p-6 rounded-xl border border-white/5">
                   <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-4">BGM 建议</span>
                   <div className="flex items-center gap-3 mb-3">
                       <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                       </div>
                       <p className="text-white font-medium">{plan.publishing.suggestedMusic}</p>
                   </div>
                   
                   {(plan.publishing.musicKeywords && plan.publishing.musicKeywords.length > 0) && (
                      <div className="flex flex-wrap gap-2 pl-11">
                         {plan.publishing.musicKeywords.map((keyword, i) => (
                             <a 
                               key={i}
                               href={`https://pixabay.com/music/search/${encodeURIComponent(keyword)}/`}
                               target="_blank"
                               rel="noreferrer"
                               className="text-xs text-slate-400 hover:text-purple-400 hover:underline flex items-center gap-1"
                             >
                               #{keyword}
                             </a>
                         ))}
                      </div>
                   )}
                 </div>
               </div>
             </div>

             {/* Interaction Strategy */}
             <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="bg-green-500/20 text-green-400 w-8 h-8 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>
                  </span>
                  评论区运营策略
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-amber-500 mb-2 block tracking-widest">置顶神评</span>
                    <p className="text-sm text-slate-300 italic">"{plan.interaction.pinnedComment}"</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-blue-500 mb-2 block tracking-widest">引导提问</span>
                    <p className="text-sm text-slate-300 italic">"{plan.interaction.engagementQuestion}"</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-red-500 mb-2 block tracking-widest">负评防御</span>
                    <p className="text-sm text-slate-300 italic">"{plan.interaction.negativeFeedbackHandling}"</p>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};