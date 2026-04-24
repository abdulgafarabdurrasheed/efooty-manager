import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="font-mono flex flex-col items-center justify-center min-h-[80vh] text-center px-4 space-y-6 animate-fade-in-up">
      <div className="font-mono relative">
        <div className="font-mono absolute inset-0 bg-black text-white border-2 border-black hover:bg-white hover:text-black blur-3xl opacity-20 rounded-none"></div>
        <AlertTriangle size={80} className="font-mono text-black relative z-10" />
      </div>
      
      <h1 className="font-mono text-7xl font-black text-black tracking-tighter">404</h1>
      
      <div className="font-mono space-y-2">
        <h2 className="font-mono text-2xl font-bold text-black">Page Not Found</h2>
        <p className="font-mono text-black max-w-md mx-auto">
          The tactical board looks empty here. This page doesn't exist or has been moved to another league.
        </p>
      </div>

      <Link 
        to="/" 
        className="font-mono 
          flex items-center gap-2 bg-white hover:bg-white border border-2 border-black 
          text-black font-bold py-3 px-6 rounded-none transition-all hover:scale-105 active:scale-95 shadow-none
        "
      >
        <Home size={18} />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
