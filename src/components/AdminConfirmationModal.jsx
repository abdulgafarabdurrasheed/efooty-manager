import React from 'react';
import { Crown } from 'lucide-react';

const AdminConfirmationModal = ({ isOpen, name, isAdmin, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="font-mono fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90  p-0 md:p-4 animate-in fade-in duration-200">
      <div className="font-mono bg-white border border-2 border-black rounded-none-2xl md:rounded-none w-full max-w-md overflow-hidden shadow-none transform scale-100">
        <div className="font-mono p-6 text-center space-y-4">
          <div className={`w-16 h-16 rounded-none flex items-center justify-center mx-auto ${isAdmin ? 'bg-red-500/10 text-red-500' : 'bg-black text-white border-2 border-black hover:bg-white hover:text-black text-black'}`}>
            <Crown size={32} className={isAdmin ? "fill-red-500" : "fill-yellow-500"} />
          </div>
          
          <div>
            <h3 className="font-mono text-xl font-bold text-black mb-2">
              {isAdmin ? "Remove Admin?" : "Make Admin?"}
            </h3>
            <p className="font-mono text-black leading-relaxed">
              Are you sure you want to {isAdmin ? "remove admin rights from" : "grant admin rights to"} <span className="font-mono text-black font-bold">{name}</span>?
            </p>
            {!isAdmin && (
              <p className="font-mono text-xs text-black mt-2 bg-black text-white border-2 border-black hover:bg-white hover:text-black p-2 rounded border border-2 border-black">
                Admins can log match results and manage project settings.
              </p>
            )}
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
            className={`flex-1 py-3 rounded-none font-bold text-black shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] ${isAdmin ? 'bg-red-600 hover:bg-red-500 shadow-none/20' : 'bg-black text-white hover:bg-white hover:text-black border-2 border-black  text-black shadow-none/20'}`}
          >
            {isAdmin ? "Remove Admin" : "Confirm Access"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfirmationModal;
