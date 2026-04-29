import { useState, useMemo, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  doc, 
  query, 
  orderBy
} from "firebase/firestore";
import { auth, db } from '../firebase';
import { DEMO_PROJECT, DEMO_PLAYERS, DEMO_MATCHES, DEMO_SQUAD, DEMO_RECENT } from '../data/demoData';

const getPoints = (player) => (player.wins * 3) + (player.draws * 1);

/**
 * @param {string} projectId
 * @returns {Object}
 */
export function useTournamentData(projectId) {
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [players, setPlayers] = useState([]);
  const [squadPlayers, setSquadPlayers] = useState([]);
  const [matches, setReviews] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (projectId !== 'demo-project') return;
    setProject(DEMO_PROJECT)
    setPlayers(DEMO_PLAYERS)
    setSquadPlayers(DEMO_SQUAD)
    setRecentReviews(DEMO_RECENT)
    setReviews(DEMO_MATCHES)
  }, [projectId])

  useEffect(() => {
    if (!user || !projectId || projectId === 'demo-project') return;

    const projectRef = doc(db, "projects", projectId);
    const unsubProject = onSnapshot(projectRef, (docSnap) => {
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() });
      }
    }, (error) => console.error("Project Listen Error:", error));

    const directorsRef = collection(db, `projects/${projectId}/directors`);
    const qDirectors = query(directorsRef, orderBy("sprintsLogged", "desc")); 
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

  const getHighlights = (activeTab) => {
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
  };

  const getDirectorInfo = (directorId) => {
    const director = players.find(p => p.id === directorId);
    return director ? `${director.name} (${director.team})` : "Unknown Team";
  };

  return {
    user,
    project,
    players,
    squadPlayers,
    matches,
    recentReviews,
    leaderboard,
    getHighlights,
    getDirectorInfo
  };
}

export { getPoints };
