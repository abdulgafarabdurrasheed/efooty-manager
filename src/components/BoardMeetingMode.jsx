import React, { useState, useEffect } from 'react';
import { X, Monitor, Trophy, Users, BarChart3, ChevronRight } from 'lucide-react';
import { getPoints } from '../hooks/useTournamentData';

const SLIDE_DURATION = 8000;

export default function BoardMeetingMode({ project, players, matches, recentReviews, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const leaderboard = [...players].sort((a, b) => {
    const ptsA = getPoints(a);
    const ptsB = getPoints(b);
    if (ptsA !== ptsB) return ptsB - ptsA;
    return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
  });

  const topScorer = [...players].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const topAssister = [...players].sort((a, b) => b.assists - a.assists)[0];
  const mostCleanSheets = [...players].sort((a, b) => b.cleanSheets - a.cleanSheets)[0];

  const completedMatches = matches.filter(m => m.status === 'COMPLETED').length;
  const scheduledMatches = matches.filter(m => m.status === 'SCHEDULED').length;

  const slides = [
    { id: 'leaderboard', title: 'Live Leaderboard', icon: <Trophy size={24} /> },
    { id: 'performers', title: 'Top Performers', icon: <Users size={24} /> },
    { id: 'results', title: 'Latest Sprint Results', icon: <BarChart3 size={24} /> },
    { id: 'summary', title: 'Executive Summary', icon: <Monitor size={24} /> },
  ];

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide(c => (c + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const renderSlide = () => {
    switch (slides[currentSlide].id) {
      case 'leaderboard':
        return (
          <div className="w-full max-w-4xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-yellow-400 text-black text-left text-sm font-black uppercase">
                  <th className="p-3 border-2 border-black">#</th>
                  <th className="p-3 border-2 border-black">Pod</th>
                  <th className="p-3 border-2 border-black">Director</th>
                  <th className="p-3 border-2 border-black text-center">P</th>
                  <th className="p-3 border-2 border-black text-center">W</th>
                  <th className="p-3 border-2 border-black text-center">D</th>
                  <th className="p-3 border-2 border-black text-center">L</th>
                  <th className="p-3 border-2 border-black text-center">YLD</th>
                  <th className="p-3 border-2 border-black text-center font-black">PTS</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((p, i) => (
                  <tr key={p.id} className={`text-sm font-bold ${i === 0 ? 'bg-yellow-400/20' : ''}`}>
                    <td className="p-3 border-2 border-white/20 font-black">{i + 1}</td>
                    <td className="p-3 border-2 border-white/20">{p.team}</td>
                    <td className="p-3 border-2 border-white/20 text-white/70">{p.name}</td>
                    <td className="p-3 border-2 border-white/20 text-center">{p.matchesPlayed}</td>
                    <td className="p-3 border-2 border-white/20 text-center text-green-400">{p.wins}</td>
                    <td className="p-3 border-2 border-white/20 text-center">{p.draws}</td>
                    <td className="p-3 border-2 border-white/20 text-center text-red-400">{p.losses}</td>
                    <td className="p-3 border-2 border-white/20 text-center">{p.goalsFor}</td>
                    <td className="p-3 border-2 border-white/20 text-center font-black text-yellow-400 text-lg">{getPoints(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'performers':
        return (
          <div className="grid grid-cols-3 gap-8 w-full max-w-4xl">
            {[
              { label: 'Top Yield Producer', player: topScorer, stat: `${topScorer?.goalsFor || 0}G`, color: 'text-yellow-400' },
              { label: 'Synergy Ops Leader', player: topAssister, stat: `${topAssister?.assists || 0}A`, color: 'text-green-400' },
              { label: 'Defect Blocker', player: mostCleanSheets, stat: `${mostCleanSheets?.cleanSheets || 0}CS`, color: 'text-blue-400' },
            ].map(({ label, player, stat, color }) => (
              <div key={label} className="border-2 border-white/30 p-8 text-center">
                <p className="text-xs uppercase tracking-widest text-white/50 font-bold mb-4">{label}</p>
                <h3 className="text-3xl font-black uppercase tracking-tight mb-2">{player?.name || 'N/A'}</h3>
                <p className="text-sm font-bold text-white/60 mb-4">{player?.team || ''}</p>
                <p className={`text-6xl font-black ${color}`}>{stat}</p>
              </div>
            ))}
          </div>
        );

      case 'results':
        return (
          <div className="w-full max-w-3xl space-y-4">
            {(recentReviews || []).slice(0, 5).map(m => (
              <div key={m.id} className="border-2 border-white/20 p-5 flex items-center justify-between">
                <span className="font-bold text-lg w-1/3 text-right">{m.homeName || 'Home'}</span>
                <div className="text-center px-6">
                  <span className="text-4xl font-black text-yellow-400">{m.hScore} - {m.aScore}</span>
                </div>
                <span className="font-bold text-lg w-1/3">{m.awayName || 'Away'}</span>
              </div>
            ))}
            {(!recentReviews || recentReviews.length === 0) && (
              <p className="text-center text-white/50 font-bold uppercase">No completed sprints yet</p>
            )}
          </div>
        );

      case 'summary':
        return (
          <div className="w-full max-w-3xl grid grid-cols-2 gap-6">
            {[
              { label: 'Total Sprints Completed', value: completedMatches },
              { label: 'Sprints Remaining', value: scheduledMatches },
              { label: 'Active Pods', value: players.length },
              { label: 'Current Leader', value: leaderboard[0]?.team || 'TBD' },
              { label: 'Top Yield', value: `${topScorer?.goalsFor || 0}G` },
              { label: 'Project Format', value: project?.format || 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} className="border-2 border-white/20 p-6">
                <p className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2">{label}</p>
                <p className="text-4xl font-black text-yellow-400">{value}</p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black text-white font-mono flex flex-col">
      <div className="flex items-center justify-between p-4 border-b-2 border-white/20 shrink-0">
        <div className="flex items-center gap-3">
          <Monitor size={20} className="text-yellow-400" />
          <span className="font-black uppercase tracking-tight text-sm">{project?.name || 'Board Meeting'}</span>
          <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 font-black uppercase ml-2">LIVE</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPaused(p => !p)}
            className="text-xs font-bold uppercase border border-white/30 px-3 py-1 hover:bg-white hover:text-black transition-colors"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <div className="flex gap-1">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(i)}
                className={`w-3 h-3 border border-white/50 ${i === currentSlide ? 'bg-yellow-400' : 'bg-transparent'}`}
              />
            ))}
          </div>
          <button onClick={onClose} className="hover:text-red-400 transition-colors"><X size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="flex items-center gap-3 mb-8">
          {slides[currentSlide].icon}
          <h2 className="text-3xl font-black uppercase tracking-tight">{slides[currentSlide].title}</h2>
        </div>
        {renderSlide()}
      </div>

      <div className="h-1 bg-white/10 shrink-0">
        <div
          className="h-full bg-yellow-400 transition-all"
          style={{
            width: `${((currentSlide + 1) / slides.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}