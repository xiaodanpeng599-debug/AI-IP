import React, { useState, useEffect, useRef } from 'react';

interface TeleprompterProps {
  text: string;
  onClose: () => void;
}

export const Teleprompter: React.FC<TeleprompterProps> = ({ text, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fontSize, setFontSize] = useState(48);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (isPlaying) {
      const scroll = () => {
        if (scrollerRef.current) {
          scrollerRef.current.scrollTop += speed;
          if (scrollerRef.current.scrollTop + scrollerRef.current.clientHeight >= scrollerRef.current.scrollHeight) {
             setIsPlaying(false);
             return;
          }
          animationRef.current = requestAnimationFrame(scroll);
        }
      };
      animationRef.current = requestAnimationFrame(scroll);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, speed]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Controls Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 shrink-0">
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          退出
        </button>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
             <span className="text-xs text-gray-500 uppercase font-bold">字号</span>
             <button onClick={() => setFontSize(Math.max(24, fontSize - 4))} className="w-8 h-8 rounded bg-gray-800 text-white hover:bg-gray-700">-</button>
             <span className="text-white w-8 text-center">{fontSize}</span>
             <button onClick={() => setFontSize(Math.min(96, fontSize + 4))} className="w-8 h-8 rounded bg-gray-800 text-white hover:bg-gray-700">+</button>
           </div>
           
           <div className="flex items-center gap-2">
             <span className="text-xs text-gray-500 uppercase font-bold">速度</span>
             <button onClick={() => setSpeed(Math.max(0.5, speed - 0.5))} className="w-8 h-8 rounded bg-gray-800 text-white hover:bg-gray-700">-</button>
             <span className="text-white w-8 text-center">{speed}</span>
             <button onClick={() => setSpeed(Math.min(10, speed + 0.5))} className="w-8 h-8 rounded bg-gray-800 text-white hover:bg-gray-700">+</button>
           </div>
        </div>
      </div>

      {/* Prompter Area */}
      <div className="relative flex-1 overflow-hidden group">
         {/* Mirror Guidelines */}
         <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-red-500/30 z-10 pointer-events-none"></div>
         <div className="absolute left-1/2 top-4 bottom-4 w-0 border-l-2 border-red-500/10 z-10 pointer-events-none"></div>

         <div 
           ref={scrollerRef}
           className="h-full overflow-y-scroll no-scrollbar px-8 md:px-32 py-[50vh] text-center"
           onClick={() => setIsPlaying(!isPlaying)}
         >
           <p 
             className="text-white font-bold leading-relaxed whitespace-pre-wrap transition-all duration-300"
             style={{ fontSize: `${fontSize}px` }}
           >
             {text}
           </p>
         </div>
      </div>

      {/* Play/Pause Footer Overlay */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isPlaying ? (
             <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          ) : (
             <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
          )}
        </button>
      </div>
    </div>
  );
};