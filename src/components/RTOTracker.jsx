import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';

export default function RTOTracker() {
    const [rtoStatus, setRtoStatus] = useState('checking');
    const { addToast } = useToast();

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            setRtoStatus('denied');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setRtoStatus('far')
                addToast("Location acquired. HQ proximity ping: FAILED.", "error");
            },
            (error) => {
                setRtoStatus('denied');
                addToast("Insubordination logged: Geolocation denied.", "error");
            }
        );
    }, [addToast]);

    if (rtoStatus === 'checking') return null;

    return (
        <div className="fixed top-0 left-0 w-full z-[100] bg-red-600 text-white font-black p-3 border-b-8 border-black flex items-center justify-between shadow-[0_8px_0px_0px_rgba(0,0,0,1)] hover:bg-red-700 transition-colors cursor-not-allowed">
        <div className="flex items-center gap-4 animate-pulse mx-auto md:mx-0">
            <span className="text-2xl">🚨</span>
            <span className="uppercase tracking-widest text-sm md:text-base">
            {rtoStatus === 'denied' 
                ? "MANDATORY RTO VIOLATION: GEOLOCATION BLOCKED"
                : "MANDATORY RTO VIOLATION: CURRENT LOCATION != CORPORATE HQ"}
            <span className="ml-4 text-black bg-yellow-400 px-2 py-1">-10% YIELD PENALTY</span>
            </span>
            <span className="text-2xl">🚨</span>
        </div>
        <button 
            onClick={() => alert("Appeal denied. Executive synergy requires physical presence. Return to your designated cubicle immediately.")}
            className="hidden md:block bg-black text-white text-xs px-4 py-2 uppercase tracking-wider hover:bg-yellow-400 hover:text-black border-2 border-white hover:border-black transition-all font-bold"
        >
            File Appeal (Auto-Deny)
        </button>
        </div>
    );
};