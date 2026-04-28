import React, { useState } from 'react';
import { AlertOctagon, Skull, ShieldAlert } from 'lucide-react';

export default function ChaosMonkeyModal({ players, onConfirm, onClose, isOpen }) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentTarget, setTargetState] = useState(null);

  React.useEffect(() => {
    console.log("ChaosMonkeyModal isOpen:", isOpen, "players length:", players?.length);
    if (isOpen && players?.length > 0) {
      const idx = Math.floor(Math.random() * players.length);
      console.log("Setting target to:", players[idx]);
      setTargetState(players[idx]);
    }
  }, [isOpen, players]);

  const handleFire = async () => {
    setIsOptimizing(true);
    if(currentTarget && onConfirm) {
      await onConfirm(currentTarget.id);
    }
    setIsOptimizing(false);
    onClose();
  };

  if (!isOpen || !currentTarget) return null;

  return (
    <div className="fixed inset-0 bg-red-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 font-mono animate-in fade-in duration-200">
      <div className="bg-black border-4 border-red-600 w-full max-w-lg shadow-[10px_10px_0px_0px_rgba(220,38,38,1)] overflow-hidden animate-in zoom-in-95 duration-200">
        
         <div className="bg-red-600 text-black p-4 flex justify-between items-center border-b-4 border-transparent">
          <h2 className="text-2xl font-black uppercase flex items-center gap-3">
            <AlertOctagon size={28} className="animate-pulse" />
            CRITICAL OPERATION
          </h2>
          <span className="text-xs font-bold px-2 py-1 bg-black text-red-600 border border-red-600 blink">
            LEVEL 5 AUTHORIZATION
          </span>
        </div>

        <div className="p-8 space-y-6 text-center bg-black">
          <div className="flex justify-center mb-4">
            <Skull size={64} className="text-red-500 animate-[bounce_2s_infinite]" />
          </div>
          
          <h3 className="text-3xl font-black text-white uppercase leading-none">
            Resource Optimization <br/> Imminent
          </h3>
          
          <div className="bg-red-950/30 border-2 border-red-600 p-4 text-red-400">
            <p className="mb-2">Target identified for immediate synergy-depletion:</p>
            <p className="text-2xl font-bold text-white uppercase">{currentTarget.name} ({currentTarget.team})</p>
            <p className="mt-2 text-sm">Yield Contribution: {currentTarget.goals || 0}</p>
          </div>

          <p className="text-white/70 text-sm">
            WARNING: This action will permanently sever the target's pipeline access and terminate their contract with E.F.O.O.T.Y. This action cannot be undone. Corporate will not provide severance.
          </p>
        </div>

        <div className="p-4 bg-red-950/50 border-t-4 border-red-600 grid grid-cols-2 gap-4">
          <button
            onClick={onClose}
            className="w-full bg-transparent border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-black font-black uppercase py-3 transition-colors disabled:opacity-50"
            disabled={isOptimizing}
          >
            Cancel Order
          </button>
          
          <button
            onClick={handleFire}
            className="w-full bg-red-600 text-black hover:bg-red-500 font-black uppercase py-3 flex items-center justify-center gap-2 group transition-all disabled:opacity-50"
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <span className="animate-pulse">Optimizing...</span>
            ) : (
              <>
                <ShieldAlert size={20} className="group-hover:scale-110 transition-transform" />
                TERMINATE
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
