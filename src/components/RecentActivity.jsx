import React from 'react';

export default function RecentActivity({ recentReviews }) {
  return (
    <div className="bg-white rounded-none border border-2 border-black p-6">
      <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {recentReviews.length === 0 ? (
          <div className="text-center text-black text-sm py-4 italic">No sprint reviews logged yet.</div>
        ) : (
          recentReviews.map((match, index) => (
            <div 
              key={match.id} 
              className="flex justify-between items-center bg-white p-3 rounded-none border border-2 border-black animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-xs text-black font-mono">{match.time}</div>
              <div className="flex items-center gap-3 text-sm font-bold">
                <span className="text-right w-20 truncate text-black">{match.homeName}</span>
                <span className="bg-white px-2 py-1 rounded text-black border border-2 border-black">{match.hScore} - {match.aScore}</span>
                <span className="text-left w-20 truncate text-black">{match.awayName}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
