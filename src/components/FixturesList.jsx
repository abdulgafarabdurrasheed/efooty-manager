import React, { useState, useMemo } from 'react';
import { ChevronRight, Filter, Calendar, CheckCircle2, Clock } from 'lucide-react';

const FixturesList = ({ matches = [], isAdmin, onMatchClick }) => {
  const [selectedRound, setSelectedRound] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");

  const getHomeName = (m) => m.homeName || m.home?.name || "TBD";
  const getAwayName = (m) => m.awayName || m.away?.name || "TBD";

  const uniqueRounds = useMemo(() => {
    const rounds = new Set(matches.map(m => m.round));
    return Array.from(rounds).sort((a, b) => a - b);
  }, [matches]);

  const uniqueTeams = useMemo(() => {
    const teams = new Set();
    matches.forEach(m => {
      teams.add(getHomeName(m));
      teams.add(getAwayName(m));
    });
    return Array.from(teams).sort().filter(t => t !== "TBD");
  }, [matches]);

  const filteredReviews = useMemo(() => {
    return matches.filter(m => {
      const matchRound = selectedRound === "all" || m.round === parseInt(selectedRound);
      const hName = getHomeName(m);
      const aName = getAwayName(m);
      const matchTeam = selectedTeam === "all" || hName === selectedTeam || aName === selectedTeam;
      return matchRound && matchTeam;
    }).sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        const dateA = a.date?.seconds || 0;
        const dateB = b.date?.seconds || 0;
        return dateA - dateB;
    });
  }, [matches, selectedRound, selectedTeam]);

  const groupedReviews = useMemo(() => {
    const groups = {};
    filteredReviews.forEach(m => {
      const key = m.phase === 'KNOCKOUT' || m.type === 'KNOCKOUT' ? (m.roundName || `Round ${m.round}`) : `Round ${m.round}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [filteredReviews]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "TBD";
    return new Date(timestamp.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-white p-4 rounded-none border border-2 border-black flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-black text-sm font-bold uppercase tracking-wider">
          <Filter size={16} /> Filters
        </div>
        
        <select 
          value={selectedRound} 
          onChange={(e) => setSelectedRound(e.target.value)}
          className="bg-white border border-2 border-black rounded-none px-3 py-1.5 text-black text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All Rounds</option>
          {uniqueRounds.map(r => <option key={r} value={r}>Round {r}</option>)}
        </select>

        <select 
          value={selectedTeam} 
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="bg-white border border-2 border-black rounded-none px-3 py-1.5 text-black text-sm outline-none focus:border-blue-500"
        >
          <option value="all">All Teams</option>
          {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        
        <div className="ml-auto text-xs text-black">
          Showing {filteredReviews.length} fixtures
        </div>
      </div>

      <div className="space-y-8">
        {Object.keys(groupedReviews).length === 0 && (
          <div className="text-center py-12 text-black italic">No matches found matching filters.</div>
        )}

        {Object.keys(groupedReviews).map(roundKey => (
          <div key={roundKey} className="bg-white rounded-none border border-2 border-black overflow-hidden">
            <div className="bg-white px-4 py-3 border-b border-2 border-black flex justify-between items-center">
              <h3 className="font-bold text-black text-sm flex items-center gap-2">
                <Calendar size={14} className="text-black" /> {roundKey}
              </h3>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {groupedReviews[roundKey].map((match, index) => {
                  const hName = getHomeName(match);
                  const aName = getAwayName(match);
                  const isPlayed = match.status === 'COMPLETED';
                  const isBye = match.status === 'BYE';

                  return (
                    <div 
                      key={match.id}
                      onClick={() => isAdmin && onMatchClick(match)}
                      className={`p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 group animate-fade-in-up ${isAdmin ? 'cursor-pointer hover:bg-white hover:scale-[1.01]' : ''}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex justify-between w-full md:w-auto md:block">
                         <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-none ${isPlayed ? 'bg-green-500' : isBye ? 'bg-white' : 'bg-white'}`}></div>
                            <span className="text-xs text-black font-mono block md:hidden">{formatDate(match.date)}</span>
                            <span className="text-xs text-black font-mono hidden md:block">{formatDate(match.date)}</span>
                         </div>
                         {isBye && <span className="text-[10px] bg-white text-black px-1.5 rounded md:hidden">BYE</span>}
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 w-full items-center">
                        <div className={`text-right text-sm md:text-base font-bold truncate ${match.winner?.name === hName ? 'text-black' : 'text-black'}`}>
                          {hName}
                        </div>
                        
                        <div className="bg-white px-3 py-1 rounded text-black font-mono text-sm text-center whitespace-nowrap">
                          {isPlayed || isBye ? `${match.hScore}-${match.aScore}` : 'vs'}
                        </div>

                        <div className={`text-left text-sm md:text-base font-bold truncate ${match.winner?.name === aName ? 'text-black' : 'text-black'}`}>
                          {aName}
                        </div>
                      </div>

                      <div className="hidden md:block w-1/4 text-right">
                        {isAdmin && !isPlayed && !isBye && (
                          <span className="text-xs text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                            Log Score <ChevronRight size={12} />
                          </span>
                        )}
                        {isAdmin && isPlayed && (
                          <span className="text-xs text-black font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                            Edit <ChevronRight size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FixturesList;
