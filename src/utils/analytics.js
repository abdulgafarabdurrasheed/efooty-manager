export const getFormGuide = (directorId, allReviews) => {
  const myReviews = allReviews.filter(m => 
    (m.homeId === directorId || m.awayId === directorId) && 
    m.status === 'COMPLETED'
  );
  
  myReviews.sort((a, b) => {
      const dateA = a.date ? new Date(a.date.seconds * 1000) : (a.createdAt ? a.createdAt.toDate() : new Date(0));
      const dateB = b.date ? new Date(b.date.seconds * 1000) : (b.createdAt ? b.createdAt.toDate() : new Date(0));
      return dateB - dateA;
  });

  const last5 = myReviews.slice(0, 5);

  return last5.map(m => {
    const isHome = m.homeId === directorId;
    const myScore = isHome ? m.hScore : m.aScore;
    const oppScore = isHome ? m.aScore : m.hScore;

    if (myScore > oppScore) return 'W';
    if (myScore === oppScore) return 'D';
    return 'L';
  });
};

export const getH2HStats = (idA, idB, allReviews) => {
    const meetings = allReviews.filter(m => 
        ((m.homeId === idA && m.awayId === idB) || (m.homeId === idB && m.awayId === idA)) &&
        m.status === 'COMPLETED'
    );

    const stats = { p1Wins: 0, p2Wins: 0, draws: 0, total: meetings.length };

    meetings.forEach(m => {
        const winner = m.hScore > m.aScore ? m.homeId : (m.aScore > m.hScore ? m.awayId : 'draw');
        if (winner === 'draw') stats.draws++;
        else if (winner === idA) stats.p1Wins++;
        else stats.p2Wins++;
    });

    return stats;
};

export const generateRaceData = (matches, directors) => {
    const completedReviews = matches.filter(m => m.status === 'COMPLETED');
    if (completedReviews.length === 0) return [];

    const rounds = [...new Set(completedReviews.map(m => m.round))].sort((a, b) => a - b);

    let cumulativePoints = {};
    directors.forEach(m => cumulativePoints[m.name] = 0);

    const data = [{ week: 'Start', ...cumulativePoints }];

    rounds.forEach(round => {
        const roundReviews = completedReviews.filter(m => m.round === round);
        
        roundReviews.forEach(m => {
            const homeName = m.homeName || m.home?.name;
            const awayName = m.awayName || m.away?.name;
            
            if (m.hScore > m.aScore) {
                if (cumulativePoints[homeName] !== undefined) cumulativePoints[homeName] += 3;
            } else if (m.aScore > m.hScore) {
                if (cumulativePoints[awayName] !== undefined) cumulativePoints[awayName] += 3;
            } else {
                if (cumulativePoints[homeName] !== undefined) cumulativePoints[homeName] += 1;
                if (cumulativePoints[awayName] !== undefined) cumulativePoints[awayName] += 1;
            }
        });

        const dataPoint = { week: `GW ${round}`, ...cumulativePoints };
        data.push(dataPoint);
    });

    return data;
};
