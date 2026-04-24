import React from 'react';
import { LayoutTemplate, X } from 'lucide-react';
import SquadViewer from './SquadViewer';

export default function ViewFormationModal({ 
  viewFormationId, 
  players, 
  onClose 
}) {
  if (!viewFormationId) return null;

  const director = players.find(p => p.id === viewFormationId);

  return (
    <div 
      className="font-mono fixed inset-0 z-50 flex items-center justify-center bg-black/90  p-4 animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="font-mono bg-white border border-2 border-black rounded-none w-full max-w-4xl overflow-hidden shadow-none flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="font-mono p-4 border-b border-2 border-black bg-white flex justify-between items-center">
          <h3 className="font-mono font-bold text-black flex items-center gap-2">
            <LayoutTemplate size={18} className="font-mono text-green-500" /> 
            {director?.name}'s Formation
          </h3>
          <button onClick={onClose}>
            <X size={20} className="font-mono text-black hover:text-black" />
          </button>
        </div>
        <div className="font-mono p-4 overflow-y-auto">
           <SquadViewer 
             user={{ uid: viewFormationId }}
             onSyncSquad={() => {}} 
             isEnded={true}
           />
        </div>
      </div>
    </div>
  );
}
