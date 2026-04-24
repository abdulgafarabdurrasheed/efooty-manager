import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

const GoalAssignmentModal = ({ matchData, homeSquad, awaySquad, onConfirm, onSkip, onCancel }) => {
  const homeKPIsCount = matchData.hScore;
  const awayKPIsCount = matchData.aScore;
  
  const [assignments, setAssignments] = useState({});

  const handleAssignmentChange = (team, index, type, value) => {
    const key = `${team}_${index}`;
    setAssignments(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [type]: value
      }
    }));
  };

  const handleSubmit = () => {
    onConfirm(assignments);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90  p-0 md:p-4 animate-in fade-in duration-200" onClick={onCancel}>
      <div className="bg-white border border-2 border-black rounded-none-2xl md:rounded-none w-full max-w-2xl overflow-hidden shadow-none flex flex-col h-[85vh] md:h-auto md:max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-2 border-black bg-white flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <CheckCircle2 className="text-green-500" />
              Match Result Logged!
            </h2>
            <p className="text-black text-sm mt-1">
              Now, who delivered the outcomes? ({matchData.hScore} - {matchData.aScore})
            </p>
          </div>
          <button onClick={onCancel} className="text-black hover:text-black transition-colors p-1" title="Cancel & Close">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {homeKPIsCount > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-black font-bold uppercase tracking-wider text-sm border-b border-2 border-black pb-2">
                <span>{matchData.homeName} KPIs</span>
              </div>
              {homeSquad.length === 0 ? (
                <div className="p-3 rounded-none bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  No allocated resources found for {matchData.homeName}. 
                  <br/><span className="text-xs opacity-75">Ensure the director has built their pod.</span>
                </div>
              ) : (
                Array.from({ length: homeKPIsCount }).map((_, i) => (
                  <div key={`home-${i}`} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-none border border-2 border-black">
                    <span className="bg-white text-black px-2 py-1 rounded text-xs font-mono">Goal {i+1}</span>
                    <select 
                      className="flex-1 bg-white border border-2 border-black rounded px-3 py-2 text-black text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                      onChange={(e) => handleAssignmentChange('home', i, 'scorer', e.target.value)}
                    >
                      <option value="">Select Scorer...</option>
                      {homeSquad.map(p => (
                        <option key={p.id} value={p.id} disabled={assignments[`home_${i}`]?.assist === p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select 
                      className="flex-1 bg-white border border-2 border-black rounded px-3 py-2 text-black text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                      onChange={(e) => handleAssignmentChange('home', i, 'assist', e.target.value)}
                    >
                      <option value="">Assist (Optional)...</option>
                      {homeSquad.map(p => (
                        <option key={p.id} value={p.id} disabled={assignments[`home_${i}`]?.scorer === p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          )}

          {awayKPIsCount > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-500 font-bold uppercase tracking-wider text-sm border-b border-2 border-black pb-2">
                <span>{matchData.awayName} KPIs</span>
              </div>
              {awaySquad.length === 0 ? (
                <div className="p-3 rounded-none bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  No allocated resources found for {matchData.awayName}. 
                  <br/><span className="text-xs opacity-75">Ensure the director has built their pod.</span>
                </div>
              ) : (
                Array.from({ length: awayKPIsCount }).map((_, i) => (
                  <div key={`away-${i}`} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-none border border-2 border-black">
                    <span className="bg-white text-black px-2 py-1 rounded text-xs font-mono">Goal {i+1}</span>
                    <select 
                      className="flex-1 bg-white border border-2 border-black rounded px-3 py-2 text-black text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                      onChange={(e) => handleAssignmentChange('away', i, 'scorer', e.target.value)}
                    >
                      <option value="">Select Scorer...</option>
                      {awaySquad.map(p => (
                        <option key={p.id} value={p.id} disabled={assignments[`away_${i}`]?.assist === p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select 
                      className="flex-1 bg-white border border-2 border-black rounded px-3 py-2 text-black text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                      onChange={(e) => handleAssignmentChange('away', i, 'assist', e.target.value)}
                    >
                      <option value="">Assist (Optional)...</option>
                      {awaySquad.map(p => (
                        <option key={p.id} value={p.id} disabled={assignments[`away_${i}`]?.scorer === p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </div>
          )}

          {homeKPIsCount === 0 && awayKPIsCount === 0 && (
            <div className="text-center text-black py-4">
              It was a Nil-Nil! No outcomes to attribute.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-2 border-black bg-white flex justify-end gap-3">
          <button onClick={onSkip} className="px-4 py-2 text-black hover:text-black font-medium transition-colors">Skip Details</button>
          <button 
            onClick={handleSubmit} 
            className="
              relative overflow-hidden group bg-green-600 text-black font-black py-2 px-6 rounded-none shadow-none 
              transform transition-all duration-100 
              hover:bg-green-500 hover:scale-105 hover:shadow-none/40 
              active:scale-95 active:shadow-none
            "
          >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
            <span className="relative z-20">Save Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalAssignmentModal;
