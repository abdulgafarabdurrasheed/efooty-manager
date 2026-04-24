import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, Shield, Activity, Plus, X, Flame, Zap, User, Users, BarChart3, ChevronUp, ChevronDown, CheckCircle2, Shirt, Trash2, Loader2, LogOut, User as UserIcon, Settings, Save, LayoutTemplate, ArrowLeftRight, Share2, Copy, Crown, GitBranch, Search, Network, Lock, Calendar, HelpCircle, TrendingUp, Tv } from 'lucide-react';
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
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
import { auth, db } from './firebase';
import { UserProfile, LoginButton } from './components/AuthComponents';
import BracketView from './components/BracketView';
import FixturesList from './components/FixturesList';
import Toast from './components/Toast';
import { useToast } from './hooks/useToast';
import { generateProjectFixtures } from './utils/scheduler';
import { getFormGuide, getH2HStats } from './utils/analytics';
import PlayerCard from './components/PlayerCard';
import TitleRaceChart from './components/TitleRaceChart';
import GoalDistributionChart from './components/GoalDistributionChart';
import OnboardingTour from './components/OnboardingTour';
import AIOracle from './components/AIOracle';
import SquadViewer from './components/SquadViewer';
import AdminConfirmationModal from './components/AdminConfirmationModal';
import DeleteProjectModal from './components/DeleteProjectModal';
import ScoreEntryModal from './components/ScoreEntryModal';
import EndProjectModal from './components/EndProjectModal';
import SettingsModal from './components/SettingsModal';
import GoalAssignmentModal from './components/GoalAssignmentModal';
import HighlightCard from './components/HighlightCard';
import JoinLeagueButton from './components/JoinLeagueButton';

const getPoints = (player) => (player.wins * 3) + (player.draws * 1);

export default function ProjectView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [players, setPlayers] = useState([]);
  const [squadPlayers, setSquadPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPlayerForCard, setSelectedPlayerForCard] = useState(null);
  const [activeTab, setActiveTab] = useState('directors'); 
  
  const [statsSearch, setStatsSearch] = useState("");
  const [statsFilter, setStatsFilter] = useState("all");
  const [statsSort, setStatsSort] = useState("goals");
  const [viewFormationId, setViewFormationId] = useState(null);

  const [matches, setReviews] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [pendingMatch, setPendingMatch] = useState(null);
  const [adminModal, setAdminModal] = useState({ isOpen: false, uid: null, name: null, isAdmin: false });
  
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [selectedMatchForLogging, setSelectedMatchForLogging] = useState(null);
  const [selectedAnalyticsDirector, setSelectedAnalyticsDirector] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !projectId) return;

    const projectRef = doc(db, "projects", projectId);
    const unsubProject = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() });
      }
    }, (error) => console.error("Project Listen Error:", error));

    const directorsRef = collection(db, `projects/${projectId}/directors`);
    const qDirectors = query(directorsRef, orderBy("matchesPlayed", "desc")); 
    const unsubDirectors = onSnapshot(qDirectors, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(list.filter(p => p.status !== 'left'));
    }, (error) => console.error("Directors Listen Error:", error));

    const squadRef = collection(db, `projects/${projectId}/squad`);
    const unsubSquad = onSnapshot(squadRef, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSquadPlayers(list);
    }, (error) => console.error("Squad Listen Error:", error));

    const matchesRef = collection(db, `projects/${projectId}/matches`);
    const qReviews = query(matchesRef); 
    const unsubReviews = onSnapshot(qReviews, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(list);
      
      const sorted = list
        .filter(m => m.status === 'COMPLETED')
        .sort((a, b) => {
            const timeA = a.timestamp?.seconds || a.date?.seconds || 0;
            const timeB = b.timestamp?.seconds || b.date?.seconds || 0;
            return timeB - timeA;
        });
      setRecentReviews(sorted.slice(0, 5));
    }, (error) => console.error("Reviews Listen Error:", error));

    return () => {
      unsubProject();
      unsubDirectors();
      unsubSquad();
      unsubReviews();
    };
  }, [user, projectId]);
  const leaderboard = useMemo(() => {
    return [...players].sort((a, b) => {
      const ptsA = getPoints(a);
      const ptsB = getPoints(b);
      if (ptsA !== ptsB) return ptsB - ptsA;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
  }, [players]);

  const highlights = useMemo(() => {
    if (activeTab === 'directors') {
      const sortedKPIs = [...players].sort((a, b) => b.goalsFor - a.goalsFor);
      const sortedAssists = [...players].sort((a, b) => b.assists - a.assists);
      const sortedCleanSheets = [...players].sort((a, b) => b.cleanSheets - a.cleanSheets);
      return { topScorer: sortedKPIs[0], topAssister: sortedAssists[0], wall: sortedCleanSheets[0] };
    } else {
      const sortedKPIs = [...squadPlayers].sort((a, b) => b.goals - a.goals);
      const sortedAssists = [...squadPlayers].sort((a, b) => b.assists - a.assists);
      return { topScorer: sortedKPIs[0], topAssister: sortedAssists[0], wall: null };
    }
  }, [players, squadPlayers, activeTab]);

  const handleAddPlayer = async (newPlayer, gameplan) => {
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

  const getDirectorInfo = (directorId) => {
    const director = players.find(p => p.id === directorId);
    return director ? `${director.name} (${director.team})` : "Unknown Team";
  };

  const handleMatchClick = (match) => {
    const previousIncomplete = matches.some(m => m.round < match.round && m.status !== 'COMPLETED');
    if (previousIncomplete) {
        addToast(`Cannot log Round ${match.round} until all previous rounds are completed.`, "error");
        return;
    }
    setSelectedMatchForLogging(match);
    setScoreModalOpen(true);
  };

  const handleScoreConfirm = async (match, hScore, aScore) => {
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

  const finalizeMatch = async (matchData = null, assignments = {}) => {
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
    }

    if (matchId && matchId.startsWith('R') && !matchId.includes('_L')) {
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
    }
    
    if (!matchData) {
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

  const renderLeagueTable = (tablePlayers, title) => (
    <div className="overflow-x-auto mb-8">
      {title && <h3 className="text-lg font-bold text-black mb-4 px-4">{title}</h3>}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs font-bold text-black uppercase tracking-wider border-b border-2 border-black bg-white">
            <th className="p-4 w-16 text-center">Pos</th>
            <th className="p-4">Director / Team</th>
            <th className="p-4 text-center hidden sm:table-cell">MP</th>
            <th className="p-4 text-center hidden md:table-cell">W-D-L</th>
            <th className="p-4 text-center hidden sm:table-cell">GF:GA</th>
            <th className="p-4 text-center">GD</th>
            <th className="p-4 text-center text-black">Pts</th>
            <th className="p-4 text-center w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {tablePlayers.length === 0 && (
            <tr><td colSpan="8" className="p-8 text-center text-black italic">No directors found. Add one to start the league!</td></tr>
          )}
          {tablePlayers.map((player, index) => (
            <tr 
              key={player.id} 
              className="group hover:bg-white transition-colors animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <td className="p-4 text-center font-mono text-black group-hover:text-black">{index + 1}</td>
              <td className="p-4 cursor-pointer" onClick={() => setSelectedPlayer(player)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-none bg-white flex items-center justify-center border border-2 border-black">
                    <span className="text-xs font-bold">{player.team ? player.team.substring(0,2).toUpperCase() : 'FC'}</span>
                  </div>
                  <div>
                    <div className="font-bold text-black group-hover:text-black transition-colors flex items-center gap-2">
                      {player.name}
                      
                      {(() => {
                        const isOwner = user.uid === project.ownerId;
                        const isAdmin = project.admins?.includes(player.uid);
                        const isSelf = user.uid === player.uid;

                        if (isOwner && !isSelf) {
                          return (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => openAdminModal(player.uid, player.name, isAdmin)}
                                className={`p-1.5 rounded-none transition-all ${isAdmin ? 'text-black bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:bg-red-500/20 hover:text-red-500' : 'text-black hover:text-black hover:bg-white'}`}
                                title={isAdmin ? "Remove Admin" : "Make Admin"}
                              >
                                <Crown size={18} className={isAdmin ? "fill-yellow-500 hover:fill-red-500" : ""} />
                              </button>
                              <button 
                                onClick={() => handleRemoveDirector(player.uid, player.name)}
                                className="p-1.5 rounded-none text-black hover:text-red-500 hover:bg-red-500/10 transition-all"
                                title="Remove from Project"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          );
                        }

                        if (project.admins?.includes(user.uid) && !isSelf && player.uid !== project.ownerId && !project.admins?.includes(player.uid)) {
                           return (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => handleRemoveDirector(player.uid, player.name)}
                                className="p-1.5 rounded-none text-black hover:text-red-500 hover:bg-red-500/10 transition-all"
                                title="Remove from Project"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                           );
                        }

                        if (isAdmin) {
                          return <Crown size={16} className="text-black fill-yellow-500" />;
                        }

                        return null;
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-black">{player.team}</div>
                      <div className="flex gap-1">
                        {getFormGuide(player.id, matches).map((res, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-none ${
                              res === 'W' ? 'bg-green-500' : 
                              res === 'D' ? 'bg-white' : 
                              'bg-red-500'
                            }`} 
                            title={res}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-center font-mono text-black hidden sm:table-cell">{player.matchesPlayed}</td>
              <td className="p-4 text-center text-xs text-black hidden md:table-cell">
                <span className="text-green-400">{player.wins}</span>-<span className="text-black">{player.draws}</span>-<span className="text-red-400">{player.losses}</span>
              </td>
              <td className="p-4 text-center font-mono text-black hidden sm:table-cell">{player.goalsFor}:{player.goalsAgainst}</td>
              <td className={`p-4 text-center font-bold ${player.goalsFor - player.goalsAgainst > 0 ? 'text-green-500' : player.goalsFor - player.goalsAgainst < 0 ? 'text-red-500' : 'text-black'}`}>
                {player.goalsFor - player.goalsAgainst > 0 ? '+' : ''}{player.goalsFor - player.goalsAgainst}
              </td>
              <td className="p-4 text-center font-black text-xl text-black">{getPoints(player)}</td>
              <td className="p-4 text-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); setViewFormationId(player.id); }}
                  className="p-2 bg-white hover:bg-white text-black hover:text-black rounded-none transition-colors"
                  title="View Formation"
                >
                  <LayoutTemplate size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMultiGroupTables = () => {
      const groups = {};
      leaderboard.forEach(p => {
          const gid = p.groupId || 'Unassigned';
          if (!groups[gid]) groups[gid] = [];
          groups[gid].push(p);
      });

      const sortedKeys = Object.keys(groups).sort();

      return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-4">
              {sortedKeys.map(gid => (
                  <div key={gid} className="bg-white rounded-none border border-2 border-black overflow-hidden">
                      {renderLeagueTable(groups[gid], `Group ${gid}`)}
                  </div>
              ))}
          </div>
      );
  };

  const openAdminModal = (uid, name, isAdmin) => {
    setAdminModal({ isOpen: true, uid, name, isAdmin });
  };

  const executeToggleAdmin = async () => {
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

  const handleEndProject = async () => {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-6 space-y-6">
        <Briefcase size={80} className="text-black animate-pulse" />
        <div>
          <h2 className="text-3xl font-black text-black tracking-tight mb-2">Welcome to E.F.O.O.T.Y Outcome Tracker</h2>
          <p className="text-black max-w-md mx-auto leading-relaxed">
            The ultimate project tracker for your local leagues. Sign in to manage your squad, create projects, and track stats in real-time.
          </p>
        </div>
        <div className="mt-4 transform scale-110">
          <LoginButton />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-black gap-2">
        <Loader2 className="animate-spin" /> Loading Project...
      </div>
    );
  }

  const isMember = project.participants?.includes(user?.uid);
  const isOwner = project.ownerId === user?.uid;
  const canView = isMember || isOwner || project.visibility === 'PUBLIC' || !project.visibility;

  if (!canView) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-white rounded-none flex items-center justify-center border-4 border-2 border-black shadow-none">
          <Lock size={32} className="text-black" />
        </div>
        
        <div>
          <h1 className="text-2xl font-black text-black mb-2">{project.name}</h1>
          <p className="text-black max-w-xs mx-auto">
            This project is restricted to members only. You must join to view the standings and fixtures.
          </p>
        </div>

        {project.registrationType === 'PUBLIC' ? (
          <JoinLeagueButton 
             user={user} 
             onJoin={handleAddPlayer} 
             existingPlayers={players}
             registrationType={project.registrationType}
             inviteCode={project.inviteCode}
          />
        ) : (
          <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-none">
            Registration is Invite Only.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black  pb-20">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black -z-10"></div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-2 border-black pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-600 p-3 rounded-none text-black shadow-none shadow-none/20 transform -rotate-6">
              <Briefcase size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-black tracking-tighter">{project.name}</h1>
              <div className="flex items-center gap-3 text-black text-sm font-medium tracking-wide">
                <span className="uppercase">{project.type || project.format}</span>
                {(project.registrationType === 'PUBLIC' || user.uid === project.ownerId || project.admins?.includes(user.uid)) && (
                  <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 bg-white hover:bg-white px-2 py-0.5 rounded text-xs text-black transition-colors"
                  >
                    <Share2 size={12} />
                    Invite Link
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="tour-profile-icon text-xs text-black font-mono flex items-center gap-4">
            {(user.uid === project.ownerId || project.admins?.includes(user.uid) || project.participants?.includes(user.uid)) && (
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-none bg-white hover:bg-white text-black hover:text-black transition-colors"
                title="Project Settings"
              >
                <Settings size={20} />
              </button>
            )}
            <UserProfile user={user} onOpenProfile={() => navigate('/profile')} />
          </div>
        </header>

        {project.status === 'ended' && (
          <div className="bg-black text-white border-2 border-black hover:bg-white hover:text-black border border-2 border-black rounded-none p-4 flex items-center justify-center gap-3 text-black font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-4">
            <Shield size={24} /> Season Ended • Read Only Mode
          </div>
        )}

        <div className="tour-tabs sticky top-16 z-30 bg-white  py-2 -mx-4 px-4 border-b border-2 border-black md:static md:bg-transparent md:border-0 md:p-0 md:mx-0">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full">
            <button 
              onClick={() => setActiveTab('directors')}
              className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'directors' ? 'bg-white text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
            >
              <Users size={16} /> Standings
            </button>
            <button 
              onClick={() => setActiveTab('players')}
              className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'players' ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
            >
              <BarChart3 size={16} /> Stats
            </button>
            <button 
              onClick={() => setActiveTab('fixtures')}
              className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'fixtures' ? 'bg-white text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
            >
              <Calendar size={16} /> Fixtures
            </button>
            {project.format === 'LEAGUE' && (
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-pink-600 text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
              >
                <TrendingUp size={16} /> Analytics
              </button>
            )}
            {project.format !== 'LEAGUE' && (
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
              <Zap size={16} /> AI Pundit
            </button>

            {players.some(p => p.uid === user.uid) && (
              <button 
                onClick={() => setActiveTab('squad')}
                className={`tour-squad-btn shrink-0 px-4 py-2 rounded-none md:rounded-none text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'squad' ? 'bg-green-600 text-black shadow-none' : 'bg-white border border-2 border-black text-black hover:text-black'}`}
              >
                <Shirt size={16} /> My Squad
              </button>
            )}
          </div>
        </div>

        {activeTab === 'oracle' ? (
          <AIOracle 
            project={project}
            projectName={project.name}
            directors={players}        
            squadPlayers={squadPlayers} 
            matches={matches}      
          />
        ) : activeTab === 'squad' ? (
          <SquadViewer user={user} onSyncSquad={handleSyncSquad} isEnded={project.status === 'ended'} />
        ) : activeTab === 'analytics' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
             <TitleRaceChart matches={matches} directors={players} />
             
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-black">Team Analysis</h3>
                    <select 
                        className="bg-white border border-2 border-black text-black text-sm rounded-none focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        value={selectedAnalyticsDirector || (user && players.some(p => p.uid === user.uid) ? user.uid : players[0]?.id) || ""}
                        onChange={(e) => setSelectedAnalyticsDirector(e.target.value)}
                    >
                        {players.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.team})</option>
                        ))}
                    </select>
                </div>
                <GoalDistributionChart 
                    squadPlayers={squadPlayers} 
                    directorId={selectedAnalyticsDirector || (user && players.some(p => p.uid === user.uid) ? user.uid : players[0]?.id)}
                    directorName={players.find(p => p.id === (selectedAnalyticsDirector || (user && players.some(p => p.uid === user.uid) ? user.uid : players[0]?.id)))?.name || "Director"}
                />
             </div>
          </div>
        ) : activeTab === 'fixtures' ? (
          <div id="log-match-form" className="scroll-mt-24">
            <FixturesList 
              projectId={projectId} 
              matches={matches}
              isAdmin={user.uid === project.ownerId || project.admins?.includes(user.uid)}
              onMatchClick={handleMatchClick}
            />
          </div>
        ) : activeTab === 'bracket' ? (
          <BracketView 
            projectId={projectId} 
            isAdmin={user.uid === project.ownerId || project.admins?.includes(user.uid)} 
            directors={players} 
            onTeamClick={(directorId) => {
              const director = players.find(p => p.id === directorId);
              if (director) setSelectedPlayer(director);
            }}
            projectFormat={project.format}
            maxTeams={project.maxTeams}
            projectSettings={project.settings}
            startDate={project.startDate}
            endDate={project.endDate}
            squadPlayers={squadPlayers}
            onFinalizeMatch={finalizeMatch}
          />
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <HighlightCard 
                title={activeTab === 'directors' ? "Golden Boot (Team)" : "Top Gun (Player)"}
                icon={Flame} 
                player={highlights.topScorer} 
                value={activeTab === 'directors' ? `${highlights.topScorer?.goalsFor || 0} G` : `${highlights.topScorer?.goals || 0} G`}
                colorClass="text-orange-500" 
              />
              <HighlightCard 
                title={activeTab === 'directors' ? "Playmaker (Team)" : "Assist King"}
                icon={Zap} 
                player={highlights.topAssister} 
                value={activeTab === 'directors' ? `${highlights.topAssister?.assists || 0} A` : `${highlights.topAssister?.assists || 0} A`}
                colorClass="text-cyan-400" 
              />
              {activeTab === 'directors' && (
                <HighlightCard title="The Wall" icon={Shield} player={highlights.wall} value={`${highlights.wall?.cleanSheets || 0}`} colorClass="text-emerald-400" />
              )}
              {activeTab === 'players' && (
                <div className="bg-white border border-2 border-black rounded-none flex items-center justify-center text-black text-sm italic">
                  Defenders gain clean sheets automatically when their team concedes 0!
                </div>
              )}
            </section>

            {activeTab === 'directors' ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 pb-20">
                <div className="tour-admin-panel lg:col-span-2 space-y-6">
                  {project.status !== 'ended' && project.status !== 'ACTIVE' && (
                    <JoinLeagueButton 
                        user={user} 
                        onJoin={handleAddPlayer} 
                        existingPlayers={players} 
                        registrationType={project.registrationType}
                        inviteCode={project.inviteCode}
                    />
                  )}
                  
                  {(user.uid === project.ownerId || project.admins?.includes(user.uid)) && project.status !== 'ACTIVE' && project.status !== 'ended' && project.format !== 'KNOCKOUT' && (
                    <button 
                      onClick={handleStartProject}
                      className="
                        tour-admin-actions relative overflow-hidden group bg-black text-white border-2 border-black hover:bg-white hover:text-black font-black py-4 px-8 rounded-none shadow-none 
                        transform transition-all duration-100 
                        hover:bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:scale-105 hover:shadow-none/40 
                        active:scale-95 active:shadow-none w-full flex items-center justify-center gap-2
                      "
                    >
                      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                      
                      <span className="relative z-20 flex items-center gap-2">
                        <Activity size={20} className="fill-black" /> START LEAGUE
                      </span>
                    </button>
                  )}

                  <div className="bg-white  rounded-none border border-2 border-black overflow-hidden shadow-none">
                    <div className="p-6 border-b border-2 border-black flex justify-between items-center bg-white">
                      <h2 className="text-xl font-bold text-black flex items-center gap-2">
                        {project.format === 'KNOCKOUT' ? <GitBranch className="text-black" size={20} /> : <Activity className="text-black" size={20} />}
                        {project.format === 'KNOCKOUT' ? 'Project Bracket' : 'Live Standings'}
                      </h2>
                      <span className="px-3 py-1 rounded-none bg-white text-black text-xs font-mono border border-2 border-black">SEASON 1</span>
                    </div>
                    
                    {project.format === 'KNOCKOUT' ? (
                      <div className="overflow-x-auto">
                        <div className="p-4 flex justify-end border-b border-2 border-black">
                            <button 
                              onClick={() => setActiveTab('bracket')}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-black font-bold rounded-none transition-all shadow-none shadow-none/20 flex items-center gap-2 text-sm"
                            >
                              <Network size={16} /> Go to Bracket
                            </button>
                        </div>

                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-xs font-bold text-black uppercase tracking-wider border-b border-2 border-black bg-white">
                              <th className="p-4 w-16 text-center">#</th>
                              <th className="p-4">Director / Team</th>
                              <th className="p-4 text-center w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {players.length === 0 && (
                              <tr><td colSpan="3" className="p-8 text-center text-black italic">No participants yet.</td></tr>
                            )}
                            {players.map((player, index) => (
                              <tr key={player.id} className="group hover:bg-white transition-colors">
                                <td className="p-4 text-center font-mono text-black group-hover:text-black">{index + 1}</td>
                                <td className="p-4 cursor-pointer" onClick={() => setSelectedPlayer(player)}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-none bg-white flex items-center justify-center border border-2 border-black">
                                      <span className="text-xs font-bold">{player.team ? player.team.substring(0,2).toUpperCase() : 'FC'}</span>
                                    </div>
                                    <div>
                                      <div className="font-bold text-black group-hover:text-black transition-colors flex items-center gap-2">
                                        {player.name}
                                        
                                        {(() => {
                                          const isOwner = user.uid === project.ownerId;
                                          const isAdmin = project.admins?.includes(player.uid);
                                          const isSelf = user.uid === player.uid;

                                          if (isOwner && !isSelf) {
                                            return (
                                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                <button 
                                                  onClick={() => openAdminModal(player.uid, player.name, isAdmin)}
                                                  className={`p-1.5 rounded-none transition-all ${isAdmin ? 'text-black bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:bg-red-500/20 hover:text-red-500' : 'text-black hover:text-black hover:bg-white'}`}
                                                  title={isAdmin ? "Remove Admin" : "Make Admin"}
                                                >
                                                  <Crown size={18} className={isAdmin ? "fill-yellow-500 hover:fill-red-500" : ""} />
                                                </button>
                                                <button 
                                                  onClick={() => handleRemoveDirector(player.uid, player.name)}
                                                  className="p-1.5 rounded-none text-black hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                  title="Remove from Project"
                                                >
                                                  <Trash2 size={18} />
                                                </button>
                                              </div>
                                            );
                                          }

                                          if (project.admins?.includes(user.uid) && !isSelf && player.uid !== project.ownerId && !project.admins?.includes(player.uid)) {
                                             return (
                                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                <button 
                                                  onClick={() => handleRemoveDirector(player.uid, player.name)}
                                                  className="p-1.5 rounded-none text-black hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                  title="Remove from Project"
                                                >
                                                  <Trash2 size={18} />
                                                </button>
                                              </div>
                                             );
                                          }

                                          if (isAdmin) {
                                            return <Crown size={16} className="text-black fill-yellow-500" />;
                                          }

                                          return null;
                                        })()}
                                      </div>
                                      <div className="text-xs text-black">{player.team}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setViewFormationId(player.id); }}
                                    className="p-2 bg-white hover:bg-white text-black hover:text-black rounded-none transition-colors"
                                    title="View Formation"
                                  >
                                    <LayoutTemplate size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                        project.format === 'HYBRID' && project.settings?.hybridConfig?.type === 'MULTI_GROUP' 
                        ? renderMultiGroupTables()
                        : renderLeagueTable(leaderboard)
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-none border border-2 border-black p-6">
                    <h3 className="text-sm font-bold text-black uppercase tracking-wider mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {recentReviews.length === 0 ? <div className="text-center text-black text-sm py-4 italic">No matches logged yet locally.</div> : recentReviews.map((match, index) => (
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
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="bg-white  rounded-none border border-2 border-black overflow-hidden shadow-none">
                    <div className="p-6 border-b border-2 border-black flex flex-col gap-4 bg-white">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-xl font-bold text-black flex items-center gap-2">
                          <BarChart3 className="text-black" size={20} />
                          Project Stats
                        </h2>
                        {(user.uid === project.ownerId || project.admins?.includes(user.uid)) && (
                          <div className="bg-black text-white border-2 border-black hover:bg-white hover:text-black border border-2 border-black px-4 py-2 rounded-none">
                            <p className="text-xs text-black uppercase tracking-wider font-bold">Tip: Click +/- to update stats manually</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="tour-stats-search relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} />
                          <input 
                            type="text" 
                            placeholder="Search player, team or director..." 
                            value={statsSearch}
                            onChange={(e) => setStatsSearch(e.target.value)}
                            className="w-full bg-white border border-2 border-black rounded-none py-2 pl-10 pr-4 text-black placeholder:text-black focus:outline-none focus:border-2 border-black transition-colors"
                          />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                          <select 
                            value={statsFilter} 
                            onChange={(e) => setStatsFilter(e.target.value)}
                            className="bg-white border border-2 border-black rounded-none px-3 py-2 text-sm text-black focus:outline-none focus:border-2 border-black"
                          >
                            <option value="all">All Players</option>
                            <option value="scorers">Goal Scorers</option>
                            <option value="assisters">Assisters</option>
                          </select>
                          <select 
                            value={statsSort} 
                            onChange={(e) => setStatsSort(e.target.value)}
                            className="bg-white border border-2 border-black rounded-none px-3 py-2 text-sm text-black focus:outline-none focus:border-2 border-black"
                          >
                            <option value="goals">Sort by KPIs</option>
                            <option value="assists">Sort by Assists</option>
                            <option value="cleanSheets">Sort by Clean Sheets</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-xs font-bold text-black uppercase tracking-wider border-b border-2 border-black bg-white">
                            <th className="p-4 w-16 text-center">Rank</th>
                            <th className="p-4">Footballer Name</th>
                            <th className="p-4 hidden sm:table-cell">Director Team</th>
                            <th className="p-4 text-center">KPIs</th>
                            <th className="p-4 text-center">Assists</th>
                            <th className="p-4 text-center">Clean Sheets</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {(() => {
                            let filtered = squadPlayers.filter(p => {
                              const searchLower = statsSearch.toLowerCase();
                              const directorName = getDirectorInfo(p.directorId).toLowerCase();
                              const matchesSearch = p.name.toLowerCase().includes(searchLower) || 
                                                    directorName.includes(searchLower);
                              
                              if (!matchesSearch) return false;

                              if (statsFilter === 'scorers') return p.goals > 0;
                              if (statsFilter === 'assisters') return p.assists > 0;
                              return true;
                            });

                            filtered.sort((a, b) => {
                              if (statsSort === 'goals') return b.goals - a.goals || b.assists - a.assists;
                              if (statsSort === 'assists') return b.assists - a.assists || b.goals - a.goals;
                              if (statsSort === 'cleanSheets') return b.cleanSheets - a.cleanSheets;
                              return 0;
                            });

                            if (filtered.length === 0) {
                              return <tr><td colSpan="6" className="p-8 text-center text-black italic">No players found matching criteria.</td></tr>;
                            }

                            return filtered.map((p, index) => (
                              <tr key={p.id} onClick={() => setSelectedPlayerForCard(p)} className="group hover:bg-white transition-colors cursor-pointer">
                                <td className="p-4 text-center">
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-none font-black ${index === 0 ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black' : index === 1 ? 'bg-white text-black' : index === 2 ? 'bg-orange-700 text-black' : 'text-black bg-white'}`}>
                                    {index + 1}
                                  </span>
                                </td>
                                <td className="p-4">
                                   <div className="font-bold text-black text-lg">{p.name}</div>
                                   <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${p.position === 'FWD' ? 'bg-red-500/20 text-red-400' : p.position === 'MID' ? 'bg-green-500/20 text-green-400' : p.position === 'DEF' ? 'bg-white text-black' : 'bg-purple-500/20 text-purple-400'}`}>
                                      {p.position}
                                   </div>
                                </td>
                                <td className="p-4 hidden sm:table-cell text-black text-sm">{getDirectorInfo(p.directorId)}</td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center gap-3">
                                    {(user.uid === project.ownerId || project.admins?.includes(user.uid)) && (
                                      <button onClick={() => updateSquadStat(p.id, 'goals', -1)} className="p-1 hover:bg-white rounded text-black hover:text-red-400"><ChevronDown size={16} /></button>
                                    )}
                                    <span className="text-xl font-black text-black w-8 text-center">{p.goals}</span>
                                    {(user.uid === project.ownerId || project.admins?.includes(user.uid)) && (
                                      <button onClick={() => updateSquadStat(p.id, 'goals', 1)} className="p-1 hover:bg-white rounded text-black hover:text-green-400"><ChevronUp size={16} /></button>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center gap-3">
                                    {(user.uid === project.ownerId || project.admins?.includes(user.uid)) && (
                                      <button onClick={() => updateSquadStat(p.id, 'assists', -1)} className="p-1 hover:bg-white rounded text-black hover:text-red-400"><ChevronDown size={16} /></button>
                                    )}
                                    <span className="text-xl font-bold text-cyan-400 w-8 text-center">{p.assists}</span>
                                    {(user.uid === project.ownerId || project.admins?.includes(user.uid)) && (
                                      <button onClick={() => updateSquadStat(p.id, 'assists', 1)} className="p-1 hover:bg-white rounded text-black hover:text-green-400"><ChevronUp size={16} /></button>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center gap-3">
                                    {(user.uid === project.ownerId || project.admins?.includes(user.uid)) && (
                                      <button onClick={() => updateSquadStat(p.id, 'cleanSheets', -1)} className="p-1 hover:bg-white rounded text-black hover:text-red-400"><ChevronDown size={16} /></button>
                                    )}
                                    <span className="text-xl font-bold text-emerald-400 w-8 text-center">{p.cleanSheets}</span>
                                    {(user.uid === project.ownerId || project.admins?.includes(user.uid)) && (
                                      <button onClick={() => updateSquadStat(p.id, 'cleanSheets', 1)} className="p-1 hover:bg-white rounded text-black hover:text-green-400"><ChevronUp size={16} /></button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
              </div>
            )}
          </>
        )}

      </div>

      {pendingMatch && (
        <GoalAssignmentModal 
          matchData={pendingMatch} 
          homeSquad={squadPlayers.filter(p => String(p.directorId) === String(pendingMatch.homeId))}
          awaySquad={squadPlayers.filter(p => String(p.directorId) === String(pendingMatch.awayId))}
          onConfirm={(assignments) => finalizeMatch(null, assignments)}
          onSkip={() => finalizeMatch(null, {})}
          onCancel={() => setPendingMatch(null)} 
        />
      )}

      <AdminConfirmationModal 
        isOpen={adminModal.isOpen}
        name={adminModal.name}
        isAdmin={adminModal.isAdmin}
        onConfirm={executeToggleAdmin}
        onCancel={() => setAdminModal({ ...adminModal, isOpen: false })}
      />

      {user && project && (user.uid === project.ownerId || project.admins?.includes(user.uid)) && (
        <div className="tour-fab fixed bottom-6 right-6 z-40 md:hidden">
          {project.status === 'ACTIVE' && (
            <button  
              onClick={() => {
                setActiveTab('fixtures');
                setTimeout(() => document.getElementById('log-match-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
              className="bg-green-600 text-black p-4 rounded-none shadow-none shadow-none/50 flex items-center justify-center animate-bounce-slow"
            >
              <Plus size={28} />
            </button>
          )}
        </div>
      )}

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onEnd={() => { setShowSettings(false); setShowEndModal(true); }}
        onDelete={() => { setShowSettings(false); setShowDeleteModal(true); }}
        onLeave={() => { setShowSettings(false); handleLeaveProject(); }}
        isOwner={user && project && user.uid === project.ownerId}
        canLeave={user && project && project.participants?.includes(user.uid)}
        inviteCode={project.inviteCode}
      />

      <DeleteProjectModal 
        isOpen={showDeleteModal}
        projectName={project.name}
        onConfirm={handleDeleteProject}
        onCancel={() => setShowDeleteModal(false)}
      />

      <ScoreEntryModal 
        isOpen={scoreModalOpen} 
        match={selectedMatchForLogging} 
        matches={matches}
        onClose={() => setScoreModalOpen(false)} 
        onConfirm={handleScoreConfirm} 
      />

      {selectedPlayerForCard && (
        <PlayerCard 
          player={selectedPlayerForCard} 
          directorName={getDirectorInfo(selectedPlayerForCard.directorId)}
          currentUser={user}
          matches={matches}
          onClose={() => setSelectedPlayerForCard(null)} 
        />
      )}

      <EndProjectModal 
        isOpen={showEndModal}
        onConfirm={handleEndProject}
        onCancel={() => setShowEndModal(false)}
      />

      {selectedPlayer && (
        <PlayerCard 
          player={selectedPlayer} 
          currentUser={user}
          matches={matches}
          onClose={() => setSelectedPlayer(null)} 
        />
      )}

      {viewFormationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90  p-4 animate-in fade-in duration-200" onClick={() => setViewFormationId(null)}>
          <div className="bg-white border border-2 border-black rounded-none w-full max-w-4xl overflow-hidden shadow-none flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-2 border-black bg-white flex justify-between items-center">
              <h3 className="font-bold text-black flex items-center gap-2">
                <LayoutTemplate size={18} className="text-green-500" /> 
                {players.find(p => p.id === viewFormationId)?.name}'s Formation
              </h3>
              <button onClick={() => setViewFormationId(null)}><X size={20} className="text-black hover:text-black" /></button>
            </div>
            <div className="p-4 overflow-y-auto">
               <SquadViewer 
                 user={{ uid: viewFormationId }}
                 onSyncSquad={() => {}} 
                 isEnded={true}
               />
            </div>
          </div>
        </div>
      )}
      
      <OnboardingTour isAdmin={user?.uid === project?.ownerId || project?.admins?.includes(user?.uid)} />
      
      {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
    </div>
  );
}


