import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, ArrowRight, Calendar, Users, Activity, Star, ChevronRight, Search, Copy, CheckCircle2, Gamepad2, Monitor, Smartphone, Tv } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from './firebase';

const DEPARTMENTS = [
  { id: 'ALL', label: 'All Initiatives' },
  { id: 'ENGINEERING', label: 'Product Engineering' },
  { id: 'SALES', label: 'Direct Sales' },
  { id: 'MARKETING', label: 'Marketing' },
  { id: 'OTHER', label: 'Cross-Functional' }
];

const WORK_MODELS = [
  { id: 'ALL', label: 'All Platforms' },
  { id: 'MOBILE', label: 'Remote' },
  { id: 'HYBRID', label: 'Hybrid/PC' },
  { id: 'CONSOLE', label: 'On-site' }
];

export default function Dashboard({ user }) {
  const [activeProjects, setActiveProjects] = useState([]);
  const [openProjects, setOpenProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [workModelFilter, setWorkModelFilter] = useState("ALL");
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  const fetchProjects = (userId) => {
    const q = query(collection(db, "projects"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      allProjects.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return tB - tA;
      });
      
      console.log("Snapshot got", allProjects.length, "docs");
      const myActive = allProjects.filter(t => 
        t.participants && t.participants.includes(userId) && t.status !== 'ended'
      );
      
      const open = allProjects.filter(t => 
        (t.status === 'REGISTRATION_OPEN' || t.status === 'open') &&
        (!t.participants || !t.participants.includes(userId)) &&
        (
          t.visibility === 'PUBLIC' || 
          !t.visibility || 
          (t.visibility === 'MEMBERS_ONLY' && t.registrationType === 'PUBLIC')
        )
      );

      setActiveProjects(myActive);
      console.log("My Active:", myActive);
      setOpenProjects(open);
    });

    return unsubscribe;
  };

  useEffect(() => {
    if (user) {
      fetchProjects(user.uid);
    }
  }, [user]);

  const handleJoin = async (project) => {
    if (!user) return;
    if (!window.confirm(`Join ${project.name}?`)) return;

    try {
      const projectRef = doc(db, "projects", project.id);
      await updateDoc(projectRef, {
        participants: arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error joining project:", error);
      alert("Failed to join project");
    }
  };

  const handleCopyLink = (e, projectId) => {
    e.stopPropagation();
    const url = `${window.location.origin}/project/${projectId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(projectId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOpenProjects = openProjects.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.hostName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGame = gameFilter === 'ALL' || t.game === gameFilter;
    const matchesPlatform = platformFilter === 'ALL' || t.platform === platformFilter;
    
    return matchesSearch && matchesGame && matchesPlatform;
  });

  return (
    <div className="font-mono min-h-screen bg-white text-black font-sans selection:bg-black  pb-20">
      <div className="font-mono fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black -z-10"></div>

      <div className="font-mono max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <header className="font-mono flex flex-col md:flex-row justify-between items-center gap-6 border-b border-2 border-black pb-6">
          <div className="font-mono flex items-center gap-4">
            <div className="font-mono bg-white/20 transform -rotate-6">
              <Briefcase size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-mono text-4xl font-black text-black tracking-tighter">E.F.O.O.T.Y <span className="font-mono text-transparent bg-clip-text bg-white">Director</span></h1>
              <p className="font-mono text-black text-sm font-medium tracking-wide">DASHBOARD TERMINAL</p>
            </div>
          </div>
        </header>

        <section className="font-mono space-y-4">
          <h2 className="font-mono text-2xl font-bold text-black">Welcome, {user.displayName}</h2>
          <p className="font-mono text-black">Manage your career and projects.</p>
        </section>

        <div className="font-mono grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="font-mono lg:col-span-2 space-y-8">
            
            <div>
              <h3 className="font-mono text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Activity className="font-mono text-green-500" size={20} /> Ongoing Initiatives
              </h3>
              <div className="font-mono grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProjects.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => navigate(`/project/${t.id}`)}
                    className="font-mono relative group bg-white border border-2 border-black rounded-none p-6 cursor-pointer overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                  >
                    <div className="font-mono absolute inset-0 border-2 border-transparent group-hover:border-blue-500/50 rounded-none transition-colors z-20 pointer-events-none"></div>
                    
                    <div className="font-mono absolute -right-10 -top-10 w-40 h-40 bg-white blur-[60px] rounded-none group-hover:bg-white transition-colors"></div>

                    <div className="font-mono relative z-10">
                      <div className="font-mono flex justify-between items-start mb-4">
                        <div className="font-mono p-3 bg-white rounded-none  transition-colors shadow-none">
                          <Briefcase size={28} />
                        </div>
                        <div className="font-mono flex items-center gap-2 bg-black/40  px-3 py-1 rounded-none border border-2 border-black">
                          <div className="font-mono w-2 h-2 rounded-none bg-white neon-pulse"></div>
                          <span className="font-mono text-[10px] font-bold text-green-400 uppercase">Live</span>
                        </div>
                      </div>
                      
                      <h3 className="font-mono text-2xl font-black text-black mb-1 group-hover:text-black transition-colors truncate">
                        {t.name}
                      </h3>
                      <p className="font-mono text-black text-sm mb-6">Hosted by {t.hostName || 'Unknown'}</p>

                      <div className="font-mono flex items-center justify-between border-t border-2 border-black pt-4">
                        <div className="font-mono flex -space-x-3">
                          {(t.participants || []).slice(0, 3).map((pid, i) => (
                             <div key={i} className="font-mono w-8 h-8 rounded-none border-2 border-2 border-black bg-white flex items-center justify-center overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${pid}&backgroundColor=transparent`} alt="User" className="font-mono w-full h-full" />
                             </div>
                          ))}
                          {(t.participants?.length || 0) > 3 && (
                            <div className="font-mono w-8 h-8 rounded-none border-2 border-2 border-black bg-white flex items-center justify-center text-[10px] text-black font-bold">
                              +{t.participants.length - 3}
                            </div>
                          )}
                          {(!t.participants || t.participants.length === 0) && (
                             <div className="font-mono text-xs text-black italic pl-2">No players yet</div>
                          )}
                        </div>
                        <div className="font-mono text-black text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Enter Lobby <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => navigate('/create')}
                  className="font-mono bg-white border-2 border-dashed border-2 border-black rounded-none p-6 flex flex-col items-center justify-center gap-3 text-black hover:text-black hover:border-2 border-black hover:bg-white transition-all min-h-[140px]"
                >
                  <div className="font-mono bg-white p-3 rounded-none group-hover:bg-black text-white border-2 border-black hover:bg-white hover:text-black group-hover:text-black transition-colors">
                    <Plus size={24} />
                  </div>
                  <span className="font-mono font-bold">Create New Project</span>
                </button>
              </div>
            </div>

            <div>
              <div className="font-mono flex justify-between items-end mb-4">
                <h3 className="font-mono text-lg font-bold text-black flex items-center gap-2">
                  <Star className="font-mono text-black" size={20} /> Open for Registration
                </h3>
              </div>

              <div className="font-mono flex flex-col md:flex-row gap-4 mb-6">
                <div className="font-mono relative flex-1">
                  <Search className="font-mono absolute left-4 top-1/2 -translate-y-1/2 text-black" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search projects..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="font-mono w-full bg-white border border-2 border-black rounded-none pl-12 pr-4 py-3 text-black focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                  />
                </div>
                 <select 
                  className="font-mono bg-white text-black border border-2 border-black p-2 md:p-3 w-full md:w-auto font-bold appearance-none rounded-none focus:outline-none cursor-pointer focus:-translate-y-1 transition-transform"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  {DEPARTMENTS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
                <select 
                  className="font-mono bg-white text-black border border-2 border-black p-2 md:p-3 w-full md:w-auto font-bold appearance-none rounded-none focus:outline-none cursor-pointer focus:-translate-y-1 transition-transform"
                  value={workModelFilter}
                  onChange={(e) => setWorkModelFilter(e.target.value)}
                >
                  {WORK_MODELS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>

              {filteredOpenProjects.length === 0 ? (
                <div className="font-mono text-center py-12 bg-white rounded-none border border-2 border-black border-dashed">
                  <Briefcase size={48} className="font-mono mx-auto text-black mb-3" />
                  <p className="font-mono text-black font-medium">No open projects found.</p>
                  {searchQuery && <p className="font-mono text-xs text-black mt-1">Try a different search term.</p>}
                </div>
              ) : (
                <div className="font-mono space-y-3">
                  {filteredOpenProjects.map(t => (
                    <div key={t.id} className="font-mono bg-white border border-2 border-black p-4 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white transition-colors group">
                      <div>
                        <h4 className="font-mono font-bold text-black text-lg">{t.name}</h4>
                        <div className="font-mono flex items-center gap-4 text-black text-xs font-bold uppercase tracking-wider">
                            <span className="font-mono flex items-center gap-1.5 opacity-80">
                              <Network size={12} /> {DEPARTMENTS.find(g => g.id === t.game)?.label || t.game}
                            </span>
                            <span className="font-mono flex items-center gap-1.5 opacity-80">
                              <Laptop size={12} /> {WORK_MODELS.find(p => p.id === t.platform)?.label || t.platform}
                            </span>
                          </div>
                      </div>
                      <div className="font-mono flex items-center gap-2">
                        <button 
                          onClick={(e) => handleCopyLink(e, t.id)}
                          className="font-mono p-2 rounded-none bg-white text-black "
                          title="Copy Link"
                        >
                          {copiedId === t.id ? <CheckCircle2 size={18} className="font-mono text-green-500" /> : <Copy size={18} />}
                        </button>
                        
                        {(t.visibility === 'PUBLIC' || !t.visibility) ? (
                          <button onClick={() => navigate(`/project/${t.id}`)} className="font-mono flex-1 sm:flex-none px-6 py-2 bg-white hover:bg-white text-black text-sm font-bold rounded-none transition-colors shadow-none shadow-none/20">
                            View
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleJoin(t)} 
                            className="font-mono flex-1 sm:flex-none px-6 py-2 bg-black text-white hover:bg-white hover:text-black border-2 border-black  text-black text-sm font-bold rounded-none transition-colors shadow-none shadow-none/20 flex items-center justify-center gap-2"
                          >
                            <Plus size={16} /> Join
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="font-mono space-y-6">
            <div className="font-mono bg-white">
              <div className="font-mono absolute top-0 right-0 w-32 h-32 bg-black text-white border-2 border-black hover:bg-white hover:text-black rounded-none blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="font-mono text-sm font-bold text-black uppercase tracking-wider mb-4">Resource Matrix</h3>
              <div className="font-mono grid grid-cols-2 gap-4">
                <div className="font-mono bg-white p-3 rounded-none border border-2 border-black">
                  <div className="font-mono text-2xl font-black text-black">0</div>
                  <div className="font-mono text-xs text-black">Sprints</div>
                </div>
                <div className="font-mono bg-white p-3 rounded-none border border-2 border-black">
                  <div className="font-mono text-2xl font-black text-green-500">0%</div>
                  <div className="font-mono text-xs text-black">Completion Rate</div>
                </div>
                <div className="font-mono bg-white p-3 rounded-none border border-2 border-black">
                  <div className="font-mono text-2xl font-black text-black">0</div>
                  <div className="font-mono text-xs text-black">Milestones</div>
                </div>
                <div className="font-mono bg-white p-3 rounded-none border border-2 border-black">
                  <div className="font-mono text-2xl font-black text-black">0</div>
                  <div className="font-mono text-xs text-black">Releases</div>
                </div>
              </div>
            </div>

            <div className="font-mono bg-white border border-2 border-black rounded-none overflow-hidden">
              <div className="font-mono p-4 border-b border-2 border-black">
                <h3 className="font-mono text-sm font-bold text-black uppercase tracking-wider">Quick Actions</h3>
              </div>
              <div className="font-mono divide-y divide-slate-800">
                <button onClick={() => navigate('/profile')} className="font-mono w-full p-4 flex items-center justify-between hover:bg-white transition-colors group">
                  <div className="font-mono flex items-center gap-3">
                    <div className="font-mono bg-white p-2 rounded-none text-black  transition-colors">
                      <Users size={18} />
                    </div>
                    <div className="font-mono text-left">
                      <div className="font-mono font-bold text-black text-sm">Manage Org Chart</div>
                      <div className="font-mono text-xs text-black">Edit roles & assignments</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="font-mono text-black group-hover:text-black" />
                </button>
                
                <button className="font-mono w-full p-4 flex items-center justify-between hover:bg-white transition-colors group">
                  <div className="font-mono flex items-center gap-3">
                    <div className="font-mono bg-purple-500/10 p-2 rounded-none text-purple-500 group-hover:bg-purple-500 group-hover:text-black transition-colors">
                      <Star size={18} />
                    </div>
                    <div className="font-mono text-left">
                      <div className="font-mono font-bold text-black text-sm">Recruit Talent</div>
                      <div className="font-mono text-xs text-black">Find new hires</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="font-mono text-black group-hover:text-black" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
