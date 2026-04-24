import React, { useState } from 'react';
import { X, Shirt, Trash2 } from 'lucide-react';

const SquadManagementModal = ({ director, squad, onAdd, onRemove, onClose }) => {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPosition, setNewPlayerPosition] = useState("FWD");

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    onAdd(newPlayerName, newPlayerPosition);
    setNewPlayerName("");
    setNewPlayerPosition("FWD");
  };

  return (
    <div className="font-mono fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80  p-0 md:p-4 animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
      <div className="font-mono bg-white border border-2 border-black w-full max-w-md rounded-none-2xl md:rounded-none overflow-hidden shadow-none" onClick={e => e.stopPropagation()}>
        
        <div className="font-mono bg-white p-6 border-b border-2 border-black flex justify-between items-center">
          <div>
            <h2 className="font-mono text-lg font-bold text-black flex items-center gap-2">
              <Shirt size={20} className="font-mono text-black" />
              Manage Department
            </h2>
            <p className="font-mono text-sm text-black">{director.team} ({director.name})</p>
          </div>
          <button onClick={onClose} className="font-mono text-black hover:text-black"><X size={20} /></button>
        </div>

        <div className="font-mono p-6 space-y-6">
          
          <form onSubmit={handleAddSubmit} className="font-mono flex gap-2">
            <input 
              type="text" 
              placeholder="Name..." 
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="font-mono flex-1 bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
              autoFocus
            />
            <select 
              value={newPlayerPosition}
              onChange={(e) => setNewPlayerPosition(e.target.value)}
              className="font-mono bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
            >
              <option value="FWD">FWD</option>
              <option value="MID">MID</option>
              <option value="DEF">DEF</option>
              <option value="CEO">CEO</option>
            </select>
            <button type="submit" className="font-mono bg-black text-white hover:bg-white hover:text-black border-2 border-black  text-black font-bold px-4 py-2 rounded-none text-sm">
              Add
            </button>
          </form>

          <div className="font-mono space-y-2 max-h-60 overflow-y-auto pr-2">
            <h3 className="font-mono text-xs font-bold text-black uppercase tracking-wider mb-2">Current Roster</h3>
            {squad.length === 0 ? (
              <div className="font-mono text-center py-4 text-black italic text-sm">No players in squad yet.</div>
            ) : (
              squad.map(p => (
                <div key={p.id} className="font-mono flex justify-between items-center bg-white p-3 rounded-none border border-2 border-black group">
                  <div className="font-mono flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.position === 'FWD' ? 'bg-red-500/20 text-red-400' : p.position === 'MID' ? 'bg-white text-black' : p.position === 'DEF' ? 'bg-white text-black' : 'bg-purple-500/20 text-purple-400'}`}>
                      {p.position}
                    </span>
                    <span className="font-mono text-sm font-bold text-black">{p.name}</span>
                  </div>
                  <div className="font-mono flex items-center gap-3">
                    <span className="font-mono text-xs text-black">{p.goals}G</span>
                    <button 
                      onClick={() => onRemove(p.id)}
                      className="font-mono text-black hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove Player"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquadManagementModal;
