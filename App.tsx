import React, { useState, useCallback } from 'react';
import Wheel from './components/Wheel';
import Confetti from './components/Confetti';
import { WheelItem, AppStatus } from './types';
import { DEFAULT_ITEMS, WHEEL_COLORS } from './constants';
import { generateWheelItems } from './services/geminiService';

// Icons
const SparklesIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 3.214L13 21l-2.286-6.857L5 12l5.714-3.214L13 3z" /></svg>
);
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);

const App: React.FC = () => {
  const [items, setItems] = useState<WheelItem[]>(DEFAULT_ITEMS);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  
  // Input states
  const [newItemLabel, setNewItemLabel] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSpin = useCallback(() => {
    if (status === AppStatus.SPINNING || items.length < 2) return;

    setStatus(AppStatus.SPINNING);
    setWinner(null);
    setErrorMsg('');

    // Calculate a random rotation
    // 5 to 10 full spins (360 * 5 to 360 * 10) + random offset
    const spins = 360 * (5 + Math.floor(Math.random() * 5));
    const randomDegree = Math.floor(Math.random() * 360);
    const newRotation = rotation + spins + randomDegree;
    
    setRotation(newRotation);
  }, [rotation, items.length, status]);

  const handleSpinEnd = useCallback(() => {
    // Determine winner based on rotation
    // 0 degrees at top (due to CSS rotation), but we rotated SVG -90deg.
    // To simplify: The pointer is effectively at 0deg in the visual CSS transform logic if we didn't have offsets.
    // The wheel rotates Clockwise. 
    // The item at the Pointer (Top) is the one that corresponds to angle: (360 - (rotation % 360))
    
    const normalizedRotation = rotation % 360;
    const pointerAngle = (360 - normalizedRotation) % 360;
    
    const sliceAngle = 360 / items.length;
    const winningIndex = Math.floor(pointerAngle / sliceAngle);
    
    // Because of our SVG construction loop order vs visual clockwise rotation:
    // We need to be careful. SVG arc construction usually goes clockwise.
    // If wheel rotates CW, pointer moves CCW relative to wheel.
    // Let's rely on visual testing, but standard logic: 
    // index 0 is usually at [0, slice] degrees. 
    // If pointer is at Angle X, it hits index floor(X / slice).
    
    const winningItem = items[winningIndex];
    
    setWinner(winningItem);
    setStatus(AppStatus.SHOWING_RESULT);
  }, [rotation, items]);

  const addItem = () => {
    if (!newItemLabel.trim()) return;
    const newItem: WheelItem = {
      id: Date.now().toString(),
      label: newItemLabel.trim(),
      color: WHEEL_COLORS[items.length % WHEEL_COLORS.length]
    };
    setItems([...items, newItem]);
    setNewItemLabel('');
  };

  const removeItem = (id: string) => {
    if (items.length <= 2) {
      setErrorMsg("Keep at least 2 items!");
      return;
    }
    setItems(items.filter(i => i.id !== id));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    if (!process.env.API_KEY) {
      setErrorMsg("Gemini API Key not found.");
      return;
    }

    setStatus(AppStatus.GENERATING_ITEMS);
    setErrorMsg('');
    
    try {
      const generatedItems = await generateWheelItems(aiPrompt);
      if (generatedItems.length > 0) {
        setItems(generatedItems);
        setAiPrompt('');
      } else {
        setErrorMsg("Couldn't generate items. Try a different topic.");
      }
    } catch (e) {
      setErrorMsg("AI Generation failed. Check your connection or key.");
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden relative">
      {status === AppStatus.SHOWING_RESULT && <Confetti />}

      {/* Sidebar / Controls */}
      <div className="w-full md:w-1/3 bg-slate-800 p-6 flex flex-col gap-8 overflow-y-auto z-10 shadow-xl border-r border-slate-700">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-yellow-500 mb-2">
            Spin & Win
          </h1>
          <p className="text-slate-400 text-sm">Customize your wheel or use AI.</p>
        </div>

        {/* AI Generator Section */}
        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            ✨ AI Theme Generator
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Dinner ideas, Workout exercises..."
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none transition"
              onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            />
            <button 
              onClick={handleAiGenerate}
              disabled={status === AppStatus.GENERATING_ITEMS}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white p-2 rounded-lg disabled:opacity-50 transition"
            >
              {status === AppStatus.GENERATING_ITEMS ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <SparklesIcon />
              )}
            </button>
          </div>
        </div>

        {/* Items List Management */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex justify-between items-end mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Wheel Items ({items.length})
            </label>
          </div>

          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              placeholder="Add item..."
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
            <button 
              onClick={addItem}
              className="bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-lg transition"
            >
              <PlusIcon />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {items.map((item) => (
              <div key={item.id} className="group flex items-center justify-between bg-slate-700/40 p-2 rounded-lg border border-transparent hover:border-slate-600 transition">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                  <span className="truncate text-sm font-medium">{item.label}</span>
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {errorMsg && (
           <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded text-center">
             {errorMsg}
           </div>
        )}

        <div className="mt-auto pt-4">
            <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="block text-center text-xs text-slate-500 hover:text-slate-400">
              Powered by Gemini API
            </a>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-4 relative">
        {/* Winner Banner */}
        <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 transform ${status === AppStatus.SHOWING_RESULT ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-10 opacity-0 scale-90'}`}>
           {winner && (
             <div className="bg-white text-slate-900 px-8 py-4 rounded-2xl shadow-2xl border-4 border-yellow-400 text-center">
               <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Winner</p>
               <h2 className="text-4xl font-black break-words max-w-md">{winner.label}</h2>
             </div>
           )}
        </div>

        <div className="relative w-full max-w-2xl flex flex-col items-center justify-center">
          <Wheel 
            items={items} 
            rotation={rotation} 
            isSpinning={status === AppStatus.SPINNING} 
            onSpinEnd={handleSpinEnd} 
          />

          <button 
            onClick={handleSpin}
            disabled={status === AppStatus.SPINNING || items.length < 2}
            className={`
              mt-12 px-12 py-4 rounded-full text-2xl font-black tracking-wider shadow-[0_0_40px_rgba(239,71,111,0.6)]
              transform transition-all duration-200
              ${status === AppStatus.SPINNING 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed scale-95' 
                : 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white hover:scale-105 active:scale-95 hover:shadow-[0_0_60px_rgba(239,71,111,0.8)]'}
            `}
          >
            {status === AppStatus.SPINNING ? 'SPINNING...' : 'SPIN!'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
