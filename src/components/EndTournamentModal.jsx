import React from 'react';
import { Shield } from 'lucide-react';

const EndProjectModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="font-mono fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90  p-0 md:p-4 animate-in fade-in duration-200">
      <div className="font-mono bg-white border border-2 border-black rounded-none-2xl md:rounded-none w-full max-w-md overflow-hidden shadow-none">
        <div className="font-mono p-6 text-center space-y-4">
          <div className="font-mono w-16 h-16 rounded-none bg-black text-white border-2 border-black hover:bg-white hover:text-black text-black flex items-center justify-center mx-auto">
            <Shield size={32} />
          </div>
          
          <div>
            <h3 className="font-mono text-xl font-bold text-black mb-2">End Project?</h3>
            <p className="font-mono text-black text-sm leading-relaxed">
              This will freeze all stats and prevent any further matches from being logged. The project will remain viewable as "Completed".
            </p>
          </div>
        </div>

        <div className="font-mono p-4 bg-white border-t border-2 border-black flex gap-3">
          <button 
            onClick={onCancel}
            className="font-mono flex-1 py-3 rounded-none font-bold text-black hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="font-mono flex-1 bg-black text-white hover:bg-white hover:text-black border-2 border-black  text-black font-bold py-3 rounded-none transition-all shadow-none shadow-none/20"
          >
            End Season
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndProjectModal;
