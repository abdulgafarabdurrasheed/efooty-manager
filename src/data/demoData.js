const t = Date.now() / 1000;

export const DEMO_PROJECT = {
  id: 'demo-project',
  name: 'Q4 Revenue Sprint Initiative',
  ownerId: 'demo-owner',
  status: 'ACTIVE',
  format: 'LEAGUE',
  visibility: 'PUBLIC',
  hostName: 'Corporate HQ',
  participants: ['d1','d2','d3','d4','d5','d6'],
  admins: [],
  settings: { doubleLeg: false },
  registrationType: 'PUBLIC',
};

export const DEMO_PLAYERS = [
  { id:'d1', uid:'d1', name:'Alice Chen',    team:'Alpha Pod',     matchesPlayed:5, wins:4, draws:1, losses:0, goalsFor:12, goalsAgainst:3,  cleanSheets:3, assists:4, status:'active' },
  { id:'d2', uid:'d2', name:'Marcus Wright', team:'Beta Squad',    matchesPlayed:5, wins:3, draws:1, losses:1, goalsFor:9,  goalsAgainst:5,  cleanSheets:2, assists:3, status:'active' },
  { id:'d3', uid:'d3', name:'Priya Patel',   team:'Gamma Unit',    matchesPlayed:5, wins:2, draws:2, losses:1, goalsFor:8,  goalsAgainst:6,  cleanSheets:1, assists:5, status:'active' },
  { id:'d4', uid:'d4', name:'Jake Morrison', team:'Delta Force',   matchesPlayed:5, wins:2, draws:1, losses:2, goalsFor:7,  goalsAgainst:7,  cleanSheets:1, assists:2, status:'active' },
  { id:'d5', uid:'d5', name:'Sofia Reyes',   team:'Epsilon Cell',  matchesPlayed:5, wins:1, draws:1, losses:3, goalsFor:5,  goalsAgainst:9,  cleanSheets:0, assists:3, status:'active' },
  { id:'d6', uid:'d6', name:'Omar Hassan',   team:'Zeta Division', matchesPlayed:5, wins:0, draws:2, losses:3, goalsFor:4,  goalsAgainst:11, cleanSheets:0, assists:1, status:'active' },
];

export const DEMO_SQUAD = [
  { id:'sq1',  name:'R. Sterling',  position:'FWD', directorId:'d1', goals:6, assists:2, cleanSheets:0 },
  { id:'sq2',  name:'K. Palmer',    position:'MID', directorId:'d1', goals:3, assists:4, cleanSheets:0 },
  { id:'sq3',  name:'T. Silva',     position:'DEF', directorId:'d1', goals:0, assists:0, cleanSheets:3 },
  { id:'sq4',  name:'J. Vardy',     position:'FWD', directorId:'d2', goals:5, assists:1, cleanSheets:0 },
  { id:'sq5',  name:'B. Fernandes', position:'MID', directorId:'d2', goals:2, assists:3, cleanSheets:0 },
  { id:'sq6',  name:'V. van Dijk',  position:'DEF', directorId:'d2', goals:1, assists:0, cleanSheets:2 },
  { id:'sq7',  name:'M. Salah',     position:'FWD', directorId:'d3', goals:4, assists:3, cleanSheets:0 },
  { id:'sq8',  name:'L. Modric',    position:'MID', directorId:'d3', goals:2, assists:5, cleanSheets:0 },
  { id:'sq9',  name:'K. Walker',    position:'DEF', directorId:'d4', goals:0, assists:1, cleanSheets:1 },
  { id:'sq10', name:'E. Haaland',   position:'FWD', directorId:'d4', goals:5, assists:0, cleanSheets:0 },
  { id:'sq11', name:'N. Kante',     position:'MID', directorId:'d5', goals:1, assists:2, cleanSheets:0 },
  { id:'sq12', name:'A. Griezmann', position:'FWD', directorId:'d6', goals:2, assists:1, cleanSheets:0 },
];

export const DEMO_MATCHES = [
  { id:'m1', homeId:'d1', awayId:'d2', homeName:'Alpha Pod',    awayName:'Beta Squad',    hScore:3, aScore:1, round:1, status:'COMPLETED', type:'LEAGUE', timestamp:{seconds:t-5000} },
  { id:'m2', homeId:'d3', awayId:'d4', homeName:'Gamma Unit',   awayName:'Delta Force',   hScore:2, aScore:2, round:1, status:'COMPLETED', type:'LEAGUE', timestamp:{seconds:t-4500} },
  { id:'m3', homeId:'d5', awayId:'d6', homeName:'Epsilon Cell', awayName:'Zeta Division', hScore:1, aScore:1, round:1, status:'COMPLETED', type:'LEAGUE', timestamp:{seconds:t-4000} },
  { id:'m4', homeId:'d1', awayId:'d3', homeName:'Alpha Pod',    awayName:'Gamma Unit',    hScore:2, aScore:1, round:2, status:'COMPLETED', type:'LEAGUE', timestamp:{seconds:t-3500} },
  { id:'m5', homeId:'d2', awayId:'d5', homeName:'Beta Squad',   awayName:'Epsilon Cell',  hScore:3, aScore:0, round:2, status:'COMPLETED', type:'LEAGUE', timestamp:{seconds:t-3000} },
  { id:'m6', homeId:'d4', awayId:'d6', homeName:'Delta Force',  awayName:'Zeta Division', hScore:2, aScore:1, round:2, status:'COMPLETED', type:'LEAGUE', timestamp:{seconds:t-2500} },
  { id:'m7', homeId:'d1', awayId:'d4', homeName:'Alpha Pod',    awayName:'Delta Force',   hScore:0, aScore:0, round:3, status:'SCHEDULED', type:'LEAGUE' },
  { id:'m8', homeId:'d2', awayId:'d6', homeName:'Beta Squad',   awayName:'Zeta Division', hScore:0, aScore:0, round:3, status:'SCHEDULED', type:'LEAGUE' },
  { id:'m9', homeId:'d3', awayId:'d5', homeName:'Gamma Unit',   awayName:'Epsilon Cell',  hScore:0, aScore:0, round:3, status:'SCHEDULED', type:'LEAGUE' },
];

export const DEMO_RECENT = DEMO_MATCHES.filter(m => m.status === 'COMPLETED').sort((a,b) => b.timestamp.seconds - a.timestamp.seconds).slice(0, 5);
