import React, { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getH2HStats } from '../utils/analytics';

const ScoreEntryModal = ({ isOpen, match, onClose, onConfirm, matches = [] }) => {
  const [hScore, setHScore] = useState("");
  const [aScore, setAScore] = useState("");

  const h2h = useMemo(() => {
    if (!match) return null;
    const homeId = match.homeId || match.home?.id;
    const awayId = match.awayId || match.away?.id;
    if (!homeId || !awayId) return null;
    return getH2HStats(homeId, awayId, matches);
  }, [match, matches]);

  useEffect(() => {
    if (isOpen && match) {
        const timer = setTimeout(() => {
            setHScore(match.hScore !== undefined ? match.hScore : "");
            setAScore(match.aScore !== undefined ? match.aScore : "");
        }, 0);
        return () => clearTimeout(timer);
    }
  }, [isOpen, match]);

  if (!isOpen || !match) return null;

  const handleSubmit = (e) => {
      e.preventDefault();
      if (hScore === "" || aScore === "") return;
      onConfirm(match, hScore, aScore);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90  p-0 md:p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white border border-2 border-black rounded-none-2xl md:rounded-none w-full max-w-md overflow-hidden shadow-none" onClick={e => e.stopPropagation()}>
        <div className="p-6">
            <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
                <Plus className="text-green-500" size={20} />
                Log Sprint Record
            </h3>

            {h2h && h2h.total > 0 && (
                <div className="mb-6 bg-white p-3 rounded-none border border-2 border-black text-sm text-black flex items-start gap-2">
                    <span className="mt-0.5">⚔️</span>
                    <div>
                        <span className="font-bold text-black uppercase text-xs tracking-wider">Head to Head</span>
                        <div className="text-black">
                            {match.homeName || "Home"} <span className="text-green-400 font-bold">{h2h.p1Wins}</span> - <span className="text-green-400 font-bold">{h2h.p2Wins}</span> {match.awayName || "Away"}
                        </div>
                        <div className="text-xs text-black">{h2h.draws} draws in {h2h.total} meetings</div>
                    </div>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-2 text-center">
                        <div className="text-sm font-bold text-black truncate">{match.homeName || match.home?.name || "Home"}</div>
                        <input 
                            type="number" 
                            min="0" 
                            value={hScore} 
                            onChange={(e) => setHScore(e.target.value)} 
                            className="w-full bg-white border border-2 border-black rounded-none p-3 text-black font-mono text-center text-xl outline-none focus:ring-2 focus:ring-green-500"
                            autoFocus
                        />
                    </div>

                    <div className="text-black font-bold pt-6">VS</div>

                    <div className="flex-1 space-y-2 text-center">
                        <div className="text-sm font-bold text-black truncate">{match.awayName || match.away?.name || "Away"}</div>
                        <input 
                            type="number" 
                            min="0" 
                            value={aScore} 
                            onChange={(e) => setAScore(e.target.value)} 
                            className="w-full bg-white border border-2 border-black rounded-none p-3 text-black font-mono text-center text-xl outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 rounded-none font-bold text-black hover:bg-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 bg-green-600 hover:bg-green-500 text-black font-bold py-3 rounded-none transition-all shadow-none shadow-none/20"
                    >
                        Next
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ScoreEntryModal;
