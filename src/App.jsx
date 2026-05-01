import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { Briefcase } from 'lucide-react';
import { auth } from './firebase';
import { LoginButton, UserProfile } from './components/AuthComponents';
import Dashboard from './Dashboard';
import TournamentView from './TournamentView';
import ProfileView from './ProfileView';
import TournamentWizard from './TournamentWizard';
import NotFound from './components/NotFound';
import InteractiveDemo from './components/InteractiveDemo';
import RTOTracker from './components/RTOTracker';
import ProductivityEnforcer from './components/ProductivityEnforcer';
import CorporateGuide from './components/CorporateGuide';

function WelcomeScreen({ showDemo, handleDemoComplete }) {
  const navigate = useNavigate();

  if (showDemo) {
    return <InteractiveDemo onComplete={handleDemoComplete} />;
  }

  const features = [
    { icon: '', title: 'KPI Tracking', desc: 'Real-time yield metrics across all pods' },
    { icon: '', title: 'AI Oracle', desc: 'Gemini-powered executive agile coaching' },
    { icon: '', title: 'Sprint Pipeline', desc: 'Drag-and-drop Kanban board for sprints' },
    { icon: '', title: 'Chaos Monkey', desc: 'Automated resource optimization engine' },
    { icon: '', title: 'Board Meeting', desc: 'Auto-cycling presentation mode for execs' },
    { icon: '', title: 'Live Alerts', desc: 'Real-time corporate compliance ticker' },
  ];

  return (
    <div className="font-mono min-h-[90vh] bg-black text-white flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, white 49px, white 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, white 49px, white 50px)',
      }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">
        <div className="border-2 border-yellow-400 px-4 py-1 mb-8">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">Enterprise Framework</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4">
          E.F.O.O.T.Y
        </h1>
        <h2 className="text-lg md:text-xl font-bold text-white/60 uppercase tracking-widest mb-2">
          Enterprise Framework for Objective
        </h2>
        <h2 className="text-lg md:text-xl font-bold text-white/60 uppercase tracking-widest mb-8">
          & Outcome Tracking Yields
        </h2>

        <div className="w-24 h-1 bg-yellow-400 mb-8" />

        <p className="text-white/70 max-w-xl text-base leading-relaxed mb-12 font-medium">
          The definitive enterprise dashboard for deploying initiatives, tracking sprint velocity,
          and enforcing corporate compliance through data-driven yield optimization.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <LoginButton />
          <button
            onClick={() => navigate('/project/demo-project')}
            className="bg-yellow-400 text-black font-black py-3 px-8 uppercase border-2 border-yellow-400 hover:bg-transparent hover:text-yellow-400 transition-colors tracking-wider"
          >
            Explore Demo Project →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
          {features.map(f => (
            <div key={f.title} className="border border-white/10 p-4 text-left hover:border-yellow-400/50 transition-colors">
              <span className="text-2xl mb-2 block">{f.icon}</span>
              <h3 className="font-black uppercase text-sm tracking-tight mb-1">{f.title}</h3>
              <p className="text-xs text-white/40 font-medium">{f.desc}</p>
            </div>
          ))}
        </div> 

        <p className="mt-12 text-[10px] text-white/20 uppercase tracking-widest font-bold">
          Built with React • Firebase • Gemini AI • Tailwind CSS
        </p>
      </div>
    </div>
  ); 
}


export default function App() {
  const [user, setUser] = useState(null);  
  const [loading, setLoading] = useState(true);
  const [showDemo, setShowDemo] = useState(() => !localStorage.getItem('hasSeenDemo')); 

  const handleDemoComplete = () => { 
    localStorage.setItem('hasSeenDemo', 'true');
    setShowDemo(false); 
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => setLoading(false), 2000);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      clearTimeout(timeoutId);
    });
    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return <div className="font-mono min-h-screen bg-white flex items-center justify-center text-black">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className="font-mono min-h-screen bg-white text-black font-mono selection:bg-black selection:text-white ">
        <RTOTracker />
        <ProductivityEnforcer />
        <CorporateGuide user={user} />
        <header className="pt-16 font-mono bg-white  border-b border-2 border-black sticky top-0 z-40">
          <div className="font-mono max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="font-mono flex items-center gap-3">
              <div className="font-mono bg-gradient-to-br from-yellow-400 to-orange-600 p-2 rounded-none text-black shadow-none shadow-none/20">
                <Briefcase size={20} strokeWidth={3} />
              </div>
              <h1 className="font-mono text-xl font-black text-black tracking-tight hidden sm:block">
                E.F.O.O.T.Y <span className="font-mono text-black">Director</span>
              </h1>
            </div> 
            
            <div>
              {user ? <UserProfile user={user} /> : <LoginButton />} 
            </div>
          </div>
        </header> 

        <main>
          <Routes>
            <Route path="/" element={user ? <Dashboard user={user} /> : <WelcomeScreen showDemo={showDemo} handleDemoComplete={handleDemoComplete} />} />
            <Route path="/create" element={user ? <TournamentWizard user={user} /> : <WelcomeScreen showDemo={false} handleDemoComplete={handleDemoComplete} />} />
            <Route path="/profile" element={user ? <ProfileView user={user} /> : <WelcomeScreen showDemo={false} handleDemoComplete={handleDemoComplete} />} />
            
            <Route path="/project/:projectId" element={<TournamentView user={user} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  ); 
}
