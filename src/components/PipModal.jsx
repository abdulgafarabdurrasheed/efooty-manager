import React from 'react';
import { AlertTriangle, X, Bot, Activity } from 'lucide-react';

export default function PipModal({ player, onClose }) {
  if (!player) return null;

  return (
    <div className="font-mono fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300">
      <div className="bg-white border-4 border-red-600 w-full max-w-lg shadow-[12px_12px_0px_rgba(220,38,38,1)] flex flex-col relative">
        
        <div className="bg-red-600 text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2 font-black uppercase text-xl tracking-tight">
            <AlertTriangle className="animate-pulse" />
            Mandatory P.I.P. Initiated
          </div>
          <button onClick={onClose} className="hover:bg-white hover:text-red-600 p-1 border-2 border-transparent hover:border-black transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6 border-b-2 border-black pb-4 text-center">
            <h3 className="text-3xl font-black uppercase tracking-tighter text-black">{player.name}</h3>
            <p className="font-bold text-red-600 uppercase tracking-widest mt-1">Status: Unacceptable Yield Deficit</p>
            <p className="font-bold text-black mt-2 bg-gray-100 border-2 border-black inline-block px-4 py-2">
              Deficit: {player.goalsDifference} YLD
            </p>
          </div>

          <div className="bg-black text-green-400 p-4 border-2 border-black relative">
            <Bot className="absolute top-4 right-4 opacity-20 text-white" size={40} />
            <p className="text-xs uppercase text-white mb-2 font-bold flex items-center gap-2">
              <Activity size={14} /> AI Oracle Recovery Plan
            </p>
            <ul className="text-sm space-y-3 font-bold mt-4 relative z-10 opacity-90">
              <li>&gt; <span className="text-white">PHASE 1:</span> Halt all unstructured synergy ops. Focus exclusively on backlogged high-yield sprint deliverables.</li>
              <li>&gt; <span className="text-white">PHASE 2:</span> Increase mandatory async standups to 3x daily. Document all blockers.</li>
              <li>&gt; <span className="text-white">PHASE 3:</span> Neutralize deficit within 14 days or face immediate pod reassignment.</li>
            </ul>
          </div>

          <button onClick={onClose} className="w-full mt-6 bg-red-600 text-white border-2 border-black font-black uppercase py-4 hover:bg-black transition-colors">
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}