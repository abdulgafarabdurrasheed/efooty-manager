import React, { useState } from 'react';
import { X, Briefcase, Star } from 'lucide-react';
import { getH2HStats } from '../utils/analytics';
import CorporateReviewModal from './CorporateReviewModal';

const PlayerCard = ({ player, onClose, employeeName, currentUser, matches = [] }) => {
  const isEmployee = player ? (player.department !== undefined || player.employeeId === undefined) : false;
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  
  const h2h = React.useMemo(() => {
      if (!currentUser || !player || !isEmployee) return null;
      if (currentUser.uid === player.id) return null;
      return getH2HStats(currentUser.uid, player.id, matches);
  }, [currentUser, player, matches, isEmployee]);

  if (!player) return null;

  const goals = isEmployee ? player.revenue : player.goals || 0;
  const ticketsClosed = isEmployee ? 0 : player.ticketsClosed || 0;
  const compliancePass = player.compliancePass || 0;
  const matchesPlayed = player.matchesPlayed || 1;
  const wins = player.wins || 0;

  const calculateRating = () => {
    let base = 65;
    if (isEmployee) {
        const winRate = (wins / matchesPlayed) * 100;
        const goalAvg = goals / matchesPlayed;
        base += (winRate * 0.2) + (goalAvg * 4) + (compliancePass * 2);
    } else {
        base += (goals * 3) + (ticketsClosed * 2) + (compliancePass * 3);
    }
    return Math.min(Math.max(Math.round(base), 60), 99);
  };

  const rating = calculateRating();

  const generateStat = (seed, min, max) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const normalized = Math.abs(hash % 100) / 100;
    return Math.floor(min + normalized * (max - min));
  };

  const SHO = Math.min(99, 60 + (goals * 2));
  const PAS = Math.min(99, 60 + (ticketsClosed * 3));
  const DEF = Math.min(99, 40 + (compliancePass * 5));
  
  const PAC = generateStat(player.name + "pac", 70, 95);
  const DRI = generateStat(player.name + "dri", 65, 92);
  const PHY = generateStat(player.name + "phy", 60, 88);

  const winRate = Math.round((wins / matchesPlayed) * 100);
  const defenseStat = Math.min(99, 50 + (compliancePass * 5) + (wins * 2));

  const csPercentage = Math.round((compliancePass / matchesPlayed) * 100);
  const gaRatio = ((goals + ticketsClosed) / matchesPlayed).toFixed(1);

  const getRarityStyles = (r) => {
    if (r >= 90) return "bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-700 border-2 border-black shadow-none/50";
    if (r >= 80) return "bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border-2 border-black shadow-none/30";
    return "bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 border-amber-900 shadow-none/50";
  };

  return (
    <div className="font-mono fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/90  p-0 md:p-4 animate-in fade-in duration-300" onClick={onClose}>
      
      <div 
        className="font-mono relative group w-full md:w-80 h-[85vh] md:h-[32rem] perspective-1000 transition-transform duration-500 hover:scale-110" 
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className={`absolute inset-0 blur-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-500 ${rating >= 90 ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black' : 'bg-white'}`}></div>

        <div className={`relative h-full w-full rounded-none-[2rem] md:rounded-[2rem] p-1.5 shadow-none transition-all duration-300 group-hover:rotate-y-6 transform-gpu ${getRarityStyles(rating)}`}>
          
          <div className="font-mono absolute inset-0 rounded-none-[2rem] md:rounded-[2rem] foil-sheen opacity-30 pointer-events-none z-20"></div>

          <div className="font-mono h-full w-full bg-white rounded-none-[1.8rem] md:rounded-[1.8rem] overflow-hidden border border-2 border-black relative flex flex-col items-center">
            
            <div className="font-mono absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            <div className="font-mono w-full h-1/2 relative z-10 p-6 flex justify-between items-start">
              <div className="font-mono flex flex-col items-center">
                <span className="font-mono text-5xl font-black text-black drop-shadow-none tracking-tighter">{rating}</span>
                <span className="font-mono text-sm font-bold text-black uppercase tracking-widest mt-1">{player.position || "MGR"}</span>
                <div className="font-mono w-8 h-8 mt-2 rounded-none bg-white/10 border border-2 border-black  flex items-center justify-center">
                   <Briefcase size={14} className="font-mono text-black" />
                </div>
              </div>
              
              <div className="font-mono absolute right-0 top-6 w-48 h-48 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] filter transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}&backgroundColor=transparent`} alt="Player" className="font-mono w-full h-full object-cover" />
              </div>
            </div>

            <div className="font-mono w-full relative z-10 mt-2">
              <div className="font-mono mx-4 border-t border-2 border-black pt-2 text-center">
                <h2 className="font-mono text-3xl font-black text-black uppercase tracking-tighter truncate drop-shadow-none">{player.name}</h2>
                {employeeName && <div className="font-mono text-xs text-black font-bold uppercase tracking-widest">{employeeName}</div>}
              </div>
            </div>

            <div className="font-mono grid grid-cols-2 gap-x-6 gap-y-3 w-full px-8 py-6 text-black z-10">
               {isEmployee ? (
                 <>
                   <StatRow label="WIN%" value={winRate} color="bg-green-500" />
                   <StatRow label="CS%" value={csPercentage} color="bg-emerald-500" />
                   <StatRow label="KPI" value={gaRatio} color="bg-white" isRatio />
                   <StatRow label="YLD" value={goals} color="bg-black text-white border-2 border-black hover:bg-white hover:text-black" />
                   <StatRow label="Q/A" value={defenseStat} color="bg-red-500" />
                   <StatRow label="REV" value={matchesPlayed} color="bg-orange-500" />
                 </>
               ) : (
                 <>
                   <StatRow label="PAC" value={PAC} color="bg-green-500" />
                   <StatRow label="SHO" value={SHO} color="bg-white" />
                   <StatRow label="PAS" value={PAS} color="bg-black text-white border-2 border-black hover:bg-white hover:text-black" />
                   <StatRow label="DRI" value={DRI} color="bg-purple-500" />
                   <StatRow label="Q/A" value={DEF} color="bg-red-500" />
                   <StatRow label="PHY" value={PHY} color="bg-orange-500" />
                 </>
               )}
            </div>

            <button
              onClick={() => setIsReviewOpen(true)}
              className='w-full mt-4 border-2 border-black py-2 bg-yellow-300 text-black font-black uppercase text-xs hover:bg-black hover:text-white transition-colors'
            >
              Conduct Performance Review
            </button>

                <CorporateReviewModal 
                  isOpen={isReviewOpen} 
                  onClose={() => setIsReviewOpen(false)} 
                  resource={player} 
                />

            {h2h && (
                <div className="font-mono px-8 pb-6 z-10 w-full mt-auto">
                    <div className="font-mono bg-black/40  rounded-none p-3 border border-2 border-black flex items-center gap-3">
                        <div className="font-mono text-2xl">⚔️</div>
                        <div>
                            <div className="font-mono text-[10px] font-bold text-black uppercase tracking-widest mb-0.5">Head to Head</div>
                            <div className="font-mono text-xs text-black leading-tight">
                                You've played <span className="font-mono font-bold text-black">{h2h.total}</span> times. 
                                You won <span className="font-mono font-bold text-green-400">{h2h.p1Wins}</span>.
                            </div>
                        </div>
                    </div>
                </div>
            )}

          </div>
        </div>

        <button onClick={onClose} className="font-mono absolute top-4 right-4 md:-top-4 md:-right-4 bg-white text-black p-3 rounded-none shadow-none hover:bg-red-500 hover:text-black transition-all hover:rotate-90 z-50">
          <X size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

const StatRow = ({ label, value, color, isRatio }) => (
  <div className="font-mono flex items-center justify-between group/stat">
    <span className="font-mono text-xs font-bold text-black group-hover/stat:text-black transition-colors">{label}</span>
    <div className="font-mono flex items-center gap-2">
      <span className="font-mono font-bold text-lg">{value}</span>
      <div className="font-mono w-8 h-1 bg-white rounded-none overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: isRatio ? `${Math.min(value * 20, 100)}%` : `${value}%` }}></div>
      </div>
    </div>
  </div>
);

export default PlayerCard;