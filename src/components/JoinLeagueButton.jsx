import React, { useState, useEffect } from 'react';
import { Plus, User, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';

const JoinLeagueButton = ({ user, onJoin, existingPlayers, registrationType, inviteCode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrgChart, setSelectedOrgChart] = useState(null);
  const [orgCharts, setOrgCharts] = useState([]);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchOrgCharts = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().orgCharts) {
          setOrgCharts(userDoc.data().orgCharts);
        }
      }
    };
    fetchOrgCharts();
  }, [user]);

  const handleJoin = async () => {
    if (!selectedOrgChart) return;
    setJoining(true);
    
    const newPlayer = {
      name: user.displayName,
      uid: user.uid,
      photoURL: user.photoURL,
      team: selectedOrgChart.teamName || selectedOrgChart.name,
      matchesPlayed: 0,
      wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0,
      cleanSheets: 0, assists: 0
    };
    
    await onJoin(newPlayer, selectedOrgChart);
    setJoining(false);
    setIsOpen(false);
  };

  if (existingPlayers.some(p => p.uid === user.uid)) return null;

  const searchParams = new URLSearchParams(window.location.search);
  const inviteParam = searchParams.get('invite');
  const isInviteValid = inviteParam && inviteParam === inviteCode;

  if (registrationType === 'LINK_ONLY' && !isInviteValid) {
      return (
          <div className="font-mono w-full py-4 border-2 border-dashed border-2 border-black text-black rounded-none bg-white font-bold text-center mb-6 px-4">
              <div className="font-mono flex items-center justify-center gap-2 mb-1 text-black">
                  <Lock size={16} /> Private Registration
              </div>
              <div className="font-mono text-xs font-normal">
                  This league has been set to private registration. You need a special link from one of the admins to register.
              </div>
          </div>
      );
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="font-mono w-full py-4 border-2 border-dashed border-2 border-black text-black rounded-none hover:bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-all font-black uppercase tracking-wider flex items-center justify-center gap-2 mb-6 animate-pulse"
      >
        <Plus size={20} /> Join This Initiative
      </button>
    );
  }

  return (
    <div className="font-mono fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90  p-0 md:p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
      <div className="font-mono bg-white border border-2 border-black rounded-none-2xl md:rounded-none w-full max-w-md overflow-hidden shadow-none" onClick={e => e.stopPropagation()}>
        <div className="font-mono p-6 border-b border-2 border-black bg-white">
          <h3 className="font-mono text-xl font-bold text-black uppercase tracking-wider flex items-center gap-2">
            <User size={24} className="font-mono text-black"/> Join Project
          </h3>
          <p className="font-mono text-black text-sm mt-1">Select a Org Chart to participate.</p>
        </div>
        
        <div className="font-mono p-6 space-y-6">
          {orgCharts.length === 0 ? (
            <div className="font-mono text-center space-y-4 py-4">
              <div className="font-mono bg-red-500/10 text-red-400 p-4 rounded-none border border-red-500/20 text-sm">
                You don't have any Org Charts saved in your profile. You need a squad to join!
              </div>
              <a href="/profile" className="font-mono inline-block bg-white hover:bg-white text-black font-bold py-2 px-4 rounded-none transition-colors">
                Go to Profile & Create Org Chart
              </a>
            </div>
          ) : (
            <div>
              <label className="font-mono text-xs font-bold text-black uppercase mb-3 block">Select Org Chart</label>
              <div className="font-mono space-y-2 max-h-60 overflow-y-auto pr-2">
                {orgCharts.map((plan, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedOrgChart(plan)}
                    className={`w-full text-left p-3 rounded-none border transition-all flex justify-between items-center ${selectedOrgChart === plan ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black border-2 border-black' : 'bg-white text-black border-2 border-black hover:border-2 border-black'}`}
                  >
                    <div>
                      <div className="font-mono font-bold">{plan.name}</div>
                      <div className={`text-xs ${selectedOrgChart === plan ? 'text-black/70' : 'text-black'}`}>{plan.teamName} • {plan.players?.length || 0} Players</div>
                    </div>
                    {selectedOrgChart === plan && <CheckCircle2 size={20} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="font-mono p-6 border-t border-2 border-black bg-white flex gap-3">
          <button 
            onClick={() => setIsOpen(false)} 
            className="font-mono flex-1 py-3 rounded-none font-bold text-black hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleJoin}
            disabled={!selectedOrgChart || joining || (selectedOrgChart.players && selectedOrgChart.players.length === 0)}
            className="font-mono 
              flex-1 relative overflow-hidden group bg-white text-black font-black py-3 rounded-none shadow-none 
              transform transition-all duration-100 
              hover:bg-white hover:scale-105 hover:shadow-none/40 
              active:scale-95 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              flex items-center justify-center gap-2
            "
          >
            <div className="font-mono absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
            <span className="font-mono relative z-20 flex items-center gap-2">
              {joining ? <Loader2 className="font-mono animate-spin" size={18} /> : 'CONFIRM JOIN'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinLeagueButton;
