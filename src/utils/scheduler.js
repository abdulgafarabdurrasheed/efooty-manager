import { Timestamp } from 'firebase/firestore';

/**
 * @param {Array} participants
 * @param {boolean} doubleLeg
 * @returns {Array}
 */
export const generateRoundRobin = (participants, doubleLeg = false) => {
    const n = participants.length;
    const teams = [...participants];
    const rounds = [];

    if (n % 2 !== 0) {
        teams.push({ id: 'BYE', name: 'BYE' });
    }

    const numTeams = teams.length;
    const numRounds = numTeams - 1;
    const half = numTeams / 2;

    for (let round = 0; round < numRounds; round++) {
        const currentRoundReviews = [];
        
        for (let i = 0; i < half; i++) {
            const home = teams[i];
            const away = teams[numTeams - 1 - i];

            if (home.id !== 'BYE' && away.id !== 'BYE') {
                if (i === 0 && round % 2 === 1) {
                    currentRoundReviews.push({ home, away, round: round + 1, type: 'LEAGUE' });
                } else {
                    currentRoundReviews.push({ home, away, round: round + 1, type: 'LEAGUE' });
                }
            } else {
                //
            }
        }
        rounds.push(currentRoundReviews);


        const last = teams.pop();
        teams.splice(1, 0, last);
    }

    if (doubleLeg) {
        const returnRounds = rounds.map((roundReviews, index) => {
            return roundReviews.map(m => ({
                home: m.away,
                away: m.home,
                type: m.type || 'LEAGUE',
                round: numRounds + index + 1
            }));
        });
        return [...rounds, ...returnRounds];
    }

    return rounds;
};

/**
 * @param {number} size
 * @param {boolean} doubleLeg
 * @param {Object} hybridConfig
 * @returns {Array}
 */
export const generateKnockoutPlaceholders = (size, doubleLeg = false, hybridConfig = null) => {
    const matches = [];
    let roundCount = 1;
    let currentCount = size;
    let roundReviews = [];
    
    const matchesInFirstRound = currentCount / 2;
    const isFirstRoundFinal = (currentCount === 2);
    const isFirstRoundTwoLegged = doubleLeg && !isFirstRoundFinal;

    for (let i = 0; i < matchesInFirstRound; i++) {
        let homeRef = null;
        let awayRef = null;
        let homeLabel = 'TBD';
        let awayLabel = 'TBD';

        if (hybridConfig) {
            if (hybridConfig.type === 'SINGLE_LEAGUE') {
                const seedTop = i + 1;
                const seedBottom = size - i;
                homeRef = { type: 'LEAGUE_SEED', seed: seedTop };
                awayRef = { type: 'LEAGUE_SEED', seed: seedBottom };
                homeLabel = `Seed ${seedTop}`;
                awayLabel = `Seed ${seedBottom}`;
            } else if (hybridConfig.type === 'MULTI_GROUP') {
                const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                const numGroups = hybridConfig.numGroups || 4;
                const advancers = hybridConfig.advancersPerGroup || 2;
                
                if (advancers === 2) {
                    const groupIndexHome = i % numGroups;
                    const groupIndexAway = (i + 1) % numGroups;
                    
                    homeRef = { type: 'GROUP_Winner', group: groupNames[groupIndexHome] };
                    awayRef = { type: 'GROUP_RunnerUp', group: groupNames[groupIndexAway] };
                    homeLabel = `Winner Group ${groupNames[groupIndexHome]}`;
                    awayLabel = `Runner-Up Group ${groupNames[groupIndexAway]}`;
                } else {
                    const groupIndexHome = (i * 2) % numGroups;
                    const groupIndexAway = (i * 2 + 1) % numGroups;
                    homeRef = { type: 'GROUP_Winner', group: groupNames[groupIndexHome] };
                    awayRef = { type: 'GROUP_Winner', group: groupNames[groupIndexAway] };
                    homeLabel = `Winner Group ${groupNames[groupIndexHome]}`;
                    awayLabel = `Winner Group ${groupNames[groupIndexAway]}`;
                }
            }
        }

        roundReviews.push({
            id: `R1_M${i+1}`, 
            roundName: getRoundName(currentCount),
            round: 1,
            matchNumber: i + 1,
            home: { name: homeLabel },
            away: { name: awayLabel },
            homeRef,
            awayRef,
            status: 'SCHEDULED_TBD',
            type: 'KNOCKOUT',
            isTwoLegged: isFirstRoundTwoLegged
        });
    }
    matches.push(roundReviews);
    
    let previousRoundReviews = roundReviews;
    currentCount = currentCount / 2;
    roundCount++;
    
    while (currentCount > 1) {
         const matchesInRound = currentCount / 2;
         const currentRoundReviews = [];
         const isFinal = (currentCount === 2);
         const isTwoLegged = doubleLeg && !isFinal;
         
         for (let i = 0; i < matchesInRound; i++) {
             const matchId = `R${roundCount}_M${i+1}`;
             const homeSourceMatch = previousRoundReviews[i*2];
             const awaySourceMatch = previousRoundReviews[i*2+1];
             
             currentRoundReviews.push({
                 id: matchId,
                 roundName: getRoundName(currentCount),
                 round: roundCount,
                 matchNumber: i + 1,
                 home: { name: `Winner M${homeSourceMatch.matchNumber} (R${roundCount-1})` }, 
                 away: { name: `Winner M${awaySourceMatch.matchNumber} (R${roundCount-1})` },
                 homeSource: homeSourceMatch.matchNumber, 
                 awaySource: awaySourceMatch.matchNumber,
                 status: 'TBD',
                 type: 'KNOCKOUT',
                 isTwoLegged: isTwoLegged
             });
         }
         matches.push(currentRoundReviews);
         previousRoundReviews = currentRoundReviews;
         
         currentCount = currentCount / 2;
         roundCount++;
    }
    
    return matches;
};

