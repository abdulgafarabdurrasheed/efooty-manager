import React from 'react';
import { Flame, Zap, Shield } from 'lucide-react';
import HighlightCard from './HighlightCard';

export default function HighlightsSection({ highlights, activeTab }) {
  const isDirectorsTab = activeTab === 'directors';

  return (
    <section className="font-mono grid grid-cols-1 md:grid-cols-3 gap-6">
      <HighlightCard 
        title={isDirectorsTab ? "Top Yield (Pod)" : "Top Earner (Associate)"}
        icon={Flame} 
        player={highlights.topScorer} 
        value={isDirectorsTab ? `${highlights.topScorer?.goalsFor || 0} G` : `${highlights.topScorer?.goals || 0} G`}
        colorClass="text-orange-500" 
      />
      <HighlightCard 
        title={isDirectorsTab ? "Synergy Ops (Pod)" : "Key Collaborator"}
        icon={Zap} 
        player={highlights.topAssister} 
        value={isDirectorsTab ? `${highlights.topAssister?.assists || 0} A` : `${highlights.topAssister?.assists || 0} A`}
        colorClass="text-cyan-400" 
      />
      {isDirectorsTab && (
        <HighlightCard 
          title="Defect Blocker" 
          icon={Shield} 
          player={highlights.wall} 
          value={`${highlights.wall?.cleanSheets || 0}`} 
          colorClass="text-emerald-400" 
        />
      )}
      {!isDirectorsTab && (
        <div className="font-mono bg-white border border-2 border-black rounded-none flex items-center justify-center text-black text-sm italic">
          QA Analysts gain Zero Defects automatically when their module ships with 0 bugs!
        </div>
      )}
    </section>
  );
}
