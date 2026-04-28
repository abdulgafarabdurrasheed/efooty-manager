import React, { useMemo } from 'react';
import { useTournamentData } from '../hooks/useTournamentData';

const TITLES = {
  tier1: ["Supreme Synergy Overlord", "Global VP of Paradigm Shifts", "Chief Action-Item Officer"],
  tier2: ["Senior Director of Bandwidth", "Regional Head of Cross-pollination", "Lead Ping-Pointer"],
  tier3: ["Associate Matrix Specialist", "Mid-level Pivot Coordinator", "Staff Meeting Enthusiast"],
  tier4: ["Junior Synergy Intern", "Assistant to the Agile Scrub", "Probationary Yield Tractor"]
};

function seededRandom(str, arrayLength) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash % arrayLength);
}

export default function AbsurdOrgChart({ projectId }) {
  const { players } = useTournamentData(projectId);

  const orgStructure = useMemo(() => {
    if (!players || players.length === 0) return { cSuite: [], directory: [], drones: [], interns: [] };

    const sorted = [...players].sort((a, b) => (b.goals || 0) - (a.goals || 0));
    
    const q1 = Math.max(1, Math.ceil(sorted.length * 0.15));
    const q2 = Math.max(1, Math.ceil(sorted.length * 0.35));
    const q3 = Math.max(1, Math.ceil(sorted.length * 0.25));

    return {
      cSuite: sorted.slice(0, q1),
      directors: sorted.slice(q1, q1 + q2),
      managers: sorted.slice(q1 + q2, q1 + q2 + q3),
      drones: sorted.slice(q1 + q2 + q3)
    };
  }, [players]);

  const HierarchyCard = ({ resource, tierLevel, bgColor }) => {
    const titlePool = TITLES[`tier${tierLevel}`];
    const generatedTitle = titlePool[seededRandom(resource.id, titlePool.length)];

    return (
      <div className={`relative flex flex-col items-center z-10 mx-2 my-4 min-w-[220px]`}>
        <div className={`w-full border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${bgColor} hover:-translate-y-1 transition-transform`}>
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-xl uppercase tracking-tighter truncate">{resource.name}</span>
            <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded-sm">YLD: {resource.goals || 0}</span>
          </div>
          <div className="bg-white border-2 border-black p-2 font-mono text-xs uppercase font-bold text-gray-700 h-16 flex items-center justify-center text-center">
            {generatedTitle}
          </div>
          <div className="mt-2 text-[10px] text-black font-bold uppercase w-full text-right opacity-70">
            ID: {resource.id.substring(0, 5)}
          </div>
        </div>
        {tierLevel < 4 && <div className="absolute -bottom-8 w-1 h-8 bg-black z-0"></div>}
        {tierLevel > 1 && <div className="absolute -top-4 w-1 h-4 bg-black z-0"></div>}
      </div>
    );
  };

  if(!players || players.length === 0) {
    return <div className="p-8 text-center font-black uppercase text-2xl animate-pulse">Awaiting Resource Allocation...</div>;
  }

  return (
    <div className="bg-gray-100 p-8 border-4 border-black mt-8 overflow-x-auto">
      <div className="mb-8 border-b-4 border-black pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Corporate Hierarchy</h2>
          <p className="font-mono text-sm font-bold opacity-70">Auto-generated via yield telemetry</p>
        </div>
        <div className="bg-red-500 text-white font-black px-4 py-2 uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          CONFIDENTIAL
        </div>
      </div>

      <div className="flex flex-col items-center w-max min-w-full relative">
        
        <div className="flex justify-center w-full relative">
          {orgStructure.cSuite.map(p => <HierarchyCard key={p.id} resource={p} tierLevel={1} bgColor="bg-yellow-400" />)}
        </div>

        {orgStructure.directors.length > 0 && <div className="w-[60%] h-1 bg-black -mt-4 mb-4 relative"></div>}

        <div className="flex justify-center w-full relative">
          {orgStructure.directors.map(p => <HierarchyCard key={p.id} resource={p} tierLevel={2} bgColor="bg-blue-400" />)}
        </div>

        {orgStructure.managers.length > 0 && <div className="w-[80%] h-1 bg-black -mt-4 mb-4 relative"></div>}

        <div className="flex justify-center flex-wrap w-full relative max-w-5xl">
          {orgStructure.managers.map(p => <HierarchyCard key={p.id} resource={p} tierLevel={3} bgColor="bg-green-400" />)}
        </div>

        {orgStructure.drones.length > 0 && <div className="w-[90%] h-1 bg-black -mt-4 mb-4 relative"></div>}

        <div className="flex justify-center flex-wrap w-full relative max-w-6xl">
          {orgStructure.drones.map(p => <HierarchyCard key={p.id} resource={p} tierLevel={4} bgColor="bg-gray-300" />)}
        </div>

      </div>
    </div>
  );
}