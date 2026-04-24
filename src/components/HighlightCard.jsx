import React from 'react';

const HighlightCard = ({ title, icon, player, value, colorClass }) => {
  const Icon = icon;
  return (
  <div className="font-mono bg-white  rounded-none p-4 border border-2 border-black shadow-none relative overflow-hidden group hover:bg-white transition-all duration-300 animate-scale-in hover:scale-[1.02] hover:shadow-none">
    <div className={`absolute -top-4 -right-4 p-3 opacity-10 group-hover:opacity-20 transition-opacity rotate-12 ${colorClass}`}>
      <Icon size={80} />
    </div>
    <div className="font-mono flex items-center gap-2 mb-3 relative z-10">
      <div className={`p-2 rounded-none bg-white border border-2 border-black ${colorClass}`}>
        <Icon size={18} />
      </div>
      <h3 className="font-mono text-black text-xs font-bold uppercase tracking-wider">{title}</h3>
    </div>
    {player ? (
      <div className="font-mono relative z-10">
        <div className="font-mono text-xl font-black text-black truncate">{player.name}</div>
        <div className="font-mono text-xs text-black mb-2">{player.team}</div>
        <div className={`text-4xl font-bold ${colorClass.replace('text-', 'text-')}`}>{value}</div>
      </div>
    ) : (
      <div className="font-mono text-black italic text-sm mt-4">No data yet</div>
    )}
  </div>
  );
};

export default HighlightCard;
