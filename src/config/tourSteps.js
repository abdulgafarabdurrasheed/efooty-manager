
export const getDesktopSteps = (isAdmin) => [
  {
    target: 'body',
    content: 'Welcome to E.F.O.O.T.Y Outcome Tracker! 🏆 Let\'s take a quick tour of your new dashboard.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-tabs',
    content: 'Navigate between Standings, Player Stats, Fixtures, and the Bracket here.',
  },
  {
    target: '.tour-stats-search',
    content: 'Looking for a specific rival? Use the deep search to find directors or players instantly.',
  },
  ...(isAdmin ? [{
    target: '.tour-admin-actions',
    content: '👑 Admin Zone: Here you can Log Reviews, Start the Project, or update settings.',
  }] : []),
  {
    target: '.tour-squad-btn',
    content: 'Manage your starting XI and bench here.',
  }
];

export const getMobileSteps = (isAdmin) => [
  {
    target: 'body',
    content: 'Welcome! Swipe through to learn the controls.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-tabs',
    content: 'Swipe these tabs left and right to switch views.',
    placement: 'bottom',
  },
  ...(isAdmin ? [{
    target: '.tour-fab',
    content: 'Tap this button anytime to Log a Match result quickly.',
  }] : []),
  {
    target: '.tour-profile-icon',
    content: 'Tap your avatar to edit your profile or gameplans.',
  }
];