/**
 * @param {Array} participants
 * @returns {Array}
 */
export const generateKnockoutFixtures = (participants, doubleLeg = false) => {
    const numTeams = participants.length;
    const matches = [];
    let roundCount = 1;
    let currentCount = numTeams;
    let roundReviews = [];

    const matchesInFirstRound = currentCount / 2;
    const isFirstRoundFinal = (currentCount === 2);
    const isFirstRoundTwoLegged = doubleLeg && !isFirstRoundFinal;

    for (let i = 0; i < matchesInFirstRound; i++) {
        const home = participants[i * 2];
        const away = participants[i * 2 + 1];
        
        const isHomeBye = home.id === 'BYE' || home.name === 'BYE';
        const isAwayBye = away.id === 'BYE' || away.name === 'BYE';
        
        let status = 'SCHEDULED';
        let winner = null;
        let hScore = '';
        let aScore = '';

        if (isHomeBye && !isAwayBye) {
            status = 'BYE';
            winner = away;
            hScore = 0;
            aScore = 3;
        } else if (isAwayBye && !isHomeBye) {
            status = 'BYE';
            winner = home;
            hScore = 3;
            aScore = 0;
        }

        roundReviews.push({
            id: `R1_M${i+1}`, 
            roundName: getRoundName(currentCount),
            round: 1,
            matchNumber: i + 1,
            home: home,
            away: away,
            status: status,
            winner: winner,
            hScore: hScore,
            aScore: aScore,
            type: 'KNOCKOUT',
            isTwoLegged: isFirstRoundTwoLegged && status !== 'BYE'
        });
    }
    matches.push(roundReviews);

    let previousRoundReviews = roundReviews;
    currentCount = currentCount / 2;
    roundCount++;
    
    while (currentCount > 1) {
         const matchesInRound = currentCount / 2;
         const currentRoundReviews = [];
         const isFinal = (currentCount === 2);
         const isTwoLegged = doubleLeg && !isFinal;
         
         for (let i = 0; i < matchesInRound; i++) {
             const matchId = `R${roundCount}_M${i+1}`;
             const homeSourceMatch = previousRoundReviews[i*2];
             const awaySourceMatch = previousRoundReviews[i*2+1];

             let homeTeam = { name: `Winner M${homeSourceMatch.matchNumber} (R${roundCount-1})` };
             if (homeSourceMatch.winner) {
                 homeTeam = homeSourceMatch.winner;
             }
             let awayTeam = { name: `Winner M${awaySourceMatch.matchNumber} (R${roundCount-1})` };
             if (awaySourceMatch.winner) {
                 awayTeam = awaySourceMatch.winner;
             }
             
             currentRoundReviews.push({
                 id: matchId,
                 roundName: getRoundName(currentCount),
                 round: roundCount,
                 matchNumber: i + 1,
                 home: homeTeam, 
                 away: awayTeam,
                 homeSource: homeSourceMatch.matchNumber, 
                 awaySource: awaySourceMatch.matchNumber,
                 status: 'SCHEDULED',
                 type: 'KNOCKOUT',
                 isTwoLegged: isTwoLegged
             });
         }
         matches.push(currentRoundReviews);
         previousRoundReviews = currentRoundReviews;
         
         currentCount = currentCount / 2;
         roundCount++;
    }
    
    return matches;
};

const getRoundName = (teamCount) => {
    if (teamCount === 2) return 'Final';
    if (teamCount === 4) return 'Semi Finals';
    if (teamCount === 8) return 'Quarter Finals';
    if (teamCount === 16) return 'Round of 16';
    return `Round of ${teamCount}`;
};

/**
 * @param {Array} round
 * @param {Date} startDate 
 * @param {Date} endDate
 */
export const assignDatesToRounds = (rounds, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDuration = end.getTime() - start.getTime();
    const numRounds = rounds.length;

    const interval = numRounds > 1 ? totalDuration / (numRounds - 1) : 0;

    const scheduledReviews = [];

    rounds.forEach((roundReviews, index) => {
        const roundDate = new Date(start.getTime() + (interval * index));
        
        roundReviews.forEach(match => {
            scheduledReviews.push({
                ...match,
                date: Timestamp.fromDate(roundDate),
                status: match.type === 'BYE' ? 'BYE' : 'SCHEDULED'
            });
        });
    });

    return scheduledReviews;
};

export const generateProjectFixtures = (project, participants, startDate, endDate) => {
    let allReviews = [];
    let bracketStructure = [];

    if (project.format === 'LEAGUE') {
        const rounds = generateRoundRobin(participants, project.settings?.doubleLeg);
        allReviews = assignDatesToRounds(rounds, startDate, endDate);
    } 
    else if (project.format === 'KNOCKOUT') {
        const rounds = generateKnockoutFixtures(participants, project.settings?.doubleLeg);
        bracketStructure = rounds;
        
        const schedulingRounds = [];
        rounds.forEach(roundReviews => {
            if (roundReviews[0].isTwoLegged) {
                schedulingRounds.push(roundReviews.map(m => ({
                    ...m,
                    id: `${m.id}_L1`,
                    leg: 1,
                    roundName: `${m.roundName} (Leg 1)`
                })));
                schedulingRounds.push(roundReviews.map(m => ({
                    ...m,
                    id: `${m.id}_L2`,
                    leg: 2,
                    roundName: `${m.roundName} (Leg 2)`,
                    home: m.away,
                    away: m.home
                })));
            } else {
                schedulingRounds.push(roundReviews);
            }
        });

        allReviews = assignDatesToRounds(schedulingRounds, startDate, endDate);
    }
    else if (project.format === 'HYBRID') {
        let leagueReviews = [];
        let leagueMaxRound = 0;
        let groupEndDate = new Date(endDate);

        if (project.settings?.hybridConfig?.type === 'SINGLE_LEAGUE') {
            const rounds = generateRoundRobin(participants, project.settings?.doubleLeg);
            leagueMaxRound = rounds.length;

            const start = new Date(startDate);
            const end = new Date(endDate);
            const totalDuration = end.getTime() - start.getTime();
            const leagueDuration = totalDuration * 0.7;
            groupEndDate = new Date(start.getTime() + leagueDuration);

            leagueReviews = assignDatesToRounds(rounds, startDate, groupEndDate);
        }
        else if (project.settings?.hybridConfig?.type === 'MULTI_GROUP') {
            const { numGroups } = project.settings.hybridConfig;
            const groups = {};
            
            participants.forEach((p, idx) => {
                const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                const groupIndex = idx % numGroups;
                const gid = groupNames[groupIndex];
                if (!groups[gid]) groups[gid] = [];
                groups[gid].push(p);
            });

            const groupRoundsMap = {};
            
            Object.keys(groups).forEach(gid => {
                const groupReviews = generateRoundRobin(groups[gid], project.settings?.doubleLeg);
                groupRoundsMap[gid] = groupReviews;
                if (groupReviews.length > leagueMaxRound) leagueMaxRound = groupReviews.length;
            });

            const combinedRounds = [];
            for (let i = 0; i < leagueMaxRound; i++) {
                const roundReviews = [];
                Object.keys(groups).forEach(gid => {
                    if (groupRoundsMap[gid][i]) {
                        const matchesWithGroup = groupRoundsMap[gid][i].map(m => ({ ...m, groupId: gid }));
                        roundReviews.push(...matchesWithGroup);
                    }
                });
                combinedRounds.push(roundReviews);
            }

            const start = new Date(startDate);
            const end = new Date(endDate);
            const totalDuration = end.getTime() - start.getTime();
            const groupDuration = totalDuration * 0.7;
            groupEndDate = new Date(start.getTime() + groupDuration);

            leagueReviews = assignDatesToRounds(combinedRounds, startDate, groupEndDate);
        }

        let totalKnockoutTeams = 4;
        if (project.settings.hybridConfig.type === 'SINGLE_LEAGUE') {
            totalKnockoutTeams = project.settings.hybridConfig.totalAdvancers || 4;
        } else {
            const advancers = project.settings.hybridConfig.advancersPerGroup || 2;
            const groups = project.settings.hybridConfig.numGroups || 1;
            totalKnockoutTeams = groups * advancers;
        }

        const knockoutRoundsRaw = generateKnockoutPlaceholders(totalKnockoutTeams, project.settings?.legs === 2, project.settings.hybridConfig);
        bracketStructure = knockoutRoundsRaw;

        const schedulingRounds = [];
        knockoutRoundsRaw.forEach(roundReviews => {
            if (roundReviews[0].isTwoLegged) {
                schedulingRounds.push(roundReviews.map(m => ({
                    ...m,
                    id: `${m.id}_L1`,
                    leg: 1,
                    roundName: `${m.roundName} (Leg 1)`
                })));
                schedulingRounds.push(roundReviews.map(m => ({
                    ...m,
                    id: `${m.id}_L2`,
                    leg: 2,
                    roundName: `${m.roundName} (Leg 2)`,
                    home: m.away,
                    away: m.home
                })));
            } else {
                schedulingRounds.push(roundReviews);
            }
        });
        
        const knockoutStartDate = new Date(groupEndDate.getTime() + (1000 * 60 * 60 * 24));
        let knockoutReviews = assignDatesToRounds(schedulingRounds, knockoutStartDate, endDate);

                
        let currentRoundNum = leagueMaxRound + 1;
        const remappedKnockoutReviews = [];
        
        
        let matchIndex = 0;
        schedulingRounds.forEach(roundReviews => {
            const numReviewsInRound = roundReviews.length;
            for(let i=0; i<numReviewsInRound; i++) {
                const match = knockoutReviews[matchIndex];
                remappedKnockoutReviews.push({
                    ...match,
                    round: currentRoundNum
                });
                matchIndex++;
            }
            currentRoundNum++;
        });

        allReviews = [...leagueReviews, ...remappedKnockoutReviews];
    }

    return { matches: allReviews, bracket: bracketStructure };
};
