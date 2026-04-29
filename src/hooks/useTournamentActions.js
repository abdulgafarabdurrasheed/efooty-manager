import { 
  collection, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  increment,
  getDoc,
  setDoc,
  arrayUnion,
  writeBatch,
  arrayRemove,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { db } from '../firebase';
import { generateProjectFixtures } from '../utils/scheduler';

/**
 * @param {string} projectId
 * @param {Object} user
 * @param {Object} project
 * @param {Array} players
 * @param {Array} squadPlayers
 * @param {Array} matches
 * @param {Function} addToast
 * @param {Function} navigate
 * @returns {Object}
 */
export function useTournamentActions({
  projectId,
  user,
  project,
  players,
  squadPlayers,
  matches,
  addToast,
  navigate
}) {

    const isDemo = () => {
        if (projectId === 'demo-project') {
            addToast("Demo Mode: This executive action requires level 4 Synergy Clearance.", "error");
            return true;
        }
        return false;
    }

  const handleAddPlayer = async (newPlayer, gameplan) => {
    if (isDemo()) return;
    if (!user || !projectId) return;
    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        participants: arrayUnion(user.uid)
      });

      const directorRef = doc(db, `projects/${projectId}/directors`, user.uid);
      const directorSnap = await getDoc(directorRef);

      if (directorSnap.exists()) {
        await updateDoc(directorRef, { status: 'active' });
        addToast("Welcome back! Your stats and squad have been restored.", "success");
      } else {
        await setDoc(directorRef, { 
          ...newPlayer, 
          status: 'active',
          formation: gameplan.name || "4-4-2"
        });

        if (gameplan && gameplan.players && gameplan.players.length > 0) {
          const batch = writeBatch(db);
          gameplan.players.forEach(p => {
            const squadRef = doc(collection(db, `projects/${projectId}/squad`));
            batch.set(squadRef, {
              name: p.name,
              position: p.position || 'FWD',
              directorId: String(user.uid),
              goals: 0,
              assists: 0,
              cleanSheets: 0
            });
          });
          await batch.commit();
        }
      }

    } catch (error) {
      console.error("Error joining project:", error);
      addToast("Failed to join. You may not have permission or the project is closed.", "error");
    }
  };

  const handleSyncSquad = async (gameplan) => {
    if (isDemo()) return;
    if (!user || !projectId || !gameplan) return;
    
    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        participants: arrayUnion(user.uid)
      });

      const directorRef = doc(db, `projects/${projectId}/directors`, user.uid);
      const directorSnap = await getDoc(directorRef);
      
      if (!directorSnap.exists()) {
        await setDoc(directorRef, {
          name: user.displayName,
          uid: user.uid,
          photoURL: user.photoURL,
          team: gameplan.teamName || gameplan.name,
          matchesPlayed: 0,
          wins: 0, draws: 0, losses: 0,
          goalsFor: 0, goalsAgainst: 0,
          cleanSheets: 0, assists: 0
        });
      } else {
        await updateDoc(directorRef, {
           team: gameplan.teamName || gameplan.name
        });
      }

      const q = query(collection(db, `projects/${projectId}/squad`), where("directorId", "==", String(user.uid)));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      gameplan.players.forEach(p => {
        const squadRef = doc(collection(db, `projects/${projectId}/squad`));
        batch.set(squadRef, {
          name: p.name,
          position: p.position || 'FWD',
          directorId: String(user.uid),
          goals: 0,
          assists: 0,
          cleanSheets: 0
        });
      });

      await batch.commit();
      addToast("Squad successfully registered for this project!", "success");
    } catch (error) {
      console.error("Error syncing squad:", error);
      addToast(`Failed to sync squad: ${error.message}`, "error");
    }
  };

  const updateSquadStat = async (id, field, value) => {
    if (!user || !projectId) return;
    await updateDoc(doc(db, `projects/${projectId}/squad`, id), {
      [field]: increment(value)
    });
  };

  const handleMatchClick = (match, setSelectedMatchForLogging, setScoreModalOpen) => {
    if (isDemo()) { addToast("Demo Mode: Action Restricted", "error"); return; }
    const previousIncomplete = matches.some(m => m.round < match.round && m.status !== 'COMPLETED');
    if (previousIncomplete) {
        addToast(`Cannot log Round ${match.round} until all previous rounds are completed.`, "error");
        return;
    }
    setSelectedMatchForLogging(match);
    setScoreModalOpen(true);
  };

  const handleScoreConfirm = async (match, hScore, aScore, setPendingMatch, setScoreModalOpen, finalizeMatch) => {
    if (isDemo()) return;
    const matchData = {
        matchId: match.id,
        homeId: match.home?.id || match.homeId,
        awayId: match.away?.id || match.awayId,
        hScore: parseInt(hScore),
        aScore: parseInt(aScore),
        homeName: match.homeName || match.home?.name,
        awayName: match.awayName || match.away?.name,
        type: match.type
    };
    
    setPendingMatch(matchData);
    setScoreModalOpen(false);

    if (matchData.hScore === 0 && matchData.aScore === 0) {
        await finalizeMatch(matchData, {});
        setPendingMatch(null);
    }
  };

  const finalizeMatch = async (matchData, assignments, pendingMatch, setPendingMatch) => {
    const data = matchData || pendingMatch;
    if (!data || !user) return;
    const { matchId, homeId, awayId, hScore, aScore, homeName, awayName } = data;

    const batch = writeBatch(db);

    let oldMatch = null;
    let matchDocRef;
    
    if (matchId) {
        matchDocRef = doc(db, `projects/${projectId}/matches`, matchId);
        const matchSnap = await getDoc(matchDocRef);
        if (matchSnap.exists()) {
            oldMatch = matchSnap.data();
        }
    } else {
        matchDocRef = doc(collection(db, `projects/${projectId}/matches`));
    }

    if (oldMatch && oldMatch.status === 'COMPLETED') {
        const { hScore: oldH, aScore: oldA, assignments: oldAssignments } = oldMatch;
        
        if (typeof oldH === 'number' && typeof oldA === 'number') {
            if (oldMatch.type !== 'KNOCKOUT') {
                const homeMgrRef = doc(db, `projects/${projectId}/directors`, homeId);
                batch.update(homeMgrRef, {
                    matchesPlayed: increment(-1),
                    goalsFor: increment(-oldH),
                    goalsAgainst: increment(-oldA),
                    wins: increment(oldH > oldA ? -1 : 0),
                    losses: increment(oldH < oldA ? -1 : 0),
                    draws: increment(oldH === oldA ? -1 : 0),
                    cleanSheets: increment(oldA === 0 ? -1 : 0),
                    assists: increment(oldH > 0 ? -1 : 0)
                });

                const awayMgrRef = doc(db, `projects/${projectId}/directors`, awayId);
                batch.update(awayMgrRef, {
                    matchesPlayed: increment(-1),
                    goalsFor: increment(-oldA),
                    goalsAgainst: increment(-oldH),
                    wins: increment(oldA > oldH ? -1 : 0),
                    losses: increment(oldA < oldH ? -1 : 0),
                    draws: increment(oldA === oldH ? -1 : 0),
                    cleanSheets: increment(oldH === 0 ? -1 : 0),
                    assists: increment(oldA > 0 ? -1 : 0)
                });
            }

            if (oldAssignments) {
                Object.values(oldAssignments).forEach(assignment => {
                    if (assignment.scorer) {
                        batch.update(doc(db, `projects/${projectId}/squad`, assignment.scorer), { goals: increment(-1) });
                    }
                    if (assignment.assist) {
                        batch.update(doc(db, `projects/${projectId}/squad`, assignment.assist), { assists: increment(-1) });
                    }
                });
            }

            if (oldA === 0) {
                const homeDefenders = squadPlayers.filter(p => p.directorId === homeId && (p.position === 'DEF' || p.position === 'GK'));
                homeDefenders.forEach(p => {
                    batch.update(doc(db, `projects/${projectId}/squad`, p.id), { cleanSheets: increment(-1) });
                });
            }
            if (oldH === 0) {
                const awayDefenders = squadPlayers.filter(p => p.directorId === awayId && (p.position === 'DEF' || p.position === 'GK'));
                awayDefenders.forEach(p => {
                    batch.update(doc(db, `projects/${projectId}/squad`, p.id), { cleanSheets: increment(-1) });
                });
            }
        }
    }

    const isKnockout = data.type === 'KNOCKOUT' || 
                       (matchId && matchId.startsWith('R') && matchId.includes('_M')) ||
                       (data.roundName && (data.roundName.includes('Final') || data.roundName.includes('Round')));

    if (!isKnockout) {
        const homeMgrRef = doc(db, `projects/${projectId}/directors`, homeId);
        batch.update(homeMgrRef, {
            matchesPlayed: increment(1),
            goalsFor: increment(hScore || 0),
            goalsAgainst: increment(aScore || 0),
            wins: increment(hScore > aScore ? 1 : 0),
            losses: increment(hScore < aScore ? 1 : 0),
            draws: increment(hScore === aScore ? 1 : 0),
            cleanSheets: increment(aScore === 0 ? 1 : 0),
            assists: increment(hScore > 0 ? 1 : 0)
        });

        const awayMgrRef = doc(db, `projects/${projectId}/directors`, awayId);
        batch.update(awayMgrRef, {
            matchesPlayed: increment(1),
            goalsFor: increment(aScore || 0),
            goalsAgainst: increment(hScore || 0),
            wins: increment(aScore > hScore ? 1 : 0),
            losses: increment(aScore < hScore ? 1 : 0),
            draws: increment(aScore === hScore ? 1 : 0),
            cleanSheets: increment(hScore === 0 ? 1 : 0),
            assists: increment(aScore > 0 ? 1 : 0)
        });
    }

    Object.values(assignments).forEach(assignment => {
      if (assignment.scorer) {
        batch.update(doc(db, `projects/${projectId}/squad`, assignment.scorer), { goals: increment(1) });
      }
      if (assignment.assist) {
        batch.update(doc(db, `projects/${projectId}/squad`, assignment.assist), { assists: increment(1) });
      }
    });

    if (aScore === 0) {
      const homeDefenders = squadPlayers.filter(p => p.directorId === homeId && (p.position === 'DEF' || p.position === 'GK'));
      homeDefenders.forEach(p => {
        batch.update(doc(db, `projects/${projectId}/squad`, p.id), { cleanSheets: increment(1) });
      });
    }
    if (hScore === 0) {
      const awayDefenders = squadPlayers.filter(p => p.directorId === awayId && (p.position === 'DEF' || p.position === 'GK'));
      awayDefenders.forEach(p => {
        batch.update(doc(db, `projects/${projectId}/squad`, p.id), { cleanSheets: increment(1) });
      });
    }

    const matchLog = {
      id: matchId ? matchId : Date.now().toString(),
      homeName, awayName, hScore, aScore,
      homeId, awayId,
      assignments,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: serverTimestamp(),
      status: 'COMPLETED'
    };
    
    if (matchId && (matchId.includes('_L1') || matchId.includes('_L2'))) {
        batch.update(matchDocRef, {
            hScore, aScore, assignments, status: 'COMPLETED'
        });
    } else {
        batch.set(matchDocRef, matchLog, { merge: true });
    }

    await batch.commit();

    if (project.format === 'HYBRID' && (!matchId || !matchId.startsWith('R'))) {
        const allLeagueReviews = await getDocs(query(collection(db, `projects/${projectId}/matches`), where('type', '==', 'LEAGUE')));
        if (allLeagueReviews.empty) return;

        const incompleteQuery = query(
            collection(db, `projects/${projectId}/matches`), 
            where('type', '==', 'LEAGUE'),
            where('status', '==', 'SCHEDULED')
        );
        const incompleteSnap = await getDocs(incompleteQuery);
        
        if (incompleteSnap.empty) {
            await advanceToKnockout();
        }
    }

    if (matchId && (matchId.includes('_L1') || matchId.includes('_L2'))) {
        await syncToBracketTwoLegged(matchId, hScore, aScore);
    }

    if (matchId && matchId.startsWith('R') && !matchId.includes('_L')) {
        await syncToNextMatchSingleLeg(matchId, homeId, awayId, hScore, aScore, homeName, awayName);
    }
    
    if (!matchData && setPendingMatch) {
        setPendingMatch(null);
    }

    const matchesRefCheck = collection(db, `projects/${projectId}/matches`);
    const matchesSnapCheck = await getDocs(matchesRefCheck);
    const allReviewsCheck = matchesSnapCheck.docs.map(doc => doc.data());
    const remainingReviews = allReviewsCheck.filter(m => m.status !== 'COMPLETED');

    if (remainingReviews.length === 0) {
        console.log("No matches remaining. Auto-ending project.");
        const tourneyRef = doc(db, "projects", projectId);
        await updateDoc(tourneyRef, { 
            status: 'ended',
            endedAt: serverTimestamp()
        });
        addToast("🏆 Project Complete! Status updated to Ended.", "success");
    }
  };

  const syncToBracketTwoLegged = async (matchId, hScore, aScore) => {
    const baseId = matchId.split('_L')[0];
    const legNum = parseInt(matchId.split('_L')[1]);
    
    const bracketRef = doc(db, `projects/${projectId}/bracket/main`);
    const bracketSnap = await getDoc(bracketRef);
    
    if (bracketSnap.exists()) {
        const bracketData = bracketSnap.data();
        let rounds = bracketData.rounds;
        let matchFound = false;

        for (let r = 0; r < rounds.length; r++) {
            const matchIndex = rounds[r].matches.findIndex(m => m.id === baseId);
            if (matchIndex !== -1) {
                const match = rounds[r].matches[matchIndex];
                
                if (!match.legs) match.legs = { 1: { hScore: '', aScore: '' }, 2: { hScore: '', aScore: '' } };
                match.legs[legNum] = { hScore: hScore.toString(), aScore: aScore.toString() };
                
                const l1h = parseInt(match.legs[1].hScore) || 0;
                const l1a = parseInt(match.legs[1].aScore) || 0;
                const l2h = parseInt(match.legs[2].hScore) || 0;
                const l2a = parseInt(match.legs[2].aScore) || 0;
                
                const aggHome = l1h + l2a;
                const aggAway = l1a + l2h;
                
                match.hScore = aggHome;
                match.aScore = aggAway;
                
                if (aggHome > aggAway) match.winner = match.home;
                else if (aggAway > aggHome) match.winner = match.away;
                
                if (match.winner) {
                    const parts = baseId.split('_');
                    if (parts.length >= 2) {
                        const roundNum = parseInt(parts[0].substring(1));
                        const matchNum = parseInt(parts[1].substring(1));
                        
                        if (!isNaN(roundNum) && !isNaN(matchNum)) {
                            const nextRoundNum = roundNum + 1;
                            const nextMatchNum = Math.ceil(matchNum / 2);
                            const nextMatchId = `R${nextRoundNum}_M${nextMatchNum}`;
                            const isHomeInNext = (matchNum % 2 !== 0);

                            for (let nr = r + 1; nr < rounds.length; nr++) {
                                const nextMatchIndex = rounds[nr].matches.findIndex(nm => nm.id === nextMatchId);
                                if (nextMatchIndex !== -1) {
                                    if (isHomeInNext) rounds[nr].matches[nextMatchIndex].home = match.winner;
                                    else rounds[nr].matches[nextMatchIndex].away = match.winner;
                                    break;
                                }
                            }

                            if (match.legs[1].hScore !== '' && match.legs[2].hScore !== '') {
                                const nextMatchRef = doc(db, `projects/${projectId}/matches`, nextMatchId);
                                const updateData = {};
                                if (isHomeInNext) {
                                    updateData.homeId = match.winner.id;
                                    updateData.homeName = match.winner.name;
                                    updateData['home.id'] = match.winner.id; 
                                    updateData['home.name'] = match.winner.name;
                                } else {
                                    updateData.awayId = match.winner.id;
                                    updateData.awayName = match.winner.name;
                                    updateData['away.id'] = match.winner.id;
                                    updateData['away.name'] = match.winner.name;
                                }
                                updateDoc(nextMatchRef, updateData).catch(err => console.error("Error updating next match:", err));
                            }
                        }
                    }
                }
                
                matchFound = true;
                break;
            }
        }
        
        if (matchFound) {
            await updateDoc(bracketRef, { rounds });
        }
    }
  };

  const syncToNextMatchSingleLeg = async (matchId, homeId, awayId, hScore, aScore, homeName, awayName) => {
    const parts = matchId.split('_');
    if (parts.length >= 2) {
        const roundNum = parseInt(parts[0].substring(1));
        const matchNum = parseInt(parts[1].substring(1));
        
        if (!isNaN(roundNum) && !isNaN(matchNum)) {
            const nextRoundNum = roundNum + 1;
            const nextMatchNum = Math.ceil(matchNum / 2);
            const nextMatchId = `R${nextRoundNum}_M${nextMatchNum}`;
            const isHomeInNext = (matchNum % 2 !== 0);
            
            const winnerId = hScore > aScore ? homeId : awayId;
            const winnerName = hScore > aScore ? homeName : awayName;
            const winnerObj = { id: winnerId, name: winnerName };
            
            const nextMatchRef = doc(db, `projects/${projectId}/matches`, nextMatchId);
            
            try {
                const updateData = {};
                if (isHomeInNext) {
                    updateData.homeId = winnerId;
                    updateData.homeName = winnerName;
                    updateData['home.id'] = winnerId; 
                    updateData['home.name'] = winnerName;
                } else {
                    updateData.awayId = winnerId;
                    updateData.awayName = winnerName;
                    updateData['away.id'] = winnerId;
                    updateData['away.name'] = winnerName;
                }
                
                await updateDoc(nextMatchRef, updateData);
            } catch (err) {
                console.log("Next match not found or error updating:", err);
            }

            const bracketRef = doc(db, `projects/${projectId}/bracket/main`);
            const bracketSnap = await getDoc(bracketRef);
            
            if (bracketSnap.exists()) {
                const bracketData = bracketSnap.data();
                let rounds = bracketData.rounds;
                let bracketUpdated = false;

                for (let r = 0; r < rounds.length; r++) {
                    const matchIndex = rounds[r].matches.findIndex(m => m.id === matchId);
                    if (matchIndex !== -1) {
                        rounds[r].matches[matchIndex].hScore = hScore;
                        rounds[r].matches[matchIndex].aScore = aScore;
                        rounds[r].matches[matchIndex].winner = winnerObj;
                        rounds[r].matches[matchIndex].status = 'COMPLETED';
                        bracketUpdated = true;
                        break;
                    }
                }

                for (let r = 0; r < rounds.length; r++) {
                    const nextMatchIndex = rounds[r].matches.findIndex(m => m.id === nextMatchId);
                    if (nextMatchIndex !== -1) {
                        if (isHomeInNext) {
                            rounds[r].matches[nextMatchIndex].home = winnerObj;
                        } else {
                            rounds[r].matches[nextMatchIndex].away = winnerObj;
                        }
                        bracketUpdated = true;
                        break;
                    }
                }

                if (bracketUpdated) {
                    await updateDoc(bracketRef, { rounds });
                }
            }
        }
    }
  };

  const advanceToKnockout = async () => {
      const directorsSnap = await getDocs(collection(db, `projects/${projectId}/directors`));
      let directors = directorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      let qualifiers = [];
      
      if (project.settings.hybridConfig.type === 'SINGLE_LEAGUE') {
          const totalAdvancers = project.settings.hybridConfig.totalAdvancers || 4;
          directors.sort((a, b) => {
              const ptsA = (a.wins * 3) + a.draws;
              const ptsB = (b.wins * 3) + b.draws;
              return ptsB - ptsA || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
          });
          qualifiers = directors.slice(0, totalAdvancers);
      } else {
          const groups = {};
          directors.forEach(m => {
              const gid = m.groupId || 'A';
              if (!groups[gid]) groups[gid] = [];
              groups[gid].push(m);
          });
          
          const advancersPerGroup = project.settings.hybridConfig.advancersPerGroup || 2;
          const winners = [];
          const runnersUp = [];
          
          Object.keys(groups).sort().forEach(gid => {
              groups[gid].sort((a, b) => {
                  const ptsA = (a.wins * 3) + a.draws;
                  const ptsB = (b.wins * 3) + b.draws;
                  return ptsB - ptsA || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
              });
              if (groups[gid][0]) winners.push(groups[gid][0]);
              if (groups[gid][1] && advancersPerGroup > 1) runnersUp.push(groups[gid][1]);
          });
          
          winners.sort((a, b) => {
              const ptsA = (a.wins * 3) + a.draws;
              const ptsB = (b.wins * 3) + b.draws;
              return ptsB - ptsA || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
          });
          runnersUp.sort((a, b) => {
              const ptsA = (a.wins * 3) + a.draws;
              const ptsB = (b.wins * 3) + b.draws;
              return ptsB - ptsA || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
          });
          
          qualifiers = [...winners, ...runnersUp];
      }
      
      const bracketRef = doc(db, `projects/${projectId}/bracket/main`);
      const bracketSnap = await getDoc(bracketRef);
      if (!bracketSnap.exists()) return;
      
      const bracketData = bracketSnap.data();
      const rounds = bracketData.rounds;
      const r1Reviews = rounds[0].matches;
      
      const batch = writeBatch(db);
      const matchesRef = collection(db, `projects/${projectId}/matches`);

      const resolveRef = (ref) => {
          if (!ref) return null;
          if (ref.type === 'LEAGUE_SEED') {
              return qualifiers[ref.seed - 1] || { id: 'BYE', name: 'BYE' };
          }
          if (ref.type === 'GROUP_Winner') {
              const groupDirectors = directors.filter(m => m.groupId === ref.group);
              groupDirectors.sort((a, b) => {
                  const ptsA = (a.wins * 3) + a.draws;
                  const ptsB = (b.wins * 3) + b.draws;
                  return ptsB - ptsA || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
              });
              return groupDirectors[0] || { id: 'BYE', name: 'BYE' };
          }
          if (ref.type === 'GROUP_RunnerUp') {
              const groupDirectors = directors.filter(m => m.groupId === ref.group);
              groupDirectors.sort((a, b) => {
                  const ptsA = (a.wins * 3) + a.draws;
                  const ptsB = (b.wins * 3) + b.draws;
                  return ptsB - ptsA || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
              });
              return groupDirectors[1] || { id: 'BYE', name: 'BYE' };
          }
          return null;
      };

      for (let i = 0; i < r1Reviews.length; i++) {
          const match = r1Reviews[i];
          let home = null;
          let away = null;

          if (match.homeRef && match.awayRef) {
              home = resolveRef(match.homeRef);
              away = resolveRef(match.awayRef);
          } else {
              const size = r1Reviews.length * 2;
              home = qualifiers[i] || { id: 'BYE', name: 'BYE' };
              away = qualifiers[size - 1 - i] || { id: 'BYE', name: 'BYE' };
          }
          
          const isByeMatch = home.id === 'BYE' || away.id === 'BYE';
          let winner = null;
          if (away.id === 'BYE') winner = home;
          if (home.id === 'BYE') winner = away;
          
          match.home = home;
          match.away = away;
          match.status = isByeMatch ? 'COMPLETED' : 'SCHEDULED';
          match.winner = winner;
          match.isBye = isByeMatch;
          
          if (match.isTwoLegged) {
              batch.update(doc(matchesRef, `${match.id}_L1`), {
                  home: home,
                  away: away,
                  status: 'SCHEDULED'
              });
              batch.update(doc(matchesRef, `${match.id}_L2`), {
                  home: away,
                  away: home,
                  status: 'SCHEDULED'
              });
          } else {
              batch.update(doc(matchesRef, match.id), {
                  home: home,
                  away: away,
                  status: isByeMatch ? 'COMPLETED' : 'SCHEDULED',
                  winner: winner ? winner : null
              });
          }
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

      batch.update(bracketRef, { rounds });
      await batch.commit();
      addToast("League stage complete! Knockout bracket generated.", "success");
  };

  const handleStartProject = async () => {
    if (isDemo()) return;
    if (project.format === 'HYBRID') {
        if (project.settings?.hybridConfig?.type === 'MULTI_GROUP') {
            const { numGroups, teamsPerGroup } = project.settings.hybridConfig;
            const requiredTeams = numGroups * teamsPerGroup;
            
            if (players.length !== requiredTeams) {
                const diff = requiredTeams - players.length;
                const action = diff > 0 ? `Add ${diff} more` : `Remove ${Math.abs(diff)}`;
                addToast(`Invalid number of participants! Required: ${requiredTeams}. Please ${action} participants.`, "error");
                return;
            }
        } else if (project.settings?.hybridConfig?.type === 'SINGLE_LEAGUE') {
            const totalAdvancers = project.settings.hybridConfig.totalAdvancers || 16;
            const minRequired = totalAdvancers + 2;
            
            if (players.length < minRequired) {
                const diff = minRequired - players.length;
                addToast(`Insufficient participants! For Top ${totalAdvancers} to qualify, you need at least ${minRequired} players. Please add ${diff} more.`, "error");
                return;
            }
        }
    }

    if (!window.confirm("Start the project? This will lock the participants list and generate fixtures.")) return;
    
    try {
        const batch = writeBatch(db);
        let updatedPlayers = [...players];

        if (project.format === 'HYBRID' && project.settings?.hybridConfig?.type === 'MULTI_GROUP') {
            const { numGroups } = project.settings.hybridConfig;
            updatedPlayers = [...players].sort(() => Math.random() - 0.5);
            
            const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            updatedPlayers = updatedPlayers.map((player, index) => {
                const groupIndex = index % numGroups;
                const groupId = groupNames[groupIndex];
                
                const playerRef = doc(db, `projects/${projectId}/directors`, player.id);
                batch.update(playerRef, { groupId: groupId });
                
                return { ...player, groupId };
            });
        } else if (project.format === 'KNOCKOUT') {
            updatedPlayers = [...players].sort(() => Math.random() - 0.5);
        }

        const startDate = project.startDate || new Date().toISOString().split('T')[0];
        const endDate = project.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const { matches: fixtures, bracket } = generateProjectFixtures(project, updatedPlayers, startDate, endDate);
        
        const matchesCollection = collection(db, `projects/${projectId}/matches`);
        
        const chunks = [];
        let currentChunk = batch;
        let count = updatedPlayers.length;

        fixtures.forEach((match) => {
            const matchRef = match.id && match.type === 'KNOCKOUT' ? doc(matchesCollection, match.id) : doc(matchesCollection); 
            
            currentChunk.set(matchRef, {
                ...match,
                createdAt: serverTimestamp()
            });
            count++;

            if (count >= 450) {
                chunks.push(currentChunk);
                currentChunk = writeBatch(db);
                count = 0;
            }
        });

        if ((project.format === 'HYBRID' || project.format === 'KNOCKOUT') && bracket) {
             const bracketRounds = bracket.map((roundReviews, index) => ({
                 id: index + 1,
                 name: roundReviews[0].roundName,
                 matches: roundReviews
             }));
             
             const bracketRef = doc(db, `projects/${projectId}/bracket/main`);
             currentChunk.set(bracketRef, { rounds: bracketRounds });
        }

        chunks.push(currentChunk);

        const projectRef = doc(db, "projects", projectId);
        chunks[chunks.length - 1].update(projectRef, { status: 'ACTIVE' });

        for (const chunk of chunks) {
            await chunk.commit();
        }

        addToast(`Project started! Generated ${fixtures.length} fixtures.`, "success");

    } catch (error) {
        console.error("Error starting project:", error);
        addToast("Failed to start project.", "error");
    }
  };

  const handleCopyLink = async () => {
    let code = project.inviteCode;
    if (!code) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        await updateDoc(doc(db, "projects", projectId), { inviteCode: code });
    }

    const url = `${window.location.origin}/project/${projectId}?invite=${code}`;
    navigator.clipboard.writeText(url);
    addToast("Invite link copied to clipboard!", "success");
  };

  const executeToggleAdmin = async (adminModal, setAdminModal) => {
    const { uid: targetUid, isAdmin } = adminModal;
    if (!project || user.uid !== project.ownerId || !targetUid) return;
    
    const currentAdmins = project.admins || [];
    const newAdmins = isAdmin 
      ? currentAdmins.filter(id => id !== targetUid)
      : [...currentAdmins, targetUid];

    try {
      await updateDoc(doc(db, "projects", project.id), {
        admins: newAdmins
      });
      setAdminModal({ isOpen: false, uid: null, name: null, isAdmin: false });
    } catch (error) {
      console.error("Error updating admins:", error);
      addToast("Failed to update admin status.", "error");
    }
  };

  const handleRemoveDirector = async (directorId, directorName) => {
    if (isDemo()) return;
    if (!window.confirm(`Are you sure you want to remove ${directorName} from the project? This will delete their squad and stats.`)) return;
    
    try {
      await updateDoc(doc(db, "projects", projectId), {
        participants: arrayRemove(directorId)
      });

      await deleteDoc(doc(db, `projects/${projectId}/directors`, directorId));

      const q = query(collection(db, `projects/${projectId}/squad`), where("directorId", "==", directorId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

    } catch (error) {
      console.error("Error removing director:", error);
      addToast("Failed to remove director.", "error");
    }
  };

  const handleLeaveProject = async () => {
    if (isDemo()) return;
    if (!window.confirm("Are you sure you want to leave this project? Your stats will be saved if you decide to rejoin later.")) return;
    
    try {
      await updateDoc(doc(db, "projects", projectId), {
        participants: arrayRemove(user.uid)
      });

      await updateDoc(doc(db, `projects/${projectId}/directors`, user.uid), {
        status: 'left'
      });

      if (user.uid !== project.ownerId) {
        navigate('/');
      }
    } catch (error) {
      console.error("Error leaving project:", error);
      addToast("Failed to leave project.", "error");
    }
  };

  const handleEndProject = async (setShowEndModal, setShowSettings) => {
    if (isDemo()) return;
    try {
      await updateDoc(doc(db, "projects", projectId), {
        status: 'ended'
      });
      setShowEndModal(false);
      setShowSettings(false);
    } catch (error) {
      console.error("Error ending project:", error);
      addToast("Failed to end project.", "error");
    }
  };

  const handleDeleteProject = async () => {
    if (isDemo()) return;
    try {
      const mgrSnap = await getDocs(collection(db, `projects/${projectId}/directors`));
      const batch1 = writeBatch(db);
      mgrSnap.docs.forEach(d => batch1.delete(d.ref));
      await batch1.commit();

      const squadSnap = await getDocs(collection(db, `projects/${projectId}/squad`));
      const batch2 = writeBatch(db);
      squadSnap.docs.forEach(d => batch2.delete(d.ref));
      await batch2.commit();

      const matchSnap = await getDocs(collection(db, `projects/${projectId}/matches`));
      const batch3 = writeBatch(db);
      matchSnap.docs.forEach(d => batch3.delete(d.ref));
      await batch3.commit();

      const bracketSnap = await getDocs(collection(db, `projects/${projectId}/bracket`));
      const batch4 = writeBatch(db);
      bracketSnap.docs.forEach(d => batch4.delete(d.ref));
      await batch4.commit();

      await deleteDoc(doc(db, "projects", projectId));
      
      navigate('/');
    } catch (error) {
      console.error("Error deleting project:", error);
      addToast("Failed to delete project. Check console.", "error");
    }
  };

  return {
    handleAddPlayer,
    handleSyncSquad,
    updateSquadStat,
    handleMatchClick,
    handleScoreConfirm,
    finalizeMatch,
    advanceToKnockout,
    handleStartProject,
    handleCopyLink,
    executeToggleAdmin,
    handleRemoveDirector,
    handleLeaveProject,
    handleEndProject,
    handleDeleteProject
  };
}
