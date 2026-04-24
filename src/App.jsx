import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { Briefcase } from 'lucide-react';
import { auth } from './firebase';
import { LoginButton, UserProfile } from './components/AuthComponents';
import Dashboard from './Dashboard';
import TournamentView from './TournamentView';
import ProfileView from './ProfileView';
import TournamentWizard from './TournamentWizard';
import NotFound from './components/NotFound';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <header className="font-mono bg-white  border-b border-2 border-black sticky top-0 z-40">
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
          {!user ? (
            <div className="font-mono flex flex-col items-center justify-center h-[80vh] text-center space-y-6 px-4">
              <div className="font-mono bg-white p-6 rounded-none mb-4 shadow-none shadow-none/10 ring-1 ring-slate-800">
                <Briefcase size={64} className="font-mono text-black" />
              </div>
              <h2 className="font-mono text-4xl md:text-5xl font-black text-black tracking-tight">
                Welcome to <span className="font-mono text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">E.F.O.O.T.Y Director</span>
              </h2>
              <p className="font-mono text-black max-w-lg text-lg leading-relaxed">
                The ultimate project tracker for your local leagues. Sign in to manage your organization, track KPIs, and hit revenue targets.
              </p>
              <div className="font-mono mt-8 transform scale-110">
                <LoginButton />
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/create" element={<TournamentWizard user={user} />} />
              <Route path="/profile" element={<ProfileView user={user} />} />
              <Route path="/project/:projectId" element={<TournamentView user={user} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </main>
      </div>
    </BrowserRouter>
  );
}
