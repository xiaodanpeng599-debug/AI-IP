import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { VideoPlan, GroundingSource, ViralAngle, ViralDiagnostics, CreatorProfile, ScriptAuditResult, VideoScript } from "../types";

export interface HookVariation {
  type: string;
  content: string;
  reason: string;
}

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Platform Strategy Maps based on provided PDFs
 */
const PLATFORM_STRATEGIES: Record<string, string> = {
  '抖音 (Douyin)': `
    **PLATFORM: DOUYIN (TIKTOK CHINA)**
    - **Core Algorithm**: 95% Interest-based Recommendation.
    - **Key Metrics**: Completion Rate (>30% for cold start), Interaction Rate.
    - **Viral Formula 2.0**: (Emotional Value^2 + Utility + Entertainment) × Propagation × Algorithm Fit.
    - **Content Strategy**:
      - "Golden 3 Seconds": Must hook immediately to boost Completion Rate.
      - "Rhythm": High point every 15s.
      - "Interaction": Explicitly guide Likes/Comments.
  `,
  '小红书 (Red)': `
    **PLATFORM: XIAOHONGSHU (RED)**
    - **Core Algorithm**: CES (Community Engagement Score).
    - **CES Formula**: Σ(CTR×0.2 + Interaction×0.3 + Completion×0.25 + Collect×0.15 + Share×0.1).
    - **Key Metrics**: CTR (>10% is excellent), "Collection" (Save) rate is vital for value.
    - **Content Strategy**:
      - **KFS Model**: Keywords (Search) + Feeds (Home) + Search (Long tail).
      - **Visuals**: Cover Image is 40% of success. Aesthetic is non-negotiable.
      - **Value**: Must provide "Utility" or "Emotional Resonance". Authentic "Seeding" (Zhongcao).
  `,
  '视频号 (WeChat)': `
    **PLATFORM: WECHAT VIDEO ACCOUNT**
    - **Core Algorithm**: 60% Social Recommendation (Friends Like) + 40% Interest.
    - **Key Metrics**: Share to Moments, Friend Likes, Stay Duration.
    - **Viral Formula**: Score = Metrics × Social Weight × Time Decay.
    - **Content Strategy**:
      - **Social Currency**: Content worth sharing to represent one's identity/taste.
      - **Private Traffic**: Strong link to WeChat Groups/Official Accounts.
      - **Tone**: More mature, "Useful/Interesting/Relatable", Emotional connection.
  `,
  'YouTube Shorts': `
    **PLATFORM: YOUTUBE SHORTS**
    - **Core Algorithm**: Interest Graph + Search.
    - **Key Metrics**: Average Percentage Viewed (APV) > 100%, Swipe-away rate.
    - **Content Strategy**: Looping capability, SEO/Search discovery, Fast pacing.
  `
};

/**
 * REFACTORED: Analyze Viral Angles based on "4.1.1 The 4 Psychological Drivers of Following"
 * This forces the AI to think in the specific dimensions defined in the PDF.
 */
