import React, { useState } from 'react';
import { Sparkles, Bot, Briefcase, TrendingUp, ChevronRight, Calculator, Swords, Activity, Flame } from 'lucide-react';
import { auth } from '../firebase';
import { getProjectInsight } from '../utils/ai';
import { getFormGuide } from '../utils/analytics';

const CATEGORIES = [
  {
    id: 'destiny',
    label: 'Destiny',
    icon: Briefcase,
    questions: [
      { label: "🏆 Which department will hit their Q4 targets first?" },
      { label: "📉 Which team requires the most performance coaching?" },
      { label: "💯 What will be the final top revenue bracket?" },
      { label: "🥀 Which underperforming KPI needs immediate intervention?" },
      { label: "🐎 Which dark horse employee is exceeding expectations?" },
      { label: "🤕 Which sprint went completely off the rails?" },
      { label: "🎢 Which department has the most volatile quarterly metrics?" },
      { label: "🎲 Who is on track for a Q4 bonus?" },
      { label: "Analyze my department's Q2 strategy. How do we ensure higher throughput?(ignore the 4 sentences rule for this one)" },
       ]
  },
  {
    id: 'stats',
    label: 'Stats & Players',
    icon: Activity,
    questions: [
      { label: "👟 Who will close the most Enterprise Deals?" },
      { label: "🧤 Which team met all their compliance SLAs?" },
      { label: "🛡️ Which team had the least blockers this quarter?" },
      { label: "⚔️ Who has the highest velocity in Story Points?" },
      { label: "🔥 Which squad is crushing their OKRs?" },
      { label: "❄️ Which project is severely behind deadline?" },
      { label: "🍿 Who runs the most effective daily standups?" },
      { label: "🎩 Who will close 3 major accounts this month?" }
    ]
  },
  {
    id: 'matchday',
    label: 'Matchday',
    icon: Flame,
    questions: [
      { label: "🥊 Which small team will outperform the enterprise division?" },
      { label: "🎆 Which upcoming sprint review will have the most throughput?" },
      { label: "💤 Which milestone meeting will be a complete block?" },
      { label: "📊 What is the probability of shipping the next major release on time?" }
    ]
  }
];


