import React, { useState  } from 'react';
import { Activity, GitBranch, Network, Crown, Trash2, LayoutTemplate } from 'lucide-react';
import LeagueTable, { MultiGroupTables } from './LeagueTable';
import RecentActivity from './RecentActivity';
import JoinLeagueButton from './JoinLeagueButton';
import PipModal from './PipModal';
import StandupFeed from './StandupFeed';
import SynergyBurndownMatrix from './SynergyBurndownMatrix';
import ChaosMonkeyModal from './ChaosMonkeyModal';
import AbsurdOrgChart from './AbsurdOrgChart';
import QuaterlyReportModal from './QuaterlyReportModal';
import { FileText } from 'lucide-react';


export default function ManagersDashboard({ 
  project,
  user,
  players,
  leaderboard, 
  recentReviews,
  matches,
  onAddPlayer,
  onStartProject,
  onPlayerClick,
  onViewFormation,
  onOpenAdminModal,
  onRemoveDirector,
  setActiveTab,
  projectId
}) {
  const isOwner = user?.uid === project?.ownerId;
  const isAdmin = project?.admins?.includes(user?.uid);
  const canStart = (isOwner || isAdmin) && project?.status !== 'ACTIVE' && project?.status !== 'ended';
  const showJoinButton = project?.status !== 'ended' && project?.status !== 'ACTIVE';
  const isKnockout = project?.format === 'KNOCKOUT';
  const isHybridMultiGroup = project?.format === 'HYBRID' && project?.settings?.hybridConfig?.type === 'MULTI_GROUP';
  const [selectedPipPlayer, setSelectedPipPlayer] = useState(null);
  const [isChaosOpen, setIsChaosOpen] = useState(false);
  const [showQuaterlyReport, setShowQuaterlyReport] = useState(false)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 pb-20">
      <div className="tour-admin-panel lg:col-span-2 space-y-6">
        {showJoinButton && (
          <JoinLeagueButton 
              user={user} 
              onJoin={onAddPlayer} 
              existingPlayers={players} 
              registrationType={project.registrationType}
              inviteCode={project.inviteCode}
          />
        )}
        
        {canStart && !isKnockout && (
          <button 
            onClick={onStartProject}
            className="
              tour-admin-actions relative overflow-hidden group bg-black text-white border-2 border-black hover:bg-white hover:text-black font-black py-4 px-8 rounded-none shadow-none 
              transform transition-all duration-100 
              hover:bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:scale-105 hover:shadow-none/40 
              active:scale-95 active:shadow-none w-full flex items-center justify-center gap-2
            "
          >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
            
            <span className="relative z-20 flex items-center gap-2">
              <Activity size={20} className="fill-black" /> START INITIATIVE
            </span>
          </button>
        )}

        <button
          onClick={() => setShowQuaterlyReport(true)}
          className="flex items-center gap-2 bg-black text-white border-2 border-black px-4 py-2 font-bold uppercase hover:bg-yellow-400 hover:text-black transition-colors text-xs"
        >
          <FileText size={14} /> Quarterly Report
        </button>

        <div className="bg-white  rounded-none border border-2 border-black overflow-hidden shadow-none">
          <div className="p-6 border-b border-2 border-black flex justify-between items-center bg-white">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              {isKnockout ? <GitBranch className="text-black" size={20} /> : <Activity className="text-black" size={20} />}
              {isKnockout ? 'Project Bracket' : 'Live Leaderboard'}
            </h2>
            <span className="px-3 py-1 rounded-none bg-white text-black text-xs font-mono border border-2 border-black">SEASON 1</span>
          </div>

          <div className="mb-8 p-4 bg-red-100 border-4 border-red-500 shadow-[8px_8px_0px_0px_rgba(239,68,68,1)] flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-red-600 uppercase tracking-tighter">⚠️ Executive Override</h3>
              <p className="text-sm font-bold text-black uppercase">Automated Resource Liquidator</p>
            </div>
            <button 
              onClick={() => setIsChaosOpen(true)}
              className="bg-red-600 text-white font-black text-lg py-3 px-8 uppercase tracking-widest border-4 border-black hover:bg-black hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              Optimize Resources
            </button>
          </div>
          
          {isKnockout ? (
            <KnockoutParticipantsList 
              players={players}
              project={project}
              user={user}
              onPlayerClick={onPlayerClick}
              onViewFormation={onViewFormation}
              onOpenAdminModal={onOpenAdminModal}
              onRemoveDirector={onRemoveDirector}
              setActiveTab={setActiveTab}
            />
          ) : (
            isHybridMultiGroup 
              ? <MultiGroupTables
                  leaderboard={leaderboard}
                  user={user}
                  project={project}
                  matches={matches}
                  onPlayerClick={onPlayerClick}
                  onViewFormation={onViewFormation}
                  onOpenAdminModal={onOpenAdminModal}
                  onRemoveDirector={onRemoveDirector}
                />
              : <div className="font-mono mb-8 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-150">
                  <SynergyBurndownMatrix matches={matches} />
                  <AbsurdOrgChart projectId={projectId} />

                  <LeagueTable 
                    tablePlayers={leaderboard}
                    user={user}
                    project={project}
                    matches={matches}
                    onPlayerClick={onPlayerClick}
                    onViewFormation={onViewFormation}
                    onOpenAdminModal={onOpenAdminModal}
                    onRemoveDirector={onRemoveDirector}
                    onPipClick={setSelectedPipPlayer}
                  />
                </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="font-mono animate-in fade-in slide-in-from-right-8 duration-500 delay-300">
             <StandupFeed projectId={project.id} user={user} />
          </div>

          <div className="font-mono bg-white  border border-2 border-black shadow-none overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500 delay-300">
            <div className="font-mono p-4 border-b border-2 border-black bg-white flex justify-between items-center">
              <h2 className="font-mono text-lg font-bold text-black uppercase tracking-tighter">Sprint Logs</h2>
              <span className="font-mono text-xs font-bold text-black border border-2 border-black px-2 py-1 rounded-none uppercase">Last 5</span>
            </div>
            <div className="font-mono p-0">
               <RecentActivity 
                  recentReviews={recentReviews} 
                  players={players}
                  matches={matches}
               />
            </div>
          </div>
          
        </div>
      </div>
      {selectedPipPlayer && (
        <PipModal 
          player={selectedPipPlayer} 
          onClose={() => setSelectedPipPlayer(null)} 
        />
      )}
      <ChaosMonkeyModal
        isOpen={isChaosOpen}
        onClose={() => setIsChaosOpen(false)}
        players={players}
        onConfirm={(targetId) => {
          console.log("Fired target:", targetId);
          onRemoveDirector(targetId);
        }}
      />
      {showQuaterlyReport && (
        <QuaterlyReportModal
          players={players}
          onClose={() => setShowQuaterlyReport(false)}
        />
      )}
    </div>
  );
}


function KnockoutParticipantsList({
  players,
  project,
  user,
  onPlayerClick,
  onViewFormation,
  onOpenAdminModal,
  onRemoveDirector,
  setActiveTab
}) {
  const isOwner = user?.uid === project?.ownerId;

  return (
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
              <td className="p-4 cursor-pointer" onClick={() => onPlayerClick(player)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-none bg-white flex items-center justify-center border border-2 border-black">
                    <span className="text-xs font-bold">{player.team ? player.team.substring(0,2).toUpperCase() : 'FC'}</span>
                  </div>
                  <div>
                    <div className="font-bold text-black group-hover:text-black transition-colors flex items-center gap-2">
                      {player.name}
                      
                      {(() => {
                        const isPlayerAdmin = project.admins?.includes(player.uid);
                        const isSelf = user.uid === player.uid;

                        if (isOwner && !isSelf) {
                          return (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => onOpenAdminModal(player.uid, player.name, isPlayerAdmin)}
                                className={`p-1.5 rounded-none transition-all ${isPlayerAdmin ? 'text-black bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:bg-red-500/20 hover:text-red-500' : 'text-black hover:text-black hover:bg-white'}`}
                                title={isPlayerAdmin ? "Remove Admin" : "Make Admin"}
                              >
                                <Crown size={18} className={isPlayerAdmin ? "fill-yellow-500 hover:fill-red-500" : ""} />
                              </button>
                              <button 
                                onClick={() => onRemoveDirector(player.uid, player.name)}
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
                                onClick={() => onRemoveDirector(player.uid, player.name)}
                                className="p-1.5 rounded-none text-black hover:text-red-500 hover:bg-red-500/10 transition-all"
                                title="Remove from Project"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                           );
                        }

                        if (isPlayerAdmin) {
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
                  onClick={(e) => { e.stopPropagation(); onViewFormation(player.id); }}
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
}
