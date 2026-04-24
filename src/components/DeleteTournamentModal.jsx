import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

const DeleteProjectModal = ({ isOpen, projectName, onConfirm, onCancel }) => {
  const [confirmName, setConfirmName] = useState("");
  
  if (!isOpen) return null;

  const isMatch = confirmName === projectName;

  return (
    <div className="font-mono fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90  p-0 md:p-4 animate-in fade-in duration-200">
      <div className="font-mono bg-white border border-red-500/30 rounded-none-2xl md:rounded-none w-full max-w-md overflow-hidden shadow-none">
        <div className="font-mono p-6 text-center space-y-4">
          <div className="font-mono w-16 h-16 rounded-none bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <Trash2 size={32} />
          </div>
          
          <div>
            <h3 className="font-mono text-xl font-bold text-black mb-2">Delete Project?</h3>
            <p className="font-mono text-black text-sm leading-relaxed mb-4">
              This action is <span className="font-mono text-red-400 font-bold">irreversible</span>. All sprints, stats, and data will be permanently wiped.
            </p>
            <div className="font-mono text-left bg-white p-4 rounded-none border border-2 border-black space-y-2">
              <label className="font-mono text-xs font-bold text-black uppercase">Type project name to confirm</label>
              <div className="font-mono text-xs text-black select-none mb-2">"{projectName}"</div>
              <input 
                type="text" 
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                placeholder="Type name here..."
                className="font-mono w-full bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
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
            disabled={!isMatch}
            className="font-mono flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-none transition-all shadow-none shadow-none/20"
          >
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal;