const AIOracle = ({ project, directors, squadPlayers, matches }) => {
  const [activeCategory, setActiveCategory] = useState('destiny');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [askedQuestion, setAskedQuestion] = useState(null);

  const [labHome, setLabHome] = useState('');
  const [labAway, setLabAway] = useState('');

  const prepareContext = () => {
    const userName = auth.currentUser?.displayName?.split(' ')[0] || "Boss";

    const teams = directors.map(m => {
      const teamReviews = matches.filter(match => {
        const hId = match.homeId || match.home?.id;
        const aId = match.awayId || match.away?.id;
        return hId === m.id || aId === m.id;
      });

      const totalScheduled = teamReviews.length;
      const played = m.matchesPlayed || m.played || 0;
      const remaining = totalScheduled - played;
      const form = getFormGuide(m.id, matches);

      const nextMatch = teamReviews.find(match => match.status !== 'COMPLETED');
      let nextOpponent = "None";
      if (nextMatch) {
          const isHome = (nextMatch.homeId || nextMatch.home?.id) === m.id;
          nextOpponent = isHome ? (nextMatch.awayName || "Away Team") : (nextMatch.homeName || "Home Team");
      }

      const mySquad = squadPlayers
        .filter(p => String(p.directorId) === String(m.id))
        .map(p => `${p.name} (${p.position})`);

      return {
        ...m,
        
        name: m.team,
        director: m.name,
        
        squad_roster: mySquad.length > 0 ? mySquad.join(', ') : "No players registered",
        
        current_points: (m.wins * 3) + m.draws,
        goals_for: m.goalsFor || 0,
        goals_against: m.goalsAgainst || 0,
        matches_remaining: remaining,
        next_opponent: nextOpponent,
        form: form.join('-'),
      };
    });

    const knockoutReviews = matches.filter(m => m.type === 'KNOCKOUT');
    const groupReviews = matches.filter(m => m.type !== 'KNOCKOUT');
    
    const activeKnockouts = knockoutReviews.filter(m => m.status !== 'COMPLETED' && m.homeId && m.awayId);
    const activeGroupGames = groupReviews.filter(m => m.status !== 'COMPLETED' && m.homeId && m.awayId);

    let currentPhase = "PRE-SEASON";
    let formatDescription = `League Project.`;


    const isTechnicallyEnded = (knockoutReviews.length > 0 && activeKnockouts.length === 0) || 
                               (knockoutReviews.length === 0 && groupReviews.length > 0 && activeGroupGames.length === 0);

    if (project?.status === 'ended' || project?.status === 'completed' || isTechnicallyEnded) {
        currentPhase = "TOURNAMENT ENDED";
    } else if (knockoutReviews.length > 0) {
        const knockoutStarted = knockoutReviews.some(m => m.status === 'COMPLETED' || (m.homeId && m.awayId));
        if (knockoutStarted) currentPhase = "KNOCKOUT STAGE";
        else if (groupReviews.some(m => m.status === 'COMPLETED')) currentPhase = "GROUP STAGE";
    } else if (groupReviews.some(m => m.status === 'COMPLETED')) {
        currentPhase = "GROUP STAGE/LEAGUE";
    }

    if (project?.format === 'HYBRID') {
        const hConfig = project.settings?.hybridConfig;
        if (hConfig?.type === 'MULTI_GROUP') {
           formatDescription = `Hybrid (Multi-Group). ${hConfig.numGroups} Groups. Top ${hConfig.advancersPerGroup} from EACH group advance to Knockout.`;
        } else {
           formatDescription = `Hybrid (Single League). Top ${hConfig.totalAdvancers} advance to Knockout.`;
        }
    } else if (project?.format === 'KNOCKOUT') {
        formatDescription = `Knockout Only. Loser goes home.`;
    }


    const relevantReviews = currentPhase.includes("KNOCKOUT") ? knockoutReviews : groupReviews;
    
    const upcomingSchedule = currentPhase === "TOURNAMENT ENDED" 
      ? ["SEASON OVER. NO UPCOMING GAMES."] 
      : relevantReviews
        .filter(m => m.status !== 'COMPLETED' && m.homeId && m.awayId)
        .sort((a, b) => (a.round || 0) - (b.round || 0) || (a.matchNumber || 0) - (b.matchNumber || 0))
        .slice(0, 8)
        .map(m => {
            const rName = m.roundName || (m.type === 'KNOCKOUT' ? `Knockout` : `Round ${m.round}`);
            return `[${rName}] ${m.homeName} vs ${m.awayName}`;
        });

    let champion = "Undecided";
    if (currentPhase === "TOURNAMENT ENDED") {
       const finishedKnockouts = knockoutReviews.filter(m => m.status === 'COMPLETED');
       if (finishedKnockouts.length > 0) {
           const maxRound = Math.max(...finishedKnockouts.map(m => m.round || 0));
           const finalMatch = finishedKnockouts.find(m => (m.round || 0) === maxRound);
           if (finalMatch) {
               if (finalMatch.hScore > finalMatch.aScore) champion = finalMatch.homeName;
               else if (finalMatch.aScore > finalMatch.hScore) champion = finalMatch.awayName;
               else champion = `${finalMatch.homeName} (on penalties)`;
           }
       }
       if (champion === "Undecided" && teams.length > 0) {
           const sorted = [...teams].sort((a,b) => b.current_points - a.current_points || b.goal_diff - a.goal_diff);
           champion = sorted[0].name;
       }
    }

    const recentResults = matches
        .filter(m => m.status === 'COMPLETED')
        .sort((a,b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map(m => `${m.homeName} ${m.hScore}-${m.aScore} ${m.awayName}`);

    return { 
      userName,
      projectFormatDescription: formatDescription,
      currentPhase,
      champion,
      teams,
      upcomingSchedule: upcomingSchedule.length > 0 ? upcomingSchedule : ["No specific fixtures scheduled yet."],
      recentResults,
      topPlayers: squadPlayers.slice(0, 8).map(p => ({ name: p.name, goals: p.goals, assists: p.assists || 0 }))
    };
  };

  const handleAsk = async (questionText) => {
    setLoading(true);
    setResponse(null);
    setAskedQuestion(questionText);

    const context = prepareContext();
    const answer = await getProjectInsight(questionText, context);
    
    setResponse(answer);
    setLoading(false);
  };

  const handleLabAction = async (type) => {
    if (!labHome) return alert("Please select at least a Home Team (Team X)");
    
    if (type === 'match' && !labAway) return alert("Select an Opponent (Team Y).");
    if (type === 'match' && labHome === labAway) return alert("A team cannot play itself!");

    const homeTeamName = directors.find(m => m.id === labHome)?.team;
    const awayTeamName = directors.find(m => m.id === labAway)?.team || "an opponent";

    let question = "";
    if (type === 'match') {
      question = `Predict the match result between ${homeTeamName} and ${awayTeamName}. Who wins, what's the score, and what is the probability?`;
    } else if (type === 'points') {
      question = `Deep Dive: Based on current form, exactly how many points will ${homeTeamName} finish with?`;
    } else if (type === 'analysis') {
      question = `Tactical Analysis: Why is ${homeTeamName} performing this way? Analyze their attack vs defense.`;
    }

    handleAsk(question);
  };

  return (
    <div className="font-mono max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      
      <div className="font-mono text-center space-y-3">
        <div className="font-mono inline-flex items-center justify-center p-4 bg-purple-500/10 rounded-none ring-1 ring-purple-500/30">
          <Bot size={40} className="font-mono text-purple-400" />
        </div>
        <div>
          <h2 className="font-mono text-3xl font-black text-black tracking-tight">AI Oracle Oracle</h2>
          <p className="font-mono text-black">Powered by Gemini • Full Context Analysis</p>
        </div>
      </div>

      {(loading || response) && (
        <div className="font-mono bg-gradient-to-br from-slate-900 to-purple-900/20 border border-purple-500/30 rounded-none p-6 relative overflow-hidden shadow-none">
          <div className="font-mono absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
          
          <div className="font-mono relative z-10">
            <div className="font-mono flex items-center gap-2 mb-4">
              <Sparkles className={`text-purple-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-mono text-xs font-bold text-purple-300 uppercase tracking-widest">
                {loading ? "Analyzing stats & schedule..." : "Oracle Prediction"}
              </span>
            </div>

            {loading ? (
              <div className="font-mono space-y-3 animate-pulse">
                <div className="font-mono h-4 bg-purple-500/10 rounded w-3/4"></div>
                <div className="font-mono h-4 bg-purple-500/10 rounded w-1/2"></div>
                <div className="font-mono h-4 bg-purple-500/10 rounded w-full"></div>
              </div>
            ) : (
              <div>
                <h3 className="font-mono text-black font-bold mb-2 text-lg italic opacity-90">"{askedQuestion}"</h3>
                <div className="font-mono prose prose-invert">
                  <p className="font-mono text-lg text-black leading-relaxed font-medium whitespace-pre-line">
                    {response}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="font-mono space-y-4">
        <div className="font-mono flex justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-none text-sm font-bold transition-all whitespace-nowrap
                ${activeCategory === cat.id 
                  ? 'bg-purple-600 text-black shadow-none shadow-none/50' 
                  : 'bg-white text-black hover:bg-white'}`}
            >
              <cat.icon size={16} /> {cat.label}
            </button>
          ))}
        </div>

        <div className="font-mono grid grid-cols-1 md:grid-cols-2 gap-3">
          {CATEGORIES.find(c => c.id === activeCategory).questions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q.label)}
              disabled={loading}
              className="font-mono flex items-center justify-between p-4 bg-white hover:bg-white border border-2 border-black hover:border-purple-500/40 rounded-none text-left transition-all group"
            >
              <span className="font-mono text-sm font-medium text-black group-hover:text-black transition-colors">
                {q.label}
              </span>
              <ChevronRight size={16} className="font-mono text-black group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>
          ))}
        </div>
      </div>

      <div className="font-mono border-t border-2 border-black pt-8 mt-8">
        <div className="font-mono bg-white rounded-none border border-2 border-black p-6">
          <div className="font-mono flex items-center gap-3 mb-6">
            <div className="font-mono p-2 bg-white rounded-none text-black"><Calculator size={24} /></div>
            <div>
              <h3 className="font-mono text-xl font-bold text-black">Simulation Lab</h3>
              <p className="font-mono text-xs text-black">Select teams to run hypothetical scenarios</p>
            </div>
          </div>

          <div className="font-mono grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="font-mono space-y-2">
              <label className="font-mono text-xs font-bold text-black uppercase">Team X (Focus)</label>
              <select 
                value={labHome} 
                onChange={(e) => setLabHome(e.target.value)}
                className="font-mono w-full bg-white border border-2 border-black rounded-none px-4 py-3 text-black outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="">Select Team...</option>
                {directors.map(m => <option key={m.id} value={m.id}>{m.name} ({m.team})</option>)}
              </select>
            </div>
            
            <div className="font-mono space-y-2">
              <label className="font-mono text-xs font-bold text-black uppercase">Team Y (Opponent)</label>
              <select 
                value={labAway} 
                onChange={(e) => setLabAway(e.target.value)}
                className="font-mono w-full bg-white border border-2 border-black rounded-none px-4 py-3 text-black outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="">Select Opponent...</option>
                {directors.map(m => <option key={m.id} value={m.id}>{m.name} ({m.team})</option>)}
              </select>
            </div>
          </div>

          <div className="font-mono grid grid-cols-1 md:grid-cols-3 gap-3">
            <button 
              onClick={() => handleLabAction('match')}
              className="font-mono flex flex-col items-center justify-center gap-2 p-4 bg-white hover:bg-white border border-blue-500/30 hover:border-blue-500 text-black hover:text-black rounded-none transition-all"
            >
              <Swords size={20} />
              <span className="font-mono text-xs font-bold">Simulate Match</span>
            </button>
            <button 
              onClick={() => handleLabAction('points')}
              className="font-mono flex flex-col items-center justify-center gap-2 p-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-500 text-emerald-300 hover:text-black rounded-none transition-all"
            >
              <TrendingUp size={20} />
              <span className="font-mono text-xs font-bold">Project Points</span>
            </button>
            <button 
              onClick={() => handleLabAction('analysis')}
              className="font-mono flex flex-col items-center justify-center gap-2 p-4 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/30 hover:border-amber-500 text-amber-300 hover:text-black rounded-none transition-all"
            >
              <Activity size={20} />
              <span className="font-mono text-xs font-bold">Tactical Analysis</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default AIOracle;