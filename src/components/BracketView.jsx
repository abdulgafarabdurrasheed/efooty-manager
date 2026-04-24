import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, writeBatch, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Briefcase, User, Shield, AlertCircle, Info } from 'lucide-react';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import { assignDatesToRounds } from '../utils/scheduler';

const BracketView = ({ projectId, isAdmin, directors, projectFormat, projectSettings, startDate, endDate, squadPlayers = [], onFinalizeMatch }) => {
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalAssignments, setGoalAssignments] = useState({});
  const { toasts, addToast, removeToast } = useToast();

  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const [leg1Home, setLeg1Home] = useState("");
  const [leg1Away, setLeg1Away] = useState("");
  const [leg2Home, setLeg2Home] = useState("");
  const [leg2Away, setLeg2Away] = useState("");

  useEffect(() => {
    const bracketRef = doc(db, `projects/${projectId}/bracket/main`);
    const unsubscribe = onSnapshot(bracketRef, (docSnap) => {
      if (docSnap.exists()) {
        setBracket(docSnap.data());
      } else {
        setBracket(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const getRoundName = (size, roundNum, totalRounds) => {
      if (roundNum === totalRounds) return 'Final';
      if (roundNum === totalRounds - 1) return 'Semi Finals';
      if (roundNum === totalRounds - 2) return 'Quarter Finals';
      return `Round ${roundNum}`;
  };

  const getSquad = (directorId) => {
    return squadPlayers.filter(p => p.directorId === directorId);
  };

  const handleGoalAssignment = (index, type, value, team) => {
    setGoalAssignments(prev => ({
      ...prev,
      [`${team}_${index}`]: {
        ...prev[`${team}_${index}`],
        [type]: value
      }
    }));
  };

  const generateBracket = async () => {
    let sortedDirectors = [...directors];
    let numTeams = directors.length;

    if (projectFormat === 'HYBRID') {
        if (projectSettings?.hybridConfig?.type === 'MULTI_GROUP') {
            const groups = {};
            directors.forEach(m => {
                const gid = m.groupId || 'Unassigned';
                if (!groups[gid]) groups[gid] = [];
                groups[gid].push(m);
            });

            const sortFn = (a, b) => {
                const ptsA = (a.wins * 3) + a.draws;
                const ptsB = (b.wins * 3) + b.draws;
                return ptsB - ptsA || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
            };
            Object.keys(groups).forEach(gid => groups[gid].sort(sortFn));

            const advancersPerGroup = projectSettings.hybridConfig.advancersPerGroup || 2;
            const winners = [];
            const runnersUp = [];
            
            Object.keys(groups).sort().forEach(gid => {
                if (groups[gid][0]) winners.push(groups[gid][0]);
                if (groups[gid][1] && advancersPerGroup > 1) runnersUp.push(groups[gid][1]);
            });

            winners.sort(sortFn);
            runnersUp.sort(sortFn);

            sortedDirectors = [...winners, ...runnersUp];
            numTeams = sortedDirectors.length;

        } else if (projectSettings?.hybridConfig?.type === 'SINGLE_LEAGUE') {
            const totalAdvancers = projectSettings.hybridConfig.totalAdvancers || 16;
            sortedDirectors.sort((a, b) => {
                const ptsA = (a.wins * 3) + a.draws;
                const ptsB = (b.wins * 3) + b.draws;
                return ptsB - ptsA || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
            });
            sortedDirectors = sortedDirectors.slice(0, totalAdvancers);
            numTeams = sortedDirectors.length;
        }
    } else if (projectFormat !== 'KNOCKOUT') {
        sortedDirectors.sort((a, b) => {
            const ptsA = (a.wins * 3) + a.draws;
            const ptsB = (b.wins * 3) + b.draws;
            return ptsB - ptsA || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
        });
    }

    if (numTeams < 2) {
        addToast("Need at least 2 teams to start.", "error");
        return;
    }

    if (!window.confirm(`Start knockout stage with ${numTeams} teams?`)) return;

    const isTwoLeggedSetting = projectSettings?.knockout?.twoLegged || projectSettings?.twoLegged || false;

    const size = Math.pow(2, Math.ceil(Math.log2(numTeams)));

    const participants = [];
    for(let i=0; i<size; i++) {
        if (i < sortedDirectors.length) {
            participants.push({ id: sortedDirectors[i].id, name: sortedDirectors[i].name, team: sortedDirectors[i].team, seed: i+1 });
        } else {
            participants.push({ id: 'BYE', name: 'BYE', team: '', seed: i+1 });
        }
    }

    const rounds = [];
    const totalRounds = Math.log2(size);
    
    const r1Reviews = [];
    for (let i = 0; i < size / 2; i++) {
      const home = participants[i];
      const away = participants[size - 1 - i];
      
      const isByeMatch = home.id === 'BYE' || away.id === 'BYE';
      let winner = null;
      if (away.id === 'BYE') winner = home;
      if (home.id === 'BYE') winner = away;

      r1Reviews.push({
        id: `r1_m${i+1}`,
        home,
        away,
        hScore: winner ? (winner === home ? 1 : 0) : '', 
        aScore: winner ? (winner === away ? 1 : 0) : '',
        winner,
        isBye: isByeMatch,
        nextMatchId: `r2_m${Math.floor(i/2) + 1}`,
        nextMatchSlot: i % 2 === 0 ? 'home' : 'away',
        isTwoLegged: !!(isTwoLeggedSetting && totalRounds > 1 && !isByeMatch),
        legs: (isTwoLeggedSetting && totalRounds > 1 && !isByeMatch) ? {
            1: { hScore: '', aScore: '' },
            2: { hScore: '', aScore: '' }
        } : null
      });
    }
    rounds.push({ id: 1, name: getRoundName(size, 1, totalRounds), matches: r1Reviews });

    for (let r = 2; r <= totalRounds; r++) {
      const prevRoundReviews = rounds[r-2].matches;
      const matchCount = prevRoundReviews.length / 2;
      const matches = [];
      const isFinal = r === totalRounds;
      
      for (let i = 0; i < matchCount; i++) {
        matches.push({
          id: `r${r}_m${i+1}`,
          home: null, 
          away: null,
          hScore: '',
          aScore: '',
          winner: null,
          nextMatchId: isFinal ? null : `r${r+1}_m${Math.floor(i/2) + 1}`,
          nextMatchSlot: i % 2 === 0 ? 'home' : 'away',
          isTwoLegged: !!(isTwoLeggedSetting && !isFinal),
          legs: (isTwoLeggedSetting && !isFinal) ? {
            1: { hScore: '', aScore: '' },
            2: { hScore: '', aScore: '' }
          } : null
        });
      }
      rounds.push({ id: r, name: getRoundName(size, r, totalRounds), matches });
    }

    r1Reviews.forEach(m => {
        if (m.winner && m.nextMatchId) {
            const r2 = rounds[1]; 
            if (r2) {
                const nextMatch = r2.matches.find(nm => nm.id === m.nextMatchId);
                if (nextMatch) {
                    if (m.nextMatchSlot === 'home') nextMatch.home = m.winner;
                    else nextMatch.away = m.winner;
                }
            }
        }
    });

    const roundsForScheduler = rounds.map(r => r.matches.map((m, idx) => ({ 
        ...m, 
        round: r.id,
        matchNumber: idx + 1
    })));
    const sDate = startDate ? new Date(startDate) : new Date();
    const eDate = endDate ? new Date(endDate) : new Date(new Date().setDate(new Date().getDate() + 7));
    
    const scheduledReviews = assignDatesToRounds(roundsForScheduler, sDate, eDate);
    
    const batch = writeBatch(db);
    const matchesRef = collection(db, `projects/${projectId}/matches`);
    
    scheduledReviews.forEach(match => {
        if (match.isTwoLegged) {
            const leg1 = {
                ...match,
                id: `${match.id}_L1`,
                bracketMatchId: match.id,
                roundName: `${match.roundName || ('Round ' + match.round)} (Leg 1)`,
                home: match.home,
                away: match.away,
                hScore: match.legs?.[1]?.hScore || '',
                aScore: match.legs?.[1]?.aScore || '',
                leg: 1,
                type: 'KNOCKOUT',
                date: match.date instanceof Timestamp ? match.date : Timestamp.fromDate(new Date(match.date))
            };
            const leg2Date = new Date((match.date instanceof Timestamp ? match.date.toDate() : match.date).getTime() + 3600000);
            
            const leg2 = {
                ...match,
                id: `${match.id}_L2`,
                bracketMatchId: match.id,
                roundName: `${match.roundName || ('Round ' + match.round)} (Leg 2)`,
                home: match.away,
                away: match.home,
                hScore: match.legs?.[2]?.hScore || '',
                aScore: match.legs?.[2]?.aScore || '',
                leg: 2,
                type: 'KNOCKOUT',
                date: Timestamp.fromDate(leg2Date)
            };

            batch.set(doc(matchesRef, leg1.id), leg1);
            batch.set(doc(matchesRef, leg2.id), leg2);
        } else {
            const matchToSave = {
                ...match,
                type: 'KNOCKOUT',
                date: match.date instanceof Timestamp ? match.date : Timestamp.fromDate(new Date(match.date))
            };
            const docRef = doc(matchesRef, match.id);
            batch.set(docRef, matchToSave);
        }
    });
    
    await batch.commit();

    await setDoc(doc(db, `projects/${projectId}/bracket/main`), { rounds, size });
    
    await updateDoc(doc(db, `projects/${projectId}`), { status: 'ACTIVE' });
    addToast("Project started successfully!", "success");
  };

  const handleMatchClick = (roundIndex, matchIndex) => {
    if (!isAdmin) return;
    const match = bracket.rounds[roundIndex].matches[matchIndex];
    
    if (!match.home || !match.away || match.isBye) return;
    
    if (match.status === 'SCHEDULED_TBD' || !match.home.id || !match.away.id) {
        addToast("This match is waiting for qualifiers.", "info");
        return;
    }
    
    const totalRounds = bracket.rounds.length;
    const isFinal = roundIndex === totalRounds - 1;
    const shouldBeTwoLegged = projectSettings?.twoLegged && !isFinal;
    
    const effectiveIsTwoLegged = match.isTwoLegged || shouldBeTwoLegged;

    setSelectedMatch({ roundIndex, matchIndex, ...match, isTwoLegged: effectiveIsTwoLegged });
    
    if (effectiveIsTwoLegged) {
        if (match.legs) {
            setLeg1Home(match.legs[1].hScore);
            setLeg1Away(match.legs[1].aScore);
            setLeg2Home(match.legs[2].hScore);
            setLeg2Away(match.legs[2].aScore);
        } else {
            setLeg1Home(""); setLeg1Away(""); setLeg2Home(""); setLeg2Away("");
        }
    } else {
        setHomeScore(match.hScore);
        setAwayScore(match.aScore);
    }
  };

  const updateMatchResult = async () => {
    if (!selectedMatch) return;
    
    const newBracket = { ...bracket };
    const match = newBracket.rounds[selectedMatch.roundIndex].matches[selectedMatch.matchIndex];
    
    let winner = null;
    let hScoreFinal = 0;
    let aScoreFinal = 0;

    if (match.isTwoLegged) {
        const l1h = parseInt(leg1Home) || 0;
        const l1a = parseInt(leg1Away) || 0;
        const l2h = parseInt(leg2Home) || 0; 
        const l2a = parseInt(leg2Away) || 0; 
        
        hScoreFinal = l1h + l2a; 
        aScoreFinal = l1a + l2h; 
        
        match.legs = {
            1: { hScore: leg1Home, aScore: leg1Away },
            2: { hScore: leg2Home, aScore: leg2Away }
        };
    } else {
        hScoreFinal = parseInt(homeScore) || 0;
        aScoreFinal = parseInt(awayScore) || 0;
    }

    if (hScoreFinal === aScoreFinal) {
        addToast("Draws not allowed in knockout! Please resolve tie.", "error");
        return;
    }

    if (!showGoalModal && (hScoreFinal > 0 || aScoreFinal > 0)) {
        setShowGoalModal(true);
        return;
    }

    match.hScore = hScoreFinal;
    match.aScore = aScoreFinal;
    
    if (hScoreFinal > aScoreFinal) winner = match.home;
    else winner = match.away;
    
    match.winner = winner;

    if (match.nextMatchId) {
      for (let r = selectedMatch.roundIndex + 1; r < newBracket.rounds.length; r++) {
        const nextMatch = newBracket.rounds[r].matches.find(m => m.id === match.nextMatchId);
        if (nextMatch) {
          if (match.nextMatchSlot === 'home') nextMatch.home = winner;
          else nextMatch.away = winner;
          break;
        }
      }
    }

    if (onFinalizeMatch) {
        if (match.isTwoLegged) {
            await onFinalizeMatch({
                matchId: `${match.id}_L1`,
                homeId: match.home.id,
                awayId: match.away.id,
                hScore: parseInt(leg1Home) || 0,
                aScore: parseInt(leg1Away) || 0,
                homeName: match.home.name,
                awayName: match.away.name
            }, {});

            await onFinalizeMatch({
                matchId: `${match.id}_L2`,
                homeId: match.away.id,
                awayId: match.home.id,
                hScore: parseInt(leg2Home) || 0,
                aScore: parseInt(leg2Away) || 0,
                homeName: match.away.name,
                awayName: match.home.name
            }, {}); 
        } else {
            await onFinalizeMatch({
                matchId: match.id,
                homeId: match.home.id,
                awayId: match.away.id,
                hScore: hScoreFinal,
                aScore: aScoreFinal,
                homeName: match.home.name,
                awayName: match.away.name
            }, goalAssignments);
        }
    }

    await updateDoc(doc(db, `projects/${projectId}/bracket/main`), { rounds: newBracket.rounds });
    addToast("Match result updated!", "success");
    setSelectedMatch(null);
    setShowGoalModal(false);
    setGoalAssignments({});
    setHomeScore(""); setAwayScore("");
    setLeg1Home(""); setLeg1Away(""); setLeg2Home(""); setLeg2Away("");
  };

  if (loading) return <div className="p-8 text-center text-black"><div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-none"></div> Loading Bracket...</div>;

  if (!bracket) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in fade-in">
        <div className="bg-white p-6 rounded-none">
          <Briefcase size={48} className="text-black" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-black">Project Bracket</h3>
          <p className="text-black max-w-md mt-2">
            {projectFormat === 'KNOCKOUT' 
                ? "Ready to start the knockout stage. Ensure all participants have joined." 
                : projectFormat === 'HYBRID'
                ? "Finish the group stage to determine qualifiers for the knockout bracket."
                : "Finish the league stage to determine seedings."}
          </p>
        </div>
        {isAdmin && projectFormat === 'KNOCKOUT' && (
          <button onClick={generateBracket} className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-black font-bold rounded-none transition-all shadow-none shadow-none/20 flex items-center gap-2">
            <Briefcase size={20} />
            Start Project & Generate Bracket
          </button>
        )}
        {projectFormat === 'HYBRID' && (
            <div className="bg-white p-4 rounded-none border border-2 border-black text-black text-sm">
                <div className="flex items-center gap-2 justify-center mb-1 text-black font-bold">
                    <AlertCircle size={16} />
                    <span>Awaiting League Conclusion</span>
                </div>
                Bracket will be generated automatically once all league matches are completed.
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-8">
      {projectFormat === 'HYBRID' && bracket.rounds[0].matches.some(m => m.status === 'SCHEDULED_TBD') && (
        <div className="bg-white border border-blue-500/50 p-4 mb-6 rounded-none flex gap-3 mx-4">
            <Info className="text-black" />
            <div>
            <h4 className="font-bold text-black">Projected Knockout Path</h4>
            <p className="text-sm text-black">
                This bracket will fill automatically as the league tables update.
            </p>
            </div>
        </div>
      )}
      <div className="flex gap-8 min-w-max px-4">
        {bracket.rounds.map((round, rIndex) => (
          <div key={round.id} className="flex flex-col justify-around w-72 space-y-8">
            <h3 className="text-center font-bold text-black uppercase tracking-wider text-sm mb-4">{round.name}</h3>
            <div className="flex flex-col justify-around grow space-y-8">
              {round.matches.map((match, mIndex) => (
                <div 
                  key={match.id} 
                  onClick={() => handleMatchClick(rIndex, mIndex)}
                  className={`relative bg-white border ${match.winner ? 'border-2 border-black' : 'border-2 border-black'} rounded-none overflow-hidden transition-all ${isAdmin && match.home && match.away && !match.isBye ? 'cursor-pointer hover:border-purple-500' : ''}`}
                >
                  {match.isTwoLegged && match.legs && (match.legs[1].hScore !== "") ? (
                    <div className="text-[10px] text-center bg-white py-1 text-black border-b border-2 border-black">
                        Leg 1: {match.legs[1].hScore}-{match.legs[1].aScore} | Leg 2: {match.legs[2].hScore}-{match.legs[2].aScore}
                    </div>
                  ) : null}

                  <div className="divide-y divide-slate-800">
                    <div className={`p-3 flex justify-between items-center ${match.winner && match.winner.id === match.home?.id ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black' : ''}`}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs font-bold text-black w-4">{match.home?.seed || '-'}</span>
                        <span className={`text-sm font-bold truncate ${match.winner && match.winner.id === match.home?.id ? 'text-black' : 'text-black'}`}>
                          {match.home?.name || 'TBD'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-black">
                        {match.isTwoLegged ? (match.hScore !== "" ? match.hScore : "-") : match.hScore}
                      </span>
                    </div>
                    
                    <div className={`p-3 flex justify-between items-center ${match.winner && match.winner.id === match.away?.id ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black' : ''}`}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-xs font-bold text-black w-4">{match.away?.seed || '-'}</span>
                        <span className={`text-sm font-bold truncate ${match.winner && match.winner.id === match.away?.id ? 'text-black' : 'text-black'}`}>
                          {match.away?.name || 'TBD'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-black">
                        {match.isTwoLegged ? (match.aScore !== "" ? match.aScore : "-") : match.aScore}
                      </span>
                    </div>
                  </div>
                  
                  {match.isTwoLegged && (
                      <div className="bg-white px-2 py-1 text-center border-t border-2 border-black flex justify-between items-center">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-black">2-Leg Agg</span>
                          {match.legs && match.legs[1].hScore !== "" && (
                              <span className="text-[9px] text-black font-mono">
                                  (L1: {match.legs[1].hScore}-{match.legs[1].aScore}, L2: {match.legs[2].hScore}-{match.legs[2].aScore})
                              </span>
                          )}
                      </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90  p-4" onClick={() => setSelectedMatch(null)}>
          <div className="bg-white border border-2 border-black rounded-none w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-black mb-4 text-center">
                {showGoalModal ? "Goal Details" : "Update Result"}
            </h3>
            
            {showGoalModal ? (
                <div className="space-y-6">
                    {((selectedMatch.isTwoLegged ? ((parseInt(leg1Home)||0) + (parseInt(leg2Away)||0)) : parseInt(homeScore)) > 0) && (
                        <div className="space-y-3">
                            <div className="text-sm font-bold text-black uppercase tracking-wider border-b border-2 border-black pb-1">
                                {selectedMatch.home.name} KPIs
                            </div>
                            {Array.from({ length: (selectedMatch.isTwoLegged ? ((parseInt(leg1Home)||0) + (parseInt(leg2Away)||0)) : parseInt(homeScore)) }).map((_, i) => (
                                <div key={`home_goal_${i}`} className="bg-white p-3 rounded-none space-y-2">
                                    <div className="text-xs text-black font-bold">Goal {i + 1}</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select 
                                            className="bg-white text-black text-sm p-2 rounded border border-2 border-black outline-none focus:border-purple-500"
                                            onChange={(e) => handleGoalAssignment(i, 'scorer', e.target.value, 'home')}
                                        >
                                            <option value="">Scorer...</option>
                                            {getSquad(selectedMatch.home.id).map(p => (
                                                <option key={p.id} value={p.id} disabled={goalAssignments[`home_${i}`]?.assist === p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                        <select 
                                            className="bg-white text-black text-sm p-2 rounded border border-2 border-black outline-none focus:border-purple-500"
                                            onChange={(e) => handleGoalAssignment(i, 'assist', e.target.value, 'home')}
                                        >
                                            <option value="">Assist...</option>
                                            {getSquad(selectedMatch.home.id).map(p => (
                                                <option key={p.id} value={p.id} disabled={goalAssignments[`home_${i}`]?.scorer === p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {((selectedMatch.isTwoLegged ? ((parseInt(leg1Away)||0) + (parseInt(leg2Home)||0)) : parseInt(awayScore)) > 0) && (
                        <div className="space-y-3">
                            <div className="text-sm font-bold text-black uppercase tracking-wider border-b border-2 border-black pb-1">
                                {selectedMatch.away.name} KPIs
                            </div>
                            {Array.from({ length: (selectedMatch.isTwoLegged ? ((parseInt(leg1Away)||0) + (parseInt(leg2Home)||0)) : parseInt(awayScore)) }).map((_, i) => (
                                <div key={`away_goal_${i}`} className="bg-white p-3 rounded-none space-y-2">
                                    <div className="text-xs text-black font-bold">Goal {i + 1}</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select 
                                            className="bg-white text-black text-sm p-2 rounded border border-2 border-black outline-none focus:border-purple-500"
                                            onChange={(e) => handleGoalAssignment(i, 'scorer', e.target.value, 'away')}
                                        >
                                            <option value="">Scorer...</option>
                                            {getSquad(selectedMatch.away.id).map(p => (
                                                <option key={p.id} value={p.id} disabled={goalAssignments[`away_${i}`]?.assist === p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                        <select 
                                            className="bg-white text-black text-sm p-2 rounded border border-2 border-black outline-none focus:border-purple-500"
                                            onChange={(e) => handleGoalAssignment(i, 'assist', e.target.value, 'away')}
                                        >
                                            <option value="">Assist...</option>
                                            {getSquad(selectedMatch.away.id).map(p => (
                                                <option key={p.id} value={p.id} disabled={goalAssignments[`away_${i}`]?.scorer === p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <>
                {selectedMatch.isTwoLegged ? (
                    <div className="space-y-6">
                        <div className="bg-white p-4 rounded-none">
                            <div className="text-xs font-bold text-black uppercase mb-2 text-center">Leg 1 (Home vs Away)</div>
                            <div className="flex justify-between items-center gap-4">
                                <div className="text-center flex-1">
                                    <div className="text-sm font-bold text-black mb-1 truncate">{selectedMatch.home.name}</div>
                                    <input type="number" value={leg1Home} onChange={e => setLeg1Home(e.target.value)} className="w-12 h-12 bg-white rounded-none text-center text-xl font-bold text-black border border-2 border-black focus:border-purple-500 outline-none" />
                                </div>
                                <div className="text-black font-bold">-</div>
                                <div className="text-center flex-1">
                                    <div className="text-sm font-bold text-black mb-1 truncate">{selectedMatch.away.name}</div>
                                    <input type="number" value={leg1Away} onChange={e => setLeg1Away(e.target.value)} className="w-12 h-12 bg-white rounded-none text-center text-xl font-bold text-black border border-2 border-black focus:border-purple-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-none">
                            <div className="text-xs font-bold text-black uppercase mb-2 text-center">Leg 2 (Away vs Home)</div>
                            <div className="flex justify-between items-center gap-4">
                                <div className="text-center flex-1">
                                    <div className="text-sm font-bold text-black mb-1 truncate">{selectedMatch.away.name}</div>
                                    <input type="number" value={leg2Home} onChange={e => setLeg2Home(e.target.value)} className="w-12 h-12 bg-white rounded-none text-center text-xl font-bold text-black border border-2 border-black focus:border-purple-500 outline-none" />
                                </div>
                                <div className="text-black font-bold">-</div>
                                <div className="text-center flex-1">
                                    <div className="text-sm font-bold text-black mb-1 truncate">{selectedMatch.home.name}</div>
                                    <input type="number" value={leg2Away} onChange={e => setLeg2Away(e.target.value)} className="w-12 h-12 bg-white rounded-none text-center text-xl font-bold text-black border border-2 border-black focus:border-purple-500 outline-none" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center text-sm text-black">
                            Aggregate: <span className="text-black font-bold">{(parseInt(leg1Home)||0) + (parseInt(leg2Away)||0)}</span> - <span className="text-black font-bold">{(parseInt(leg1Away)||0) + (parseInt(leg2Home)||0)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-center mb-6 gap-4">
                    <div className="text-center flex-1">
                        <div className="text-sm font-bold text-black mb-2 truncate">{selectedMatch.home.name}</div>
                        <input 
                        type="number" 
                        value={homeScore} 
                        onChange={e => setHomeScore(e.target.value)}
                        className="w-16 h-16 bg-white rounded-none text-center text-2xl font-bold text-black border border-2 border-black focus:border-purple-500 outline-none"
                        />
                    </div>
                    <div className="text-black font-bold">VS</div>
                    <div className="text-center flex-1">
                        <div className="text-sm font-bold text-black mb-2 truncate">{selectedMatch.away.name}</div>
                        <input 
                        type="number" 
                        value={awayScore} 
                        onChange={e => setAwayScore(e.target.value)}
                        className="w-16 h-16 bg-white rounded-none text-center text-2xl font-bold text-black border border-2 border-black focus:border-purple-500 outline-none"
                        />
                    </div>
                    </div>
                )}
                </>
            )}
            
            <button 
              onClick={updateMatchResult}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-black font-bold rounded-none transition-colors mt-6"
            >
              {showGoalModal ? "Confirm & Save" : "Next"}
            </button>
          </div>
        </div>
      )}
      {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
    </div>
  );
};

export default BracketView;