export const analyzeViralAngles = async (topic: string): Promise<ViralAngle[]> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      You are a specialized Short Video Growth Strategist using the "Systematic Growth Methodology".
      Topic: "${topic}"
      
      Task: Generate exactly 4 distinct video angles. Each angle MUST correspond to one of the "4 Psychological Drivers of Following Behavior" (Chapter 4.1.1).

      **Driver 1: Emotional Value (Joy/Entertainment)**
      - Formula: Joy = (Unexpectedness + Fun + Ease) × Emotional Contagion
      - Goal: Dopamine release, stress relief.
      - Types: Funny, Cute, Talent, Creative.

      **Driver 2: Emotional Connection (Resonance)**
      - Formula: Resonance = Shared Experience × Emotional Intensity × Expression Precision
      - Goal: "That is so me", Empathy, Identity.
      - Types: Workplace struggles, Relationships, Social anxiety, Family.

      **Driver 3: Cognitive Value (Knowledge/Utility)**
      - Formula: Perceived Value = (New Info × Utility × Ease) / Learning Cost
      - Goal: "Useful", "Collection worthy".
      - Types: Life hacks, Skill up, Industry insights, Deep dive.

      **Driver 4: Sensory Impact (Awe)**
      - Formula: Awe = Visual Shock + Audio Pleasure + Scarcity + Challenge
      - Goal: "Wow moment", Visual feast.
      - Types: Visual aesthetics, Extreme skills, Counter-intuitive transformations.

      Output 4 angles (one for each driver) in JSON.
      Language: Simplified Chinese (简体中文).
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        angles: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              whyItWorks: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              viralScore: { type: Type.NUMBER }
            },
            required: ["id", "title", "description", "whyItWorks", "difficulty", "viralScore"]
          }
        }
      }
    };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const parsed = JSON.parse(jsonText);
    return parsed.angles || [];

  } catch (error) {
    console.error("Error analyzing viral angles:", error);
    throw new Error("Failed to analyze viral angles.");
  }
};

// ... [Keep searchInspiration unchanged] ...
export const searchInspiration = async (topic: string): Promise<{ summary: string; sources: GroundingSource[] }> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model,
      contents: `Search for trending information, news, or popular opinions related to: "${topic}". 
      Summarize key points that would make good short video content.
      IMPORTANT: Respond in Simplified Chinese (简体中文).`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = response.text || "暂无摘要可用。";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = chunks
      .map(chunk => chunk.web)
      .filter(web => web !== undefined && web !== null)
      .map(web => ({
        title: web.title || 'Source',
        uri: web.uri || '#',
      }));

    return { summary, sources };
  } catch (error) {
    console.warn("Search failed, proceeding without grounding:", error);
    return { summary: "No search results available.", sources: [] };
  }
};

/**
 * UPDATED: Generate Video Plan using Platform-Specific Methodologies
 */
