import React, { useState } from 'react';
import { X, Shield, Trash2, LogOut, HelpCircle, Tv, User as UserIcon, CheckCircle2, Copy, Settings } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, onEnd, onDelete, onLeave, isOwner, canLeave, inviteCode }) => {
  const [copiedType, setCopiedType] = useState(null);

  if (!isOpen) return null;

  const spectatorUrl = window.location.origin + window.location.pathname;
  const inviteUrl = inviteCode ? `${spectatorUrl}?invite=${inviteCode}` : spectatorUrl;

  const handleCopy = (type) => {
    const text = type === 'invite' ? inviteUrl : spectatorUrl;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80  p-0 md:p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white border border-2 border-black rounded-none-2xl md:rounded-none w-full max-w-sm overflow-hidden shadow-none" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-2 border-black flex justify-between items-center bg-white">
          <h3 className="font-bold text-black flex items-center gap-2"><Settings size={18} /> Project Settings</h3>
          <button onClick={onClose}><X size={20} className="text-black hover:text-black" /></button>
        </div>
        <div className="p-4 space-y-3">
          
          <div className="space-y-3 mb-4">
            <div className="bg-white p-3 rounded-none border border-2 border-black">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-bold text-black uppercase flex items-center gap-1">
                  <Tv size={12} /> Spectator Link
                </div>
                {copiedType === 'spectator' && <span className="text-[10px] text-green-500 font-bold">Copied!</span>}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-white border border-2 border-black rounded-none px-3 py-2 text-xs text-black truncate font-mono">
                  {spectatorUrl}
                </div>
                <button 
                  onClick={() => handleCopy('spectator')}
                  className="p-2 bg-white hover:bg-white text-black hover:text-black rounded-none transition-colors"
                >
                  {copiedType === 'spectator' ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-black mt-2 leading-relaxed">
                Share this with friends who want to <span className="text-black font-bold">watch</span> the tracker and KPIs.
              </p>
            </div>

            <div className="bg-white p-3 rounded-none border border-2 border-black relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-black text-white border-2 border-black hover:bg-white hover:text-black rounded-none blur-xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex justify-between items-center mb-2 relative z-10">
                <div className="text-xs font-bold text-black uppercase flex items-center gap-1">
                  <UserIcon size={12} /> Resource Invite Link
                </div>
                {copiedType === 'invite' && <span className="text-[10px] text-green-500 font-bold">Copied!</span>}
              </div>
              <div className="flex gap-2 relative z-10">
                <div className="flex-1 bg-white border border-2 border-black rounded-none px-3 py-2 text-xs text-black truncate font-mono">
                  {inviteUrl}
                </div>
                <button 
                  onClick={() => handleCopy('invite')}
                  className="p-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black  text-black rounded-none transition-colors shadow-none shadow-none/20"
                >
                  {copiedType === 'invite' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-black mt-2 leading-relaxed relative z-10">
                Send this to engineers. They will see a <span className="text-black font-bold">"Join Project"</span> button when they open it.
              </p>
            </div>
          </div>

          <div className="h-px bg-white my-2"></div>

          {isOwner && (
            <button 
              onClick={onEnd}
              className="w-full flex items-center gap-3 p-3 rounded-none bg-white hover:bg-white text-black transition-colors text-left"
            >
              <div className="p-2 bg-black text-white border-2 border-black hover:bg-white hover:text-black rounded-none"><Shield size={20} /></div>
              <div>
                <div className="font-bold text-sm">End Project</div>
                <div className="text-xs text-black">Freeze stats & archive</div>
              </div>
            </button>
          )}

          {canLeave && (
            <button 
              onClick={onLeave}
              className="w-full flex items-center gap-3 p-3 rounded-none bg-white hover:bg-red-900/20 text-red-500 transition-colors text-left border border-transparent hover:border-red-500/30"
            >
              <div className="p-2 bg-red-500/10 rounded-none"><LogOut size={20} /></div>
              <div>
                <div className="font-bold text-sm">Leave Project</div>
                <div className="text-xs text-black">Exit this competition</div>
              </div>
            </button>
          )}
          
          {isOwner && (
            <button 
              onClick={onDelete}
              className="w-full flex items-center gap-3 p-3 rounded-none bg-white hover:bg-red-900/20 text-red-500 transition-colors text-left border border-transparent hover:border-red-500/30"
            >
              <div className="p-2 bg-red-500/10 rounded-none"><Trash2 size={20} /></div>
              <div>
                <div className="font-bold text-sm">Delete Project</div>
                <div className="text-xs text-black">Permanently remove all data</div>
              </div>
            </button>
          )}

          <button 
            onClick={() => {
              localStorage.removeItem('E.F.O.O.T.Y_tour_completed');
              window.location.reload();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-none bg-white hover:bg-white text-black transition-colors text-left border border-transparent hover:border-blue-500/30"
          >
            <div className="p-2 bg-white rounded-none">
              <HelpCircle size={20} />
            </div>
            <div>
              <div className="font-bold text-sm">Restart Tour</div>
              <div className="text-xs text-black">Show the guide again</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
