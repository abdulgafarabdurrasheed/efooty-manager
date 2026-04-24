import React, { useState } from 'react';
import { BarChart3, ChevronUp, ChevronDown, Search } from 'lucide-react';
import PlayerCard from './PlayerCard';

export default function PlayerStatsView({ 
  squadPlayers, 
  user, 
  project, 
  matches,
  getDirectorInfo,
  updateSquadStat
}) {
  const [statsSearch, setStatsSearch] = useState("");
  const [statsFilter, setStatsFilter] = useState("all");
  const [statsSort, setStatsSort] = useState("yields");
  const [selectedPlayerForCard, setSelectedPlayerForCard] = useState(null);

  const isAdmin = user?.uid === project?.ownerId || project?.admins?.includes(user?.uid);

  return (
    <div className="font-mono animate-in fade-in slide-in-from-bottom-4 duration-300">
       <div className="font-mono bg-white  rounded-none border border-2 border-black overflow-hidden shadow-none">
          <div className="font-mono p-6 border-b border-2 border-black flex flex-col gap-4 bg-white">
            <div className="font-mono flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="font-mono text-xl font-bold text-black flex items-center gap-2">
                <BarChart3 className="font-mono text-black" size={20} />
                Quarterly Performance
              </h2>
              {isAdmin && (
                <div className="font-mono bg-black text-white border-2 border-black hover:bg-white hover:text-black border border-2 border-black px-4 py-2 rounded-none">
                  <p className="font-mono text-xs text-black uppercase tracking-wider font-bold">Tip: Click +/- to update stats manually</p>
                </div>
              )}
            </div>

            <div className="font-mono flex flex-col md:flex-row gap-3">
              <div className="font-mono tour-stats-search relative flex-1">
                <Search className="font-mono absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} />
                <input 
                  type="text" 
                  placeholder="Search resource, pod or lead..." 
                  value={statsSearch}
                  onChange={(e) => setStatsSearch(e.target.value)}
                  className="font-mono w-full bg-white border border-2 border-black rounded-none py-2 pl-10 pr-4 text-black placeholder:text-black focus:outline-none focus:border-2 border-black transition-colors"
                />
              </div>
              <div className="font-mono flex gap-2 overflow-x-auto pb-1 md:pb-0">
                <select 
                  value={statsFilter} 
                  onChange={(e) => setStatsFilter(e.target.value)}
                  className="font-mono bg-white border border-2 border-black rounded-none px-3 py-2 text-sm text-black focus:outline-none focus:border-2 border-black"
                >
                  <option value="all">All Resources</option>
                  <option value="closers">Goal Scorers</option>
                  <option value="resolvers">Assisters</option>
                </select>
                <select 
                  value={statsSort} 
                  onChange={(e) => setStatsSort(e.target.value)}
                  className="font-mono bg-white border border-2 border-black rounded-none px-3 py-2 text-sm text-black focus:outline-none focus:border-2 border-black"
                >
                  <option value="yields">Sort by Outcomes</option>
                  <option value="synergies">Sort by Synergies</option>
                  <option value="zeroDefects">Sort by Zero Defects</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="font-mono overflow-x-auto">
            <table className="font-mono w-full text-left border-collapse">
              <thead>
                <tr className="font-mono text-xs font-bold text-black uppercase tracking-wider border-b border-2 border-black bg-white">
                  <th className="font-mono p-4 w-16 text-center">Rank</th>
                  <th className="font-mono p-4">Employee Name</th>
                  <th className="font-mono p-4 hidden sm:table-cell">Management Pod</th>
                  <th className="font-mono p-4 text-center">KPIs</th>
                  <th className="font-mono p-4 text-center">Synergies</th>
                  <th className="font-mono p-4 text-center">Zero Defects</th>
                </tr>
              </thead>
              <tbody className="font-mono divide-y divide-slate-800/50">
                {(() => {
                  let filtered = squadPlayers.filter(p => {
                    const searchLower = statsSearch.toLowerCase();
                    const directorName = getDirectorInfo(p.directorId).toLowerCase();
                    const matchesSearch = p.name.toLowerCase().includes(searchLower) || 
                                          directorName.includes(searchLower);
                    
                    if (!matchesSearch) return false;

                    if (statsFilter === 'closers') return p.yields > 0;
                    if (statsFilter === 'resolvers') return p.synergies > 0;
                    return true;
                  });

                  filtered.sort((a, b) => {
                    if (statsSort === 'yields') return b.yields - a.yields || b.synergies - a.synergies;
                    if (statsSort === 'synergies') return b.synergies - a.synergies || b.yields - a.yields;
                    if (statsSort === 'zeroDefects') return b.zeroDefects - a.zeroDefects;
                    return 0;
                  });

                  if (filtered.length === 0) {
                    return <tr><td colSpan="6" className="font-mono p-8 text-center text-black italic">No resources found matching criteria.</td></tr>;
                  }

                  return filtered.map((p, index) => (
                    <tr key={p.id} onClick={() => setSelectedPlayerForCard(p)} className="font-mono group hover:bg-white transition-colors cursor-pointer">
                      <td className="font-mono p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-none font-black ${index === 0 ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black' : index === 1 ? 'bg-white text-black' : index === 2 ? 'bg-orange-700 text-black' : 'text-black bg-white'}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="font-mono p-4">
                         <div className="font-mono font-bold text-black text-lg">{p.name}</div>
                         <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${p.position === 'FWD' ? 'bg-red-500/20 text-red-400' : p.position === 'MID' ? 'bg-green-500/20 text-green-400' : p.position === 'DEF' ? 'bg-white text-black' : 'bg-purple-500/20 text-purple-400'}`}>
                            {p.position}
                         </div>
                      </td>
                      <td className="font-mono p-4 hidden sm:table-cell text-black text-sm">{getDirectorInfo(p.directorId)}</td>
                      <td className="font-mono p-4">
                        <div className="font-mono flex items-center justify-center gap-3">
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); updateSquadStat(p.id, 'yields', -1); }} className="font-mono p-1 hover:bg-white rounded text-black hover:text-red-400"><ChevronDown size={16} /></button>
                          )}
                          <span className="font-mono text-xl font-black text-black w-8 text-center">{p.yields}</span>
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); updateSquadStat(p.id, 'yields', 1); }} className="font-mono p-1 hover:bg-white rounded text-black hover:text-green-400"><ChevronUp size={16} /></button>
                          )}
                        </div>
                      </td>
                      <td className="font-mono p-4">
                        <div className="font-mono flex items-center justify-center gap-3">
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); updateSquadStat(p.id, 'synergies', -1); }} className="font-mono p-1 hover:bg-white rounded text-black hover:text-red-400"><ChevronDown size={16} /></button>
                          )}
                          <span className="font-mono text-xl font-bold text-cyan-400 w-8 text-center">{p.synergies}</span>
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); updateSquadStat(p.id, 'synergies', 1); }} className="font-mono p-1 hover:bg-white rounded text-black hover:text-green-400"><ChevronUp size={16} /></button>
                          )}
                        </div>
                      </td>
                      <td className="font-mono p-4">
                        <div className="font-mono flex items-center justify-center gap-3">
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); updateSquadStat(p.id, 'zeroDefects', -1); }} className="font-mono p-1 hover:bg-white rounded text-black hover:text-red-400"><ChevronDown size={16} /></button>
                          )}
                          <span className="font-mono text-xl font-bold text-emerald-400 w-8 text-center">{p.zeroDefects}</span>
                          {isAdmin && (
                            <button onClick={(e) => { e.stopPropagation(); updateSquadStat(p.id, 'zeroDefects', 1); }} className="font-mono p-1 hover:bg-white rounded text-black hover:text-green-400"><ChevronUp size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {selectedPlayerForCard && (
          <PlayerCard 
            player={selectedPlayerForCard} 
            directorName={getDirectorInfo(selectedPlayerForCard.directorId)}
            currentUser={user}
            matches={matches}
            onClose={() => setSelectedPlayerForCard(null)} 
          />
        )}
    </div>
  );
}
