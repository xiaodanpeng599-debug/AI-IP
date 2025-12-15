
export interface Shot {
  id: string;
  type: string;
  description: string;
  duration: string;
  isBroll: boolean;
  audioCue: string;
  imageUrl?: string; 
  imagePrompt?: string; 
}

export interface VideoScript {
  title: string;
  hook: string;
  body: string;
  cta: string;
  tone: string;
  audioUrl?: string; 
}

// Updated: Based on "User Attention Decision Path" (4.1.2 from PDF)
export interface DataStrategy {
  visualAttraction_1s: string; // 第1秒：视觉吸引/封面/标题 (1s Visual Attraction)
  valueHook_3s: string;        // 第3秒：价值判断/开头钩子 (3s Value Judgment)
  emotionalTrigger_10s: string;// 第10秒：情绪触发/节奏把控 (10s Emotional Trigger)
  interactionDesign_end: string; // 结尾/互动：评论引导/槽点 (End Interaction Design)
}

export interface PublishingGuide {
  caption: string;
  hashtags: string[];
  suggestedMusic: string;
  musicKeywords: string[];
  thumbnailIdea: string;
  thumbnailImageUrl?: string; 
}

export interface EditingGuide {
  pacing: string;
  visualStyle: string;
  soundDesign: string;
  transitions: string;
}

export interface InteractionGuide {
  pinnedComment: string;
  engagementQuestion: string;
  negativeFeedbackHandling: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

// Updated: Metrics aligned with the PDF's success factors
export interface ViralDiagnostics {
  overallScore: number;
  metrics: {
    visualAttraction: number; // 1s Visual (Cover/Start) - 对应PDF第1秒决策/CTR
    valueProposition: number; // 3s Value (Useful/Funny) - 对应PDF第3秒决策/点赞
    emotionalResonance: number; // Emotional connection - 对应PDF情绪价值/共鸣/转发
    interactionPotential: number; // Discussion triggers - 对应PDF互动率/评论/收藏
  };
  viralPotentialLabel?: string; // New field for simple label
  analysis: string; 
  suggestions: string[]; 
}

export interface ScriptAuditResult {
  scores: {
    clarity: number;    // 清晰度
    flow: number;       // 流畅度
    engagement: number; // 吸引力
  };
  critique: string;     // 总评
  suggestions: string[]; // 修改建议
}

export interface VideoPlan {
  platform?: string; // New: Tracks the specific platform strategy used
  script: VideoScript;
  shotList: Shot[];
  editing: EditingGuide;
  publishing: PublishingGuide;
  interaction: InteractionGuide;
  dataStrategy: DataStrategy; 
  diagnostics?: ViralDiagnostics; 
  scriptAudit?: ScriptAuditResult; // New: Script Audit Data
}

export interface ViralAngle {
  id: string;
  title: string;
  description: string;
  whyItWorks: string; // Maps to the 4 Psychological Drivers (Joy, Resonance, Knowledge, Awe)
  difficulty: 'Low' | 'Medium' | 'High';
  viralScore: number;
}

export interface CreatorProfile {
  niche: string;          
  targetAudience: string; 
  persona: string;        
  contentGoal: string;    
}

export interface GenerationState {
  status: 'idle' | 'analyzing' | 'selecting_angle' | 'drafting' | 'diagnosing' | 'complete' | 'error';
  error?: string;
  inspirationSummary?: string;
  sources: GroundingSource[];
  viralAngles?: ViralAngle[];
  selectedAngle?: ViralAngle;
  plan?: VideoPlan;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  topic: string;
  plan: VideoPlan;
  inspirationSummary?: string;
  sources: GroundingSource[];
  angleUsed?: string;
}

export enum TabView {
  SCRIPT = 'SCRIPT',
  SHOTS = 'SHOTS',
  PUBLISH = 'PUBLISH'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}