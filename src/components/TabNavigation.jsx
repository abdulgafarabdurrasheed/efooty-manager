import React from 'react';
import { Users, BarChart3, Calendar, TrendingUp, Network, Zap, Shirt, KanbanSquare } from 'lucide-react';

export default function TabNavigation({ 
  activeTab, 
  setActiveTab, 
  project, 
  players, 
  user 
}) {
  const isParticipant = players.some(p => p.uid === user?.uid);
  const isLeague = project?.format === 'LEAGUE';
  const isNotLeague = project?.format !== 'LEAGUE';

  return (
    <div className="font-mono tour-tabs sticky top-16 z-30 bg-white  py-2 -mx-4 px-4 border-b border-2 border-black md:static md:bg-transparent md:border-0 md:p-0 md:mx-0">
      <div className="font-mono flex gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full">
        <button 
          onClick={() => setActiveTab('directors')}
          className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'directors' ? 'bg-white text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
        >
          <Users size={16} /> Leaderboard
        </button>
        <button 
          onClick={() => setActiveTab('players')}
          className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'players' ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
        >
          <BarChart3 size={16} /> KPIs
        </button>
        <button 
          onClick={() => setActiveTab('fixtures')}
          className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'fixtures' ? 'bg-white text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
        >
          <Calendar size={16} /> Sprints
        </button>
        <button 
          onClick={() => setActiveTab('pipeline')}
          className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'pipeline' ? 'bg-orange-500 text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
        >
          <KanbanSquare size={16} /> Pipeline
        </button>
        {isLeague && (
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-pink-600 text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
          >
            <TrendingUp size={16} /> Analytics
          </button>
        )}
        {isNotLeague && (
          <button 
              onClick={() => setActiveTab('bracket')}
              className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'bracket' ? 'bg-purple-600 text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
          >
              <Network size={16} /> Bracket
          </button>
        )}
        
        <button 
          onClick={() => setActiveTab('oracle')}
          className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'oracle' ? 'bg-purple-500 text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
        >
          <Zap size={16} /> AI Oracle
        </button>

        {isParticipant && (
          <button 
            onClick={() => setActiveTab('squad')}
            className={`tour-squad-btn shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'squad' ? 'bg-green-600 text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
          >
            <Shirt size={16} /> My Pod
          </button>
        )}
      </div>
    </div>
  );
}
