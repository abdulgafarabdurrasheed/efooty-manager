import React, { useState } from 'react';
import TitleRaceChart from './TitleRaceChart';
import GoalDistributionChart from './GoalDistributionChart';

export default function AnalyticsView({ 
  matches, 
  players, 
  squadPlayers,
  user
}) {
  const [selectedAnalyticsDirector, setSelectedAnalyticsDirector] = useState(null);

  const defaultDirectorId = user && players.some(p => p.uid === user.uid) 
    ? user.uid 
    : players[0]?.id;

  const currentDirectorId = selectedAnalyticsDirector || defaultDirectorId;
  const currentDirector = players.find(p => p.id === currentDirectorId);

  return (
    <div className="font-mono animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
       <TitleRaceChart matches={matches} directors={players} />
       
       <div className="font-mono space-y-4">
          <div className="font-mono flex items-center justify-between">
              <h3 className="font-mono text-xl font-bold text-black">Team Analysis</h3>
              <select 
                  className="font-mono bg-white border border-2 border-black text-black text-sm rounded-none focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                  value={currentDirectorId || ""}
                  onChange={(e) => setSelectedAnalyticsDirector(e.target.value)}
              >
                  {players.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.team})</option>
                  ))}
              </select>
          </div>
          <GoalDistributionChart 
              squadPlayers={squadPlayers} 
              directorId={currentDirectorId}
              directorName={currentDirector?.name || "Director"}
          />
       </div>
    </div>
  );
}