export const generateVideoPlan = async (
  topic: string, 
  selectedAngle: ViralAngle,
  userTone: string = "像朋友聊天 (Conversational)", 
  platform: string = "抖音 (Douyin)",
  duration: string = "Medium", // New Parameter: Short, Medium, Long
  creatorProfile?: CreatorProfile
): Promise<{ plan: VideoPlan; inspiration: { summary: string; sources: GroundingSource[] } }> => {
  try {
    const inspirationData = await searchInspiration(topic);
    const ai = getAI();
    const model = 'gemini-2.5-flash';

    // Construct profile context string
    let profileContext = "";
    if (creatorProfile) {
        profileContext = `
        **CREATOR PERSONA (IP Strategy)**:
        - Niche: ${creatorProfile.niche}
        - Persona: ${creatorProfile.persona}
        - Audience: ${creatorProfile.targetAudience}
        - Goal: ${creatorProfile.contentGoal}
        `;
    }

    // Define Duration Strategy
    let durationGuide = "";
    if (duration === 'Short') {
        durationGuide = `**TARGET DURATION: Short (15-30 seconds)**. 
        - Strategy: High density, fast pacing. ONE main point only.
        - Word Count: Approx 100-140 words (Chinese).
        - Structure: Hook (3s) -> Core Value (15s) -> CTA (5s).`;
    } else if (duration === 'Long') {
        durationGuide = `**TARGET DURATION: Long (60+ seconds)**. 
        - Strategy: In-depth storytelling or education. "Gold Pyramid" structure.
        - Word Count: Approx 250-400 words (Chinese).
        - Structure: Hook -> Context -> Main Point 1 -> Main Point 2 -> Conclusion/CTA.`;
    } else {
        durationGuide = `**TARGET DURATION: Medium (30-60 seconds)**. 
        - Strategy: Standard viral structure.
        - Word Count: Approx 150-250 words (Chinese).
        - Structure: User Attention Decision Path (1s-3s-10s-End).`;
    }

    // Select Platform Strategy
    const platformStrategy = PLATFORM_STRATEGIES[platform] || PLATFORM_STRATEGIES['抖音 (Douyin)'];

    const prompt = `
      Act as a Senior Content Strategist for ${platform}.
      
      ${platformStrategy}
      
      ${durationGuide}

      **TOPIC**: "${topic}"
      **ANGLE**: "${selectedAngle.title}" (${selectedAngle.whyItWorks})
      **CONTEXT**: "${inspirationData.summary}"
      ${profileContext}

      **CORE TASK**: Write a detailed video plan optimized for ${platform}'s specific algorithm AND the target duration.

      **1. DATA STRATEGY (The 1s-3s-10s-End Path)**:
      - **1s (Visual Attraction)**: How to STOP the scroll? (Cover/Title logic specific to ${platform}).
      - **3s (Value Hook)**: The immediate reason to watch.
      - **10s (Emotional Trigger)**: Prevention of drop-off.
      - **Ending (Interaction)**: Specific trigger based on platform (e.g., Douyin=Comments, WeChat=Share/Friends, XHS=Collect/Save).

      **2. SCRIPT & CONTENT**:
      - Tone: ${userTone}.
      - **CRITICAL**: The script length MUST match the target duration (${duration}). Don't write a long essay for a short video.
      - **IF XIAOHONGSHU**: Focus on "Authenticity", "KFS Keywords", and "Value Density" (make it save-worthy).
      - **IF DOUYIN**: Focus on "Rhythm", "Reversal", and "Completion Rate".
      - **IF WECHAT**: Focus on "Social Currency" and "Relatability".
      
      **3. INTERACTION STRATEGY (Optimization Target: High Engagement)**:
      - **Pinned Comment**: Don't just summarize. Create a "God-tier Comment" (神评) that is witty, controversial, or provokes debate.
      - **Engagement Question**: Don't ask "What do you think?". Ask a specific, low-threshold question that 90% of the audience wants to answer about *themselves*.
      - **Negative Feedback**: Provide a witty, high-EQ comeback to a likely hate comment (the "Roast back" strategy).

      Output JSON in Simplified Chinese.
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        script: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            body: { type: Type.STRING },
            cta: { type: Type.STRING },
            tone: { type: Type.STRING }
          },
          required: ["title", "hook", "body", "cta", "tone"]
        },
        dataStrategy: {
          type: Type.OBJECT,
          properties: {
            visualAttraction_1s: { type: Type.STRING, description: `Strategy for 1s (Visual/Cover) optimized for ${platform}` },
            valueHook_3s: { type: Type.STRING, description: "Strategy for 3s (Hook)" },
            emotionalTrigger_10s: { type: Type.STRING, description: "Strategy for 10s (Retention)" },
            interactionDesign_end: { type: Type.STRING, description: `Ending Strategy optimized for ${platform} metrics` }
          },
          required: ["visualAttraction_1s", "valueHook_3s", "emotionalTrigger_10s", "interactionDesign_end"]
        },
        shotList: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              duration: { type: Type.STRING },
              isBroll: { type: Type.BOOLEAN },
              audioCue: { type: Type.STRING }
            },
            required: ["id", "type", "description", "duration", "isBroll", "audioCue"]
          }
        },
        editing: {
          type: Type.OBJECT,
          properties: {
            pacing: { type: Type.STRING },
            visualStyle: { type: Type.STRING },
            soundDesign: { type: Type.STRING },
            transitions: { type: Type.STRING }
          },
          required: ["pacing", "visualStyle", "soundDesign", "transitions"]
        },
        publishing: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedMusic: { type: Type.STRING },
            musicKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            thumbnailIdea: { type: Type.STRING }
          },
          required: ["caption", "hashtags", "suggestedMusic", "musicKeywords", "thumbnailIdea"]
        },
        interaction: {
          type: Type.OBJECT,
          properties: {
            pinnedComment: { type: Type.STRING, description: "Witty, controversial, or debate-provoking comment" },
            engagementQuestion: { type: Type.STRING, description: "Specific, easy-to-answer question about the user" },
            negativeFeedbackHandling: { type: Type.STRING, description: "High-EQ or witty comeback to potential hate" }
          },
          required: ["pinnedComment", "engagementQuestion", "negativeFeedbackHandling"]
        }
      },
      required: ["script", "dataStrategy", "shotList", "editing", "publishing", "interaction"]
    };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const plan = JSON.parse(jsonText) as VideoPlan;
    // Inject the platform into the plan object for future reference
    plan.platform = platform;
    
    return { plan, inspiration: inspirationData };

  } catch (error) {
    console.error("Error generating plan:", error);
    throw new Error("Failed to generate video plan.");
  }
};

/**
 * UPDATED: Viral Diagnostics with Platform-Specific Simulation
 */
export const analyzeScriptPotential = async (
  plan: VideoPlan, 
  creatorProfile?: CreatorProfile
): Promise<ViralDiagnostics> => {
  try {
    const ai = getAI();
    const model = 'gemini-3-pro-preview';
    
    let audienceContext = "General Audience";
    if (creatorProfile) {
        audienceContext = `
        Target Audience: ${creatorProfile.targetAudience}
        Niche: ${creatorProfile.niche}
        Persona: ${creatorProfile.persona}
        `;
    }

    const platform = plan.platform || '抖音 (Douyin)';
    const strategyContext = PLATFORM_STRATEGIES[platform] || PLATFORM_STRATEGIES['抖音 (Douyin)'];

    const prompt = `
      You are the **${platform} Algorithm Simulator**.
      
      ${strategyContext}

      **TASK**: Evaluate this video plan against ${platform}'s specific success metrics.

      **CONTENT**:
      - Title: "${plan.script.title}"
      - Hook: "${plan.shotList[0]?.description} / ${plan.script.hook}"
      - Body: "${plan.script.body}"
      - Strategy: 1s: ${plan.dataStrategy.visualAttraction_1s}, 3s: ${plan.dataStrategy.valueHook_3s}

      **CONTEXT**: ${audienceContext}

      **SCORING (0-100)** based on Platform Priorities:
      
      1. **Visual Attraction (1s)**: 
         - Douyin: Does it stop the scroll instantly? 
         - XHS: Is the cover aesthetic/clickable (CTR)?
         - WeChat: Is it relatable?
      2. **Value Proposition (3s)**: 
         - Is the value immediately clear? (Hook strength)
      3. **Emotional Resonance (10s+)**: 
         - Douyin: Completion rate / Rhythm. 
         - XHS: "Collection" value (Information density).
         - WeChat: Social Currency (Identity expression).
      4. **Interaction Potential**: 
         - Comments/Shares/Saves based on platform habits.

      Output JSON with scores (0-100) and actionable advice specific to ${platform}.
      IMPORTANT: The 'analysis' and 'suggestions' fields MUST be in Simplified Chinese (简体中文).
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        overallScore: { type: Type.NUMBER, description: "0-100" },
        metrics: {
            type: Type.OBJECT,
            properties: {
                visualAttraction: { type: Type.NUMBER, description: `Score for ${platform} Visual/Cover` },
                valueProposition: { type: Type.NUMBER, description: "Score for Hook/Value" },
                emotionalResonance: { type: Type.NUMBER, description: `Score for Retention/Collection/Share` },
                interactionPotential: { type: Type.NUMBER, description: "Score for Engagement" },
            },
            required: ["visualAttraction", "valueProposition", "emotionalResonance", "interactionPotential"]
        },
        analysis: { type: Type.STRING },
        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["overallScore", "metrics", "analysis", "suggestions"]
    };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Analysis failed");
    return JSON.parse(jsonText) as ViralDiagnostics;
  } catch (error) {
    console.error("Diagnostics error", error);
    throw error;
  }
}

