import React, { useState, useEffect, useRef } from 'react';

const IDLE_TIMEOUT_MS = 6000;
const DECAY_INTERVAL_MS = 60;

export default function ProductivityEnforcer() {
  const [productivityLevel, setProductivityLevel] = useState(100);
  const [isLocked, setIsLocked] = useState(false);
  const [confession, setConfession] = useState('');
  const lastActiveRef = useRef(Date.now());

  useEffect(() => {
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
      if (!isLocked) setProductivityLevel(100);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [isLocked]);

  useEffect(() => {
    if (isLocked) return;

    const decayInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActiveRef.current;
      
      const newLevel = Math.max(0, 100 - (idleTime / IDLE_TIMEOUT_MS) * 100);
      setProductivityLevel(newLevel);

      if (newLevel === 0) {
        setIsLocked(true);
      }
    }, DECAY_INTERVAL_MS);

    return () => clearInterval(decayInterval);
  }, [isLocked]);

  const handleConfessionChange = (e) => {
    setConfession(e.target.value);
    if (e.target.value === "I am a dedicated synergy-multiplier") {
      setIsLocked(false);
      setProductivityLevel(100);
      setConfession('');
      lastActiveRef.current = Date.now();
    }
  };

  return (
    <>
       <div className="fixed top-[60px] left-0 w-full h-3 z-50 bg-black overflow-hidden shadow-lg border-b-2 border-black">
        <div 
          className="h-full bg-red-500 transition-all duration-75"
          style={{ 
            width: `${productivityLevel}%`,
            backgroundColor: productivityLevel > 50 ? '#22c55e' : productivityLevel > 20 ? '#eab308' : '#ef4444'
          }}
        />
      </div>

      {isLocked && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-red-500 border-4 border-white w-full max-w-2xl shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] p-8">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
              PRODUCTIVITY LAPSE DETECTED
            </h2>
            <div className="bg-white p-6 border-4 border-black">
              <p className="text-lg font-bold uppercase mb-2">Idle Time Threshold Exceeded (6.0s)</p>
              <p className="text-black font-mono mb-6">
                Corporate monitoring systems have flagged your terminal for non-productive idling. 
                Please reaffirm your commitment to the enterprise to restore access.
              </p>
              
              <div className="space-y-2">
                <label className="block font-black uppercase text-sm text-gray-600">
                  Type the following exactly to unlock:
                </label>
                <div className="bg-yellow-200 border-2 border-black p-4 font-mono font-bold text-center text-lg mb-4 select-none">
                  I am a dedicated synergy-multiplier
                </div>
                
                <input
                  type="text"
                  value={confession}
                  onChange={handleConfessionChange}
                  placeholder="Type here..."
                  autoFocus
                  spellCheck="false"
                  className="w-full text-xl p-4 border-4 border-black focus:outline-none focus:ring-4 focus:ring-red-500 transition-all uppercase placeholder:italic"
                />
              </div>
            </div>
            
            <p className="text-white font-bold mt-4 text-center uppercase tracking-widest animate-pulse">
              System access restricted until compliance verified
            </p>
          </div>
        </div>
      )}
    </>
  );
}