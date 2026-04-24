import React, { useState, useEffect } from 'react';
import { Shirt, Loader2, CheckCircle2 } from 'lucide-react';
import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebase';
import SquadBuilder from './SquadBuilder';

const SquadViewer = ({ user, onSyncSquad, isEnded }) => {
  const [orgCharts, setOrgCharts] = useState([]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchOrgCharts = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.orgCharts && data.orgCharts.length > 0) {
          setOrgCharts(data.orgCharts);
        } else {
          setOrgCharts([{ id: 1, name: "Default", teamName: "My Team", players: [] }]);
        }
      }
      setLoading(false);
    };
    fetchOrgCharts();
  }, [user]);

  const handleSync = async () => {
    if (!orgCharts[activePlanIndex]) return;
    setSyncing(true);
    await onSyncSquad(orgCharts[activePlanIndex]);
    setSyncing(false);
  };

  const FORMATIONS = {
    "4-4-2": [
      { x: 50, y: 90 },
      { x: 15, y: 70 }, { x: 38, y: 70 }, { x: 62, y: 70 }, { x: 85, y: 70 },
      { x: 15, y: 40 }, { x: 38, y: 40 }, { x: 62, y: 40 }, { x: 85, y: 40 },
      { x: 35, y: 15 }, { x: 65, y: 15 }
    ],
    "4-3-3": [
      { x: 50, y: 90 },
      { x: 15, y: 70 }, { x: 38, y: 70 }, { x: 62, y: 70 }, { x: 85, y: 70 },
      { x: 30, y: 45 }, { x: 50, y: 50 }, { x: 70, y: 45 },
      { x: 20, y: 20 }, { x: 50, y: 15 }, { x: 80, y: 20 }
    ],
    "3-4-3": [
      { x: 50, y: 90 },
      { x: 25, y: 70 }, { x: 50, y: 70 }, { x: 75, y: 70 },
      { x: 15, y: 45 }, { x: 38, y: 45 }, { x: 62, y: 45 }, { x: 85, y: 45 },
      { x: 20, y: 20 }, { x: 50, y: 15 }, { x: 80, y: 20 }
    ],
    "3-5-2": [
      { x: 50, y: 90 },
      { x: 25, y: 70 }, { x: 50, y: 70 }, { x: 75, y: 70 },
      { x: 10, y: 45 }, { x: 30, y: 45 }, { x: 50, y: 55 }, { x: 70, y: 45 }, { x: 90, y: 45 },
      { x: 35, y: 15 }, { x: 65, y: 15 }
    ],
    "5-3-2": [
      { x: 50, y: 90 },
      { x: 10, y: 65 }, { x: 30, y: 70 }, { x: 50, y: 70 }, { x: 70, y: 70 }, { x: 90, y: 65 },
      { x: 30, y: 45 }, { x: 50, y: 50 }, { x: 70, y: 45 },
      { x: 35, y: 15 }, { x: 65, y: 15 }
    ]
  };

  if (loading) return <div className="font-mono p-8 text-center text-black"><Loader2 className="font-mono animate-spin mx-auto" /> Loading Squad...</div>;
  if (orgCharts.length === 0) return <div className="font-mono p-8 text-center text-black">No orgCharts found. Create one in your profile!</div>;

  const currentPlan = orgCharts[activePlanIndex];

  return (
    <div className="font-mono h-full flex flex-col gap-6">
      <div className="font-mono bg-white  border border-2 border-black rounded-none p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono flex items-center gap-4 w-full md:w-auto">
          <div className="font-mono flex items-center gap-2 text-black font-bold">
            <Shirt className="font-mono text-black" /> 
            <span className="font-mono hidden md:inline">My Squad:</span>
          </div>
          <select 
            value={activePlanIndex}
            onChange={(e) => setActivePlanIndex(Number(e.target.value))}
            className="font-mono bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm focus:ring-2 focus:ring-yellow-500 outline-none flex-1 md:w-64"
          >
            {orgCharts.map((plan, idx) => (
              <option key={plan.id} value={idx}>{plan.name} ({plan.teamName})</option>
            ))}
          </select>
        </div>

        {onSyncSquad && !isEnded && (
          <button 
            onClick={handleSync}
            disabled={syncing || !orgCharts[activePlanIndex] || orgCharts[activePlanIndex].players.length === 0}
            className="font-mono w-full md:w-auto px-6 py-2 bg-white hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-none text-sm transition-all flex items-center justify-center gap-2 shadow-none shadow-none/20"
          >
            {syncing ? <Loader2 className="font-mono animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            {syncing ? "Syncing..." : "Register Squad"}
          </button>
        )}
      </div>

      <div className="font-mono flex-1">
        <SquadBuilder 
          initialPlayers={currentPlan.players} 
          isReadOnly={true} 
        />
      </div>
    </div>
  );
};

export default SquadViewer;