/**
 * NEW: Script Audit (Doctor) Function
 */
export const runScriptAudit = async (script: VideoScript): Promise<ScriptAuditResult> => {
  try {
    const ai = getAI();
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      You are a professional Script Doctor and Copywriting Expert.
      
      Task: Audit the following short video script for writing quality.
      
      **Script Content**:
      - Title: "${script.title}"
      - Hook: "${script.hook}"
      - Body: "${script.body}"
      - CTA: "${script.cta}"
      
      **Evaluation Criteria (0-100)**:
      1. **Clarity (清晰度)**: Is the message simple, direct, and easy to understand? No jargon?
      2. **Flow (流畅度)**: Does it read smoothly? Is the rhythm good for spoken audio?
      3. **Engagement (吸引力)**: Is the language vivid? Does it provoke emotion or curiosity?
      
      Output JSON in Simplified Chinese (简体中文).
    `;

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        scores: {
          type: Type.OBJECT,
          properties: {
            clarity: { type: Type.NUMBER },
            flow: { type: Type.NUMBER },
            engagement: { type: Type.NUMBER }
          },
          required: ["clarity", "flow", "engagement"]
        },
        critique: { type: Type.STRING, description: "One paragraph overall assessment." },
        suggestions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-4 specific actionable bullet points to improve the text."
        }
      },
      required: ["scores", "critique", "suggestions"]
    };

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Audit failed");
    return JSON.parse(jsonText) as ScriptAuditResult;

  } catch (error) {
    console.error("Script audit error", error);
    throw error;
  }
};

// ... [Keep other functions generateShotImage, generateThumbnail, etc. unchanged] ...
export const generateShotImage = async (
    description: string, 
    visualStyle: string, 
    referenceImageBase64?: string
): Promise<string> => {
    try {
      const ai = getAI();
      const model = 'gemini-2.5-flash-image';
      
      const parts: any[] = [];
      
      if (referenceImageBase64) {
          const base64Data = referenceImageBase64.split(',')[1] || referenceImageBase64;
          parts.push({
              inlineData: {
                  mimeType: 'image/jpeg', 
                  data: base64Data
              }
          });
      }

      const textPrompt = `
        Generate a photorealistic image for a video scene.
        VISUAL DESCRIPTION: ${description}
        STYLE: ${visualStyle}
        
        NEGATIVE PROMPT: **NO TEXT**, NO CHARACTERS, NO WATERMARKS, NO SUBTITLES, NO LOGOS.
        The image must be a clean photography or cinematic shot without any text overlays.
        ${referenceImageBase64 ? '- Use the provided image as a Composition/Subject reference.' : ''}
      `;

      parts.push({ text: textPrompt });
  
      const response = await ai.models.generateContent({
        model,
        contents: { parts: parts },
        config: {
          imageConfig: {
              aspectRatio: "9:16",
          }
        }
      });
  
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data returned");
  
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  };
  
  export const generateThumbnail = async (idea: string, title: string): Promise<string> => {
    try {
      const ai = getAI();
      const model = 'gemini-2.5-flash-image';
      
      const prompt = `
        Generate a high-click-through-rate (CTR) vertical thumbnail image.
        VISUAL CONCEPT: ${idea}
        THEME/MOOD: ${title}
        STYLE: Vibrant, high contrast, expressive face or key object in focus, 4k resolution.
        aspect ratio: 3:4.
        
        NEGATIVE PROMPT: **NO TEXT**, NO CHINESE CHARACTERS, NO ENGLISH WORDS, NO TYPOGRAPHY. 
        Do not render the title text. Do not write any words. The image must be purely visual.
      `;
  
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
              aspectRatio: "3:4",
          }
        }
      });
  
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data returned");
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      throw error;
    }
  };
  
  export const generateScriptAudio = async (text: string): Promise<string> => {
    try {
      const ai = getAI();
      const model = 'gemini-2.5-flash-preview-tts';
  
      const response = await ai.models.generateContent({
          model,
          contents: [{ parts: [{ text: text }] }],
          config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                  voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Aoede' } 
                  }
              }
          }
      });
  
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data returned");
      
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      
      const wavBlob = pcmToWav(bytes, 24000); 
      return URL.createObjectURL(wavBlob);
  
    } catch (error) {
      console.error("Error generating audio:", error);
      throw error;
    }
  };
  
  function pcmToWav(pcmData: Uint8Array, sampleRate: number): Blob {
      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
      const blockAlign = (numChannels * bitsPerSample) / 8;
      const wavHeader = new ArrayBuffer(44);
      const view = new DataView(wavHeader);
  
      const writeString = (offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
          }
      };
  
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + pcmData.length, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);
      writeString(36, 'data');
      view.setUint32(40, pcmData.length, true);
  
      return new Blob([wavHeader, pcmData], { type: 'audio/wav' });
  }
  
  export const generateHookVariations = async (currentHook: string, topic: string, tone: string): Promise<HookVariation[]> => {
      try {
          const ai = getAI();
          const model = 'gemini-2.5-flash';
          
          // UPGRADED PROMPT for Viral Psychology
          const prompt = `
            You are a Viral Script Doctor specialized in the "Golden 3 Seconds" of short videos.
            
            Your Goal: Rewrite the specific Hook below into 3 significantly more engaging variations to maximize user retention.

            **Input Data**:
            - Topic: "${topic}"
            - Original Hook: "${currentHook}"
            - Tone: "${tone}"

            **Required Output**: 3 Variations based on distinct viral psychological triggers:
            
            1. **Variation A (Curiosity Gap / Reversal)**: Start with something counter-intuitive, a secret, or a "Stop doing X" command.
            2. **Variation B (Pain Point / Negative Bias)**: Focus on a common mistake, a fear of loss, or a relatable struggle. "Why your [X] isn't working."
            3. **Variation C (Direct Benefit / Authority)**: State a massive promise or result immediately. "How I got [Result] in [Time]."

            Return JSON in Simplified Chinese (简体中文).
          `;
      
          const schema: Schema = {
            type: Type.OBJECT,
            properties: {
              variations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "The strategy used (e.g., '反直觉/悬念', '痛点直击', '利益承诺')" },
                    content: { type: Type.STRING, description: "The actual hook script text" },
                    reason: { type: Type.STRING, description: "Psychological explanation of why this works" }
                  },
                  required: ["type", "content", "reason"]
                }
              }
            }
          };
      
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: schema,
            },
          });
      
          const jsonText = response.text;
          if (!jsonText) return [];
          
          const parsed = JSON.parse(jsonText);
          return parsed.variations || [];
        } catch (error) {
          console.error("Error generating hook variations:", error);
          return [];
        }
  };
  
  export const generateTitleVariations = async (topic: string, summary: string): Promise<string[]> => {
      try {
          const ai = getAI();
          const model = 'gemini-2.5-flash';
          const prompt = `
            Generate 5 distinct, high-CTR video titles for a short video about: "${topic}".
            Context: ${summary}
            Output as a simple list of strings in Simplified Chinese.
          `;
      
          const schema: Schema = {
            type: Type.OBJECT,
            properties: {
              titles: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
              }
            }
          };
      
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: schema,
            },
          });
      
          const jsonText = response.text;
          if (!jsonText) return [];
          const parsed = JSON.parse(jsonText);
          return parsed.titles || [];
        } catch (error) {
          console.error("Error generating titles:", error);
          return [];
        }
  }

  export const rewriteScriptSection = async (
    currentText: string, 
    instruction: string, 
    context: string
  ): Promise<string> => {
    try {
        const ai = getAI();
        const model = 'gemini-2.5-flash';
        const prompt = `
          Task: Rewrite the following script section based on the instruction: "${instruction}".
          Context: ${context}
          Current Text: "${currentText}"
          Return ONLY the new text. Simplified Chinese.
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });

        return response.text?.trim() || currentText;
    } catch (error) {
        console.error("Rewrite failed:", error);
        throw error;
    }
  }