import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, Shield, Loader2, Lock, Plus } from 'lucide-react';
import { LoginButton } from './components/AuthComponents';
import { useTournamentData } from './hooks/useTournamentData';
import { useTournamentActions } from './hooks/useTournamentActions';
import { useToast } from './hooks/useToast';
import PrintableReport from './components/PrintableReport';
import TournamentHeader from './components/TournamentHeader';
import TabNavigation from './components/TabNavigation';
import HighlightsSection from './components/HighlightsSection';
import ManagersDashboard from './components/ManagersDashboard';
import PlayerStatsView from './components/PlayerStatsView';
import AnalyticsView from './components/AnalyticsView';
import BracketView from './components/BracketView';
import FixturesList from './components/FixturesList';
import AIOracle from './components/AIOracle';
import SquadViewer from './components/SquadViewer';
import SprintPipeline from './components/SprintPipeline';
import PlayerCard from './components/PlayerCard';
import OnboardingTour from './components/OnboardingTour';
import Toast from './components/Toast';
import ViewFormationModal from './components/ViewFormationModal';
import JoinLeagueButton from './components/JoinLeagueButton';

import AdminConfirmationModal from './components/AdminConfirmationModal';
import DeleteTournamentModal from './components/DeleteTournamentModal';
import ScoreEntryModal from './components/ScoreEntryModal';
import EndTournamentModal from './components/EndTournamentModal';
import SettingsModal from './components/SettingsModal';
import GoalAssignmentModal from './components/GoalAssignmentModal';

export default function ProjectView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const { 
    user, 
    project, 
    players, 
    squadPlayers, 
    matches,
    recentReviews, 
    leaderboard,
    getHighlights,
    getDirectorInfo
  } = useTournamentData(projectId);

  const [activeTab, setActiveTab] = useState('directors');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [viewFormationId, setViewFormationId] = useState(null);
  const [pendingMatch, setPendingMatch] = useState(null);
  const [adminModal, setAdminModal] = useState({ isOpen: false, uid: null, name: null, isAdmin: false });
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [selectedMatchForLogging, setSelectedMatchForLogging] = useState(null);

  const actions = useTournamentActions({
    projectId,
    user,
    project,
    players,
    squadPlayers,
    matches,
    addToast,
    navigate
  });

  const highlights = useMemo(() => getHighlights(activeTab), [getHighlights, activeTab]);

  const handleMatchClick = (match) => {
    actions.handleMatchClick(match, setSelectedMatchForLogging, setScoreModalOpen);
  };

  const handleScoreConfirm = async (match, hScore, aScore) => {
    await actions.handleScoreConfirm(match, hScore, aScore, setPendingMatch, setScoreModalOpen, handleFinalizeMatch);
  };

  const handleFinalizeMatch = async (matchData, assignments) => {
    await actions.finalizeMatch(matchData, assignments, pendingMatch, setPendingMatch);
  };

  const openAdminModal = (uid, name, isAdmin) => {
    setAdminModal({ isOpen: true, uid, name, isAdmin });
  };

  const handleEndProject = async () => {
    await actions.handleEndProject(setShowEndModal, setShowSettings);
  };

  if (!user) {
    return (
      <div className="font-mono min-h-screen bg-white flex flex-col items-center justify-center text-center p-6 space-y-6">
        <Briefcase size={80} className="font-mono text-black animate-pulse" />
        <div>
          <h2 className="font-mono text-3xl font-black text-black tracking-tight mb-2">Welcome to E.F.O.O.T.Y Outcome Tracker</h2>
          <p className="font-mono text-black max-w-md mx-auto leading-relaxed">
            The ultimate project tracker for your local leagues. Sign in to manage your squad, create projects, and track stats in real-time.
          </p>
        </div>
        <div className="font-mono mt-4 transform scale-110">
          <LoginButton />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="font-mono min-h-screen bg-white flex items-center justify-center text-black gap-2">
        <Loader2 className="font-mono animate-spin" /> Loading Project...
      </div>
    );
  }

  const isMember = project.participants?.includes(user?.uid);
  const isOwner = project.ownerId === user?.uid;
  const isAdmin = project.admins?.includes(user?.uid);
  const canView = isMember || isOwner || project.visibility === 'PUBLIC' || !project.visibility;

  if (!canView) {
    return (
      <div className="font-mono min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="font-mono w-20 h-20 bg-white rounded-none flex items-center justify-center border-4 border-2 border-black shadow-none">
          <Lock size={32} className="font-mono text-black" />
        </div>
        <div>
          <h1 className="font-mono text-2xl font-black text-black mb-2">{project.name}</h1>
          <p className="font-mono text-black max-w-xs mx-auto">
            This project is restricted to members only. You must join to view the standings and fixtures.
          </p>
        </div>
        {project.registrationType === 'PUBLIC' ? (
          <JoinLeagueButton 
             user={user} 
             onJoin={actions.handleAddPlayer} 
             existingPlayers={players}
             registrationType={project.registrationType}
             inviteCode={project.inviteCode}
          />
        ) : (
          <div className="font-mono px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-none">
            Registration is Invite Only.
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <PrintableReport project={project} players={players} highlights={highlights} />
      <div className="font-mono min-h-screen bg-white text-black font-sans selection:bg-black pb-20 no-print">
        <div className="font-mono fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black -z-10"></div>

        <div className="font-mono max-w-7xl mx-auto p-4 md:p-8 space-y-8">
          
          <TournamentHeader 
            project={project}
            user={user}
            onCopyLink={actions.handleCopyLink}
            onOpenSettings={() => setShowSettings(true)}
            onNavigateProfile={() => navigate('/profile')}
          />

          {project.status === 'ended' && (
            <div className="font-mono bg-black text-white border-2 border-black hover:bg-white hover:text-black border border-2 border-black rounded-none p-4 flex items-center justify-center gap-3 text-black font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-4">
              <Shield size={24} /> Season Ended • Read Only Mode
            </div>
          )}

          <TabNavigation 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            project={project}
            players={players}
            user={user}
          />
          {activeTab === 'pipeline' ? (
            <SprintPipeline project={project} user={user} />
          ) : activeTab === 'oracle' ? (
            <AIOracle project={project} projectName={project.name} directors={players} squadPlayers={squadPlayers} matches={matches} />
          ) : activeTab === 'squad' ? (
            <SquadViewer user={user} onSyncSquad={actions.handleSyncSquad} isEnded={project.status === 'ended'} />
          ) : activeTab === 'analytics' ? (
            <AnalyticsView matches={matches} players={players} squadPlayers={squadPlayers} user={user} />
          ) : activeTab === 'fixtures' ? (
            <div id="log-match-form" className="font-mono scroll-mt-24">
              <FixturesList 
                projectId={projectId} 
                matches={matches}
                isAdmin={isOwner || isAdmin}
                onMatchClick={handleMatchClick}
              />
            </div>
          ) : activeTab === 'bracket' ? (
            <BracketView 
              projectId={projectId} 
              isAdmin={isOwner || isAdmin} 
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
              onFinalizeMatch={handleFinalizeMatch}
            />
          ) : (
            <>
              <HighlightsSection highlights={highlights} activeTab={activeTab} />

              {activeTab === 'directors' ? (
                <ManagersDashboard 
                  project={project}
                  user={user}
                  players={players}
                  leaderboard={leaderboard}
                  recentReviews={recentReviews}
                  matches={matches}
                  onAddPlayer={actions.handleAddPlayer}
                  onStartProject={actions.handleStartProject}
                  onPlayerClick={setSelectedPlayer}
                  onViewFormation={setViewFormationId}
                  onOpenAdminModal={openAdminModal}
                  onRemoveDirector={actions.handleRemoveDirector}
                  setActiveTab={setActiveTab}
                />
              ) : (
                <PlayerStatsView 
                  squadPlayers={squadPlayers}
                  user={user}
                  project={project}
                  matches={matches}
                  getDirectorInfo={getDirectorInfo}
                  updateSquadStat={actions.updateSquadStat}
                />
              )}
            </>
          )}
        </div>

        {pendingMatch && (
          <GoalAssignmentModal 
            matchData={pendingMatch} 
            homeSquad={squadPlayers.filter(p => String(p.directorId) === String(pendingMatch.homeId))}
            awaySquad={squadPlayers.filter(p => String(p.directorId) === String(pendingMatch.awayId))}
            onConfirm={(assignments) => handleFinalizeMatch(null, assignments)}
            onSkip={() => handleFinalizeMatch(null, {})}
            onCancel={() => setPendingMatch(null)} 
          />
        )}

        <AdminConfirmationModal 
          isOpen={adminModal.isOpen}
          name={adminModal.name}
          isAdmin={adminModal.isAdmin}
          onConfirm={() => actions.executeToggleAdmin(adminModal, setAdminModal)}
          onCancel={() => setAdminModal({ ...adminModal, isOpen: false })}
        />

        {(isOwner || isAdmin) && (
          <div className="font-mono tour-fab fixed bottom-6 right-6 z-40 md:hidden">
            {project.status === 'ACTIVE' && (
              <button  
                onClick={() => {
                  setActiveTab('fixtures');
                  setTimeout(() => document.getElementById('log-match-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                className="font-mono bg-green-600 text-black p-4 rounded-none shadow-none shadow-none/50 flex items-center justify-center animate-bounce-slow"
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
          onLeave={() => { setShowSettings(false); actions.handleLeaveProject(); }}
          isOwner={isOwner}
          canLeave={project.participants?.includes(user?.uid)}
          inviteCode={project.inviteCode}
        />

        <DeleteTournamentModal 
          isOpen={showDeleteModal}
          projectName={project.name}
          onConfirm={actions.handleDeleteProject}
          onCancel={() => setShowDeleteModal(false)}
        />

        <ScoreEntryModal 
          isOpen={scoreModalOpen} 
          match={selectedMatchForLogging} 
          matches={matches}
          onClose={() => setScoreModalOpen(false)} 
          onConfirm={handleScoreConfirm} 
        />

        <EndTournamentModal 
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

        <ViewFormationModal 
          viewFormationId={viewFormationId}
          players={players}
          onClose={() => setViewFormationId(null)}
        />
        
        <OnboardingTour isAdmin={isOwner || isAdmin} />
        
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
      </div>
    </>
  );
}