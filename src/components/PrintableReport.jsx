import React from 'react';
import { Briefcase } from 'lucide-react';

export default function PrintableReport({ project, players, highlights }) {
  if (!project) return null;

  return (
    <div className="font-mono print-only p-8 bg-white text-black min-h-screen">
      
      <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">{project.name}</h1>
          <p className="text-xl font-bold mt-2 uppercase tracking-widest">Executive Board Report // Context: {project.department || 'Enterprise'} </p>
        </div>
        <div className="text-right">
          <Briefcase size={48} className="inline-block mb-2" />
          <p className="text-sm font-bold uppercase">Generated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-black uppercase border-b-2 border-black pb-2 mb-4">Core KPIs</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="border-2 border-black p-4">
            <p className="text-xs font-bold uppercase text-gray-500 mb-1">Top Yield (Pod)</p>
            <p className="text-2xl font-black">{highlights?.topScorer?.name || 'N/A'}</p>
            <p className="font-bold">{highlights?.topScorer?.goalsFor || 0} Yields</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-bold uppercase text-gray-500 mb-1">Synergy Ops (Pod)</p>
            <p className="text-2xl font-black">{highlights?.topAssister?.name || 'N/A'}</p>
            <p className="font-bold">{highlights?.topAssister?.assists || 0} Synergies</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-bold uppercase text-gray-500 mb-1">Defect Blocker</p>
            <p className="text-2xl font-black">{highlights?.wall?.name || 'N/A'}</p>
            <p className="font-bold">{highlights?.wall?.cleanSheets || 0} Zero-Defects</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-black uppercase border-b-2 border-black pb-2 mb-4">Resource Leaderboard</h2>
        <table className="w-full text-left border-collapse border-2 border-black">
          <thead>
            <tr className="bg-black text-white">
              <th className="p-3 border-2 border-black uppercase text-sm">Rank</th>
              <th className="p-3 border-2 border-black uppercase text-sm">Pod / Director</th>
              <th className="p-3 border-2 border-black uppercase text-sm">Target vs Yield</th>
              <th className="p-3 border-2 border-black uppercase text-sm text-center">Score</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, index) => (
              <tr key={p.id} className="border-b-2 border-black">
                <td className="p-3 border-2 border-black font-bold text-center">{index + 1}</td>
                <td className="p-3 border-2 border-black font-bold uppercase">{p.name}</td>
                <td className="p-3 border-2 border-black">{p.goalsFor || 0} YLD / {p.goalsAgainst || 0} TGT</td>
                <td className="p-3 border-2 border-black font-black text-center text-xl">{p.points || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-16 text-center text-xs font-bold uppercase tracking-widest border-t-2 border-black pt-4">
        CONFIDENTIAL // INTERNAL DISTRIBUTION ONLY // E.F.O.O.T.Y. MANAGER
      </div>
    </div>
  );
}