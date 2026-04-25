import React from 'react';
import { Crown, Trash2, LayoutTemplate } from 'lucide-react';
import { getFormGuide } from '../utils/analytics';

const getPoints = (player) => (player.wins * 3) + (player.draws * 1);

export default function LeagueTable({ 
  tablePlayers, 
  title, 
  user, 
  project, 
  matches,
  onPlayerClick, 
  onViewFormation,
  onOpenAdminModal,
  onRemoveDirector,
  onPipClick
}) {
  return (
    <div className="overflow-x-auto mb-8">
      {title && <h3 className="text-lg font-bold text-black mb-4 px-4">{title}</h3>}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs font-bold text-black uppercase tracking-wider border-b border-2 border-black bg-white">
            <th className="p-4 w-16 text-center">Pos</th>
            <th className="p-4">Employee / Dept</th>
            <th className="p-4 text-center hidden sm:table-cell">MP</th>
            <th className="p-4 text-center hidden md:table-cell">On Track-Warn-Miss</th>
            <th className="p-4 text-center hidden sm:table-cell">Rev:Tgt</th>
            <th className="p-4 text-center">Diff</th>
            <th className="p-4 text-center text-black">Score</th>
            <th className="p-4 text-center w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {tablePlayers.length === 0 && (
            <tr><td colSpan="8" className="p-8 text-center text-black italic">No directors found. Add one to start the quarter!</td></tr>
          )}
          {tablePlayers.map((player, index) => (
            <tr 
              key={player.id} 
              className="group hover:bg-white transition-colors animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <td className="p-4 text-center font-mono text-black group-hover:text-black">{index + 1}</td>
              <td className="p-4 cursor-pointer hover:bg-gray-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div onClick={() => onPlayerClick(player)} className="font-bold text-black uppercase tracking-tighter text-lg md:text-xl group-hover:underline">
                    {player.name}
                  </div>
                  {(player.goalsDifference || 0) < 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPipClick(player); }}
                      className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest animate-pulse border-2 border-black hover:bg-black transition-colors"
                    >
                      P.I.P.
                    </button>
                  )}
                </div>
                <div className="text-xs text-black font-bold uppercase tracking-widest mt-1 opacity-60">
                  {player.department || 'Associate'}
                </div>
              </td>
              <td className="p-4 text-center font-mono text-black hidden sm:table-cell">{player.matchesPlayed}</td>
              <td className="p-4 text-center text-xs text-black hidden md:table-cell">
                <span className="text-green-400">{player.wins}</span>-<span className="text-black">{player.draws}</span>-<span className="text-red-400">{player.losses}</span>
              </td>
              <td className="p-4 text-center font-mono text-black hidden sm:table-cell">{player.goalsFor}:{player.goalsAgainst}</td>
              <td className={`p-4 text-center font-bold ${player.goalsFor - player.goalsAgainst > 0 ? 'text-green-500' : player.goalsFor - player.goalsAgainst < 0 ? 'text-red-500' : 'text-black'}`}>
                {player.goalsFor - player.goalsAgainst > 0 ? '+' : ''}{player.goalsFor - player.goalsAgainst}
              </td>
              <td className="p-4 text-center font-black text-xl text-black">{getPoints(player)}</td>
              <td className="p-4 text-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); onViewFormation(player.id); }}
                  className="p-2 bg-white hover:bg-white text-black hover:text-black rounded-none transition-colors"
                  title="View Formation"
                >
                  <LayoutTemplate size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MultiGroupTables({ 
  leaderboard, 
  user, 
  project, 
  matches,
  onPlayerClick, 
  onViewFormation,
  onOpenAdminModal,
  onRemoveDirector
}) {
  const groups = {};
  leaderboard.forEach(p => {
      const gid = p.groupId || 'Unassigned';
      if (!groups[gid]) groups[gid] = [];
      groups[gid].push(p);
  });

  const sortedKeys = Object.keys(groups).sort();

  return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-4">
          {sortedKeys.map(gid => (
              <div key={gid} className="bg-white rounded-none border border-2 border-black overflow-hidden">
                  <LeagueTable 
                    tablePlayers={groups[gid]} 
                    title={`Group ${gid}`}
                    user={user}
                    project={project}
                    matches={matches}
                    onPlayerClick={onPlayerClick}
                    onViewFormation={onViewFormation}
                    onOpenAdminModal={onOpenAdminModal}
                    onRemoveDirector={onRemoveDirector}
                  />
              </div>
          ))}
      </div>
  );
}
