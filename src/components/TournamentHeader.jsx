import React from 'react';
import { Briefcase, Settings, Share2 } from 'lucide-react';
import { UserProfile } from './AuthComponents';


export default function ProjectHeader({ 
  project, 
  user, 
  onCopyLink, 
  onOpenSettings,
  onNavigateProfile
}) {
  const isOwner = user?.uid === project?.ownerId;
  const isAdmin = project?.admins?.includes(user?.uid);
  const isParticipant = project?.participants?.includes(user?.uid);
  const canShare = project?.registrationType === 'PUBLIC' || isOwner || isAdmin;
  const canAccessSettings = isOwner || isAdmin || isParticipant;

  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-2 border-black pb-6">
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-600 p-3 rounded-none text-black shadow-none shadow-none/20 transform -rotate-6">
          <Briefcase size={32} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-black tracking-tighter">{project.name}</h1>
          <div className="flex items-center gap-3 text-black text-sm font-medium tracking-wide">
            <span className="uppercase">{project.type || project.format}</span>
            {canShare && (
              <button 
                onClick={onCopyLink}
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
        {canAccessSettings && (
          <button 
            onClick={onOpenSettings}
            className="p-2 rounded-none bg-white hover:bg-white text-black hover:text-black transition-colors"
            title="Project Settings"
          >
            <Settings size={20} />
          </button>
        )}
        <UserProfile user={user} onOpenProfile={onNavigateProfile} />
      </div>
    </header>
  );
}
