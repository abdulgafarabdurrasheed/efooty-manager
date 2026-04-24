import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Shirt, User, Shield, Settings, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from './firebase';
import { UserProfile } from './components/AuthComponents';

const POSITIONS = [
  "L_ANL", "R_ANL", "EXEC", "AAARCHOCOC", 
  "SPC", "L_SPC", "R_SPC", "PM", "SEN", 
  "L-JR", "R-JR", "MGR", "L_TL", "R_TL", "DIR"
];

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

const getBoardPosition = (x, y) => {
  
  if (y > 80 && x > 35 && x < 65) return "DIR";
  
  if (y > 60) {
    if (x < 25) return "L_TL";
    if (x > 75) return "R_TL";
    return "MGR";
  }
  
  if (y > 35) {
    if (x < 20) return "L_SPC";
    if (x > 80) return "R_SPC";
    if (y > 50) return "SEN";
    if (y < 45) return "PM";
    return "SPC";
  }
  
  if (y <= 35) {
    if (x < 30) return "L_ANL";
    if (x > 70) return "R_ANL";
    if (y > 20) return "AAARCHOCOC";
    return "EXEC";
  }
  
  return "SPC";
};

const Toast = ({ message, type, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(0), 50);
    const closeTimer = setTimeout(onClose, 3000);
    return () => { clearTimeout(timer); clearTimeout(closeTimer); };
  }, [onClose]);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`relative overflow-hidden flex items-center gap-3 px-6 py-3 rounded-none shadow-none border ${
        type === 'error' ? 'bg-red-950 border-red-500/50 text-red-200' : 'bg-white border-2 border-black text-black'
      }`}>
        {type === 'error' && <AlertTriangle size={20} className="text-red-500" />}
        <span className="font-bold text-sm">{message}</span>
        <div 
          className={`absolute bottom-0 left-0 h-1 ${type === 'error' ? 'bg-red-500' : 'bg-white'} transition-all ease-linear duration-[3000ms]`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default function ProfileView() {
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [orgCharts, setStructures] = useState([
    { id: 1, name: "Structure 1", teamName: "My Team", consultants: [] },
    { id: 2, name: "Structure 2", teamName: "My Team", consultants: [] },
    { id: 3, name: "Structure 3", teamName: "My Team", consultants: [] }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState("4-4-2");
  const [selectedConsultantId, setSelectedConsultantId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const boardRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.orgCharts && data.orgCharts.length > 0) {
            const loadedPlans = data.orgCharts;
            const mergedPlans = [0, 1, 2].map(i => loadedPlans[i] || { 
              id: i + 1, 
              name: `Structure ${i + 1}`, 
              teamName: "My Team", 
              consultants: [] 
            });
            setStructures(mergedPlans);
          }
        }
        setLoading(false);
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        orgCharts: orgCharts
      });
      setTimeout(() => setSaving(false), 800);
    } catch (error) {
      console.error("Error saving orgCharts:", error);
      setSaving(false);
    }
  };

  const updateCurrentPlan = (updates) => {
    setStructures(prev => {
      const newPlans = [...prev];
      newPlans[activePlanIndex] = { ...newPlans[activePlanIndex], ...updates };
      return newPlans;
    });
  };

  const applyFormation = (formationName) => {
    setSelectedFormation(formationName);
    const template = FORMATIONS[formationName];
    if (!template) return;

    const currentEmployees = [...(orgCharts[activePlanIndex].consultants || [])];
    const activeTalent = currentEmployees.filter(p => p.isOnBoard);
    const benchTalent = currentEmployees.filter(p => !p.isOnBoard);
    
    const newActiveTalent = [];
    const newBenchEmployees = [...benchTalent];

    for (let i = 0; i < template.length; i++) {
      if (i < activeTalent.length) {
        newActiveTalent.push({
          ...activeTalent[i],
          x: template[i].x,
          y: template[i].y,
          isOnBoard: true
        });
      }
    }

    if (activeTalent.length > template.length) {
      for (let i = template.length; i < activeTalent.length; i++) {
        newBenchEmployees.push({ ...activeTalent[i], isOnBoard: false });
      }
    }

    updateCurrentPlan({ consultants: [...newActiveTalent, ...newBenchEmployees] });
  };

  const addToast = (message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const addConsultant = (name, position = 'FWD') => {
    const currentEmployees = orgCharts[activePlanIndex].consultants || [];
    
    if (currentEmployees.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      addToast(`Consultant "${name}" already exists in this orgChart`, "error");
      return;
    }

    const newConsultant = {
      id: crypto.randomUUID(),
      name: name || "Consultant",
      position,
      x: 50,
      y: 50,
      isOnBoard: false
    };
    
    updateCurrentPlan({ consultants: [...currentEmployees, newConsultant] });
  };

  const removeConsultant = (employeeId) => {
    const currentEmployees = orgCharts[activePlanIndex].consultants || [];
    updateCurrentPlan({ consultants: currentEmployees.filter(p => p.id !== employeeId) });
  };

  const checkRoleLimit = (role, count) => {
    if (role === 'DIR' && count > 1) return "Only 1 DIR allowed";
    if (role === 'MGR' && count > 3) return "Max 3 MGRs allowed";
    if (role === 'L_TL' && count > 1) return "Max 1 L_TL allowed";
    if (role === 'R_TL' && count > 1) return "Max 1 R_TL allowed";
    if (role === 'L_SPC' && count > 1) return "Max 1 L_SPC allowed";
    if (role === 'R_SPC' && count > 1) return "Max 1 R_SPC allowed";
    if (role === 'EXEC' && count > 2) return "Max 2 EXECs allowed";
    if (role === 'AARCHOC' && count > 2) return "Max 2 AARCHOCs allowed";
    if (role === 'L_ANL' && count > 1) return "Max 1 L_ANL allowed";
    if (role === 'R_ANL' && count > 1) return "Max 1 R_ANL allowed";
    return null;
  };

  const updateConsultantPosition = (employeeId, x, y) => {
    const currentEmployees = orgCharts[activePlanIndex].consultants || [];
    const sourceConsultant = currentEmployees.find(p => p.id === employeeId);
    if (!sourceConsultant) return;
    
    const targetConsultant = currentEmployees.find(p => 
      p.id !== employeeId && 
      p.isOnBoard && 
      Math.abs(p.x - x) < 5 && 
      Math.abs(p.y - y) < 5
    );

    let simulatedEmployees;

    if (targetConsultant) {
      simulatedEmployees = currentEmployees.map(p => {
        if (p.id === targetConsultant.id) {
          if (!sourceConsultant.isOnBoard) {
             return { ...p, isOnBoard: false };
          } else {
             return { ...p, x: sourceConsultant.x, y: sourceConsultant.y };
          }
        }
        if (p.id === employeeId) {
          return { ...p, x: targetConsultant.x, y: targetConsultant.y, isOnBoard: true };
        }
        return p;
      });
    } else {
      simulatedEmployees = currentEmployees.map(p => {
        if (p.id === employeeId) {
          return { ...p, x, y, isOnBoard: true };
        }
        return p;
      });
    }

    const activeTalent = simulatedEmployees.filter(p => p.isOnBoard);
    
    if (activeTalent.length > 11) {
      addToast("Max 11 consultants on board", "error");
      return;
    }

    const counts = { DIR: 0, MGR: 0, L_TL: 0, R_TL: 0, L_SPC: 0, R_SPC: 0, SPC: 0, SEN: 0, PM: 0, L_ANL: 0, R_ANL: 0, EXEC: 0, AARCHOC: 0 };
    
    for (const p of activeTalent) {
      const role = getBoardPosition(p.x, p.y);
      counts[role] = (counts[role] || 0) + 1;
    }

    for (const [role, count] of Object.entries(counts)) {
      const error = checkRoleLimit(role, count);
      if (error) {
        addToast(error, "error");
        return;
      }
    }

    const forwards = counts.EXEC + counts.AARCHOC + counts.L_ANL + counts.R_ANL;
    const defenders = counts.MGR + counts.L_TL + counts.R_TL;
    
    if (forwards > 5) { addToast("Max 5 Forwards allowed", "error"); return; }
    if (defenders > 5) { addToast("Max 5 Defenders allowed", "error"); return; }
    
    updateCurrentPlan({ consultants: simulatedEmployees });
  };

  const handleDragStart = (e, employee) => {
    e.dataTransfer.setData("employeeId", employee.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleBoardDrop = (e) => {
    e.preventDefault();
    const employeeId = e.dataTransfer.getData("employeeId");
    if (!employeeId) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    updateConsultantPosition(employeeId, clampedX, clampedY);
  };

  const handleBenchDrop = (e) => {
    e.preventDefault();
    const employeeId = e.dataTransfer.getData("employeeId");
    if (!employeeId) return;

    const currentEmployees = orgCharts[activePlanIndex].consultants || [];
    const updatedEmployees = currentEmployees.map(p => {
      if (p.id === employeeId) {
        return { ...p, isOnBoard: false };
      }
      return p;
    });
    updateCurrentPlan({ consultants: updatedEmployees });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleBoardClick = (e) => {
    if (!selectedConsultantId) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    updateConsultantPosition(selectedConsultantId, clampedX, clampedY);
    setSelectedConsultantId(null);
  };

  const handleConsultantClick = (e, employee) => {
    e.stopPropagation();
    
    if (selectedConsultantId === null) {
      setSelectedConsultantId(employee.id);
    } else if (selectedConsultantId === employee.id) {
      setSelectedConsultantId(null);
    } else {
      const sourceConsultant = orgCharts[activePlanIndex].consultants.find(p => p.id === selectedConsultantId);
      if (!sourceConsultant) return;

      if (employee.isOnBoard) {
         updateConsultantPosition(selectedConsultantId, employee.x, employee.y);
      } else {
         if (sourceConsultant.isOnBoard) {
             const updatedEmployees = orgCharts[activePlanIndex].consultants.map(p => {
                 if (p.id === sourceConsultant.id) return { ...p, isOnBoard: false };
                 if (p.id === employee.id) return { ...p, isOnBoard: true, x: sourceConsultant.x, y: sourceConsultant.y };
                 return p;
             });
             updateCurrentPlan({ consultants: updatedEmployees });
         } else {
             setSelectedConsultantId(employee.id);
             return;
         }
      }
      setSelectedConsultantId(null);
    }
  };

  const validation = useMemo(() => {
    const currentPlan = orgCharts[activePlanIndex];
    const activeTalent = currentPlan.consultants.filter(p => p.isOnBoard);
    const benchTalent = currentPlan.consultants.filter(p => !p.isOnBoard);
    
    const errors = [];
    const warnings = [];

    if (activeTalent.length > 11) errors.push(`Too many consultants on board (${activeTalent.length}/11)`);
    if (activeTalent.length < 11) warnings.push(`Pitch not full (${activeTalent.length}/11)`);
    if (benchTalent.length > 12) errors.push(`Bench limit exceeded (${benchTalent.length}/12)`);

    const counts = {
      DIR: 0, MGR: 0, L_TL: 0, R_TL: 0,
      L_SPC: 0, R_SPC: 0, SPC: 0, SEN: 0, PM: 0,
      L_ANL: 0, R_ANL: 0, EXEC: 0, AARCHOC: 0
    };

    activeTalent.forEach(p => {
      const pos = getBoardPosition(p.x, p.y);
      counts[pos] = (counts[pos] || 0) + 1;
    });

    const forwards = counts.EXEC + counts.AARCHOC + counts.L_ANL + counts.R_ANL;
    const defenders = counts.MGR + counts.L_TL + counts.R_TL;

    if (counts.DIR !== 1) errors.push(`Must have exactly 1 DIR (Found ${counts.DIR})`);
    if (forwards < 1) errors.push("Must have at least 1 Forward");
    if ((counts.SPC + counts.SEN + counts.PM + counts.L_SPC + counts.R_SPC) < 1) errors.push("Must have at least 1 Midfielder");
    
    if (counts.MGR > 3) errors.push(`Max 3 MGRs allowed (Found ${counts.MGR})`);
    if (counts.L_TL > 1) errors.push(`Max 1 L_TL allowed`);
    if (counts.R_TL > 1) errors.push(`Max 1 R_TL allowed`);
    if (counts.L_SPC > 1) errors.push(`Max 1 L_SPC allowed`);
    if (counts.R_SPC > 1) errors.push(`Max 1 R_SPC allowed`);
    if (counts.EXEC > 2) errors.push(`Max 2 EXECs allowed`);
    if (counts.AARCHOC > 2) errors.push(`Max 2 AARCHOCs allowed`);
    if (counts.L_ANL > 1) errors.push(`Max 1 L_ANL allowed`);
    if (counts.R_ANL > 1) errors.push(`Max 1 R_ANL allowed`);
    
    if (forwards > 5) errors.push(`Max 5 Forwards allowed (Found ${forwards})`);
    if (defenders > 5) errors.push(`Max 5 Defenders allowed (Found ${defenders})`);

    const totalEmployees = currentPlan.consultants.length;
    if (totalEmployees < 16) errors.push(`Min 16 consultants required (Found ${totalEmployees})`);
    if (totalEmployees > 23) errors.push(`Max 23 consultants allowed (Found ${totalEmployees})`);

    return { errors, warnings, isValid: errors.length === 0 };
  }, [orgCharts, activePlanIndex]);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center text-black">Loading Profile...</div>;

  const currentPlan = orgCharts[activePlanIndex];
  const activeTalent = currentPlan.consultants.filter(p => p.isOnBoard);
  const benchTalent = currentPlan.consultants.filter(p => !p.isOnBoard);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black  pb-20">
      <header className="bg-white  border-b border-2 border-black sticky top-16 z-30 shadow-none">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-none transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-black text-black tracking-tight flex items-center gap-2">
              <Settings className="text-black" size={20} />
              Org Structure Editor
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 mr-4">
               {validation.isValid ? (
                 <div className="flex items-center gap-1 text-green-500 text-xs font-bold bg-white px-3 py-1 rounded-none border border-green-500/20">
                   <CheckCircle2 size={14} /> Roster Valid
                 </div>
               ) : (
                 <div className="flex items-center gap-1 text-red-500 text-xs font-bold bg-red-500/10 px-3 py-1 rounded-none border border-red-500/20">
                   <AlertTriangle size={14} /> {validation.errors.length} Issues
                 </div>
               )}
            </div>
            <button 
              onClick={handleSave}
              disabled={saving || !validation.isValid}
              className={`flex items-center gap-2 px-6 py-2 rounded-none font-bold transition-all ${saving ? 'bg-white text-black cursor-wait' : !validation.isValid ? 'bg-white text-black cursor-not-allowed' : 'bg-black text-white hover:bg-white hover:text-black border-2 border-black  text-black shadow-none shadow-none/20'}`}
            >
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Structure'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-2 border-black rounded-none overflow-hidden">
            <div className="p-4 bg-white border-b border-2 border-black">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider">Select Structure</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {orgCharts.map((plan, idx) => (
                <button
                  key={plan.id}
                  onClick={() => setActivePlanIndex(idx)}
                  className={`w-full text-left p-4 transition-colors flex justify-between items-center ${activePlanIndex === idx ? 'bg-white text-black border-l-4 border-2 border-black' : 'text-black hover:bg-white hover:text-black'}`}
                >
                  <span className="font-bold">{plan.name}</span>
                  {activePlanIndex === idx && <div className="w-2 h-2 rounded-none bg-black text-white border-2 border-black hover:bg-white hover:text-black"></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-2 border-black rounded-none p-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-black uppercase mb-1 block">Structure Name</label>
              <input 
                type="text" 
                value={currentPlan.name}
                onChange={(e) => updateCurrentPlan({ name: e.target.value })}
                className="w-full bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-black uppercase mb-1 block">Department Name</label>
              <input 
                type="text" 
                value={currentPlan.teamName}
                onChange={(e) => updateCurrentPlan({ teamName: e.target.value })}
                className="w-full bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-white border border-2 border-black rounded-none p-4">
             <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-3">Add Employee</h3>
             <form onSubmit={(e) => {
               e.preventDefault();
               const formData = new FormData(e.target);
               const name = formData.get('name');
               const position = formData.get('position');
               if(name) {
                 addConsultant(name, position);
                 e.target.reset();
               }
             }} className="flex flex-col gap-2">
               <input name="name" type="text" placeholder="Employee Name" className="w-full bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm outline-none focus:border-2 border-black" required />
               <div className="flex gap-2">
                 <select name="position" className="flex-1 bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm outline-none focus:border-2 border-black">
                   {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                 </select>
                 <button type="submit" className="bg-white hover:bg-white text-black p-2 rounded-none border border-2 border-black">
                   <Plus size={18} />
                 </button>
               </div>
             </form>
          </div>

          {(!validation.isValid || validation.warnings.length > 0) && (
            <div className="bg-white border border-2 border-black rounded-none p-4 space-y-2">
              <h3 className="text-xs font-bold text-black uppercase tracking-wider mb-2">Squad Status</h3>
              {validation.errors.map((err, i) => (
                <div key={i} className="text-xs text-red-400 flex items-start gap-2">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {err}
                </div>
              ))}
              {validation.warnings.map((warn, i) => (
                <div key={i} className="text-xs text-black flex items-start gap-2">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {warn}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6">
          <div className="flex justify-center mb-4">
             <div className="bg-white p-1 rounded-none border border-2 border-black flex gap-2">
               {Object.keys(FORMATIONS).map(fmt => (
                 <button
                   key={fmt}
                   onClick={() => applyFormation(fmt)}
                   className={`px-3 py-1 rounded text-xs font-bold transition-colors ${selectedFormation === fmt ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black' : 'text-black hover:text-black'}`}
                 >
                   {fmt}
                 </button>
               ))}
             </div>
          </div>

          <div className="bg-white border border-2 border-black rounded-none p-1 shadow-none relative">
             <div 
               ref={boardRef}
               onDragOver={handleDragOver}
               onDrop={handleBoardDrop}
               onClick={handleBoardClick}
               className="aspect-[3/4] bg-white rounded-none relative overflow-hidden border-4 border-2 border-black shadow-none cursor-crosshair"
               style={{ 
                 backgroundImage: `
                   linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                 `,
                 backgroundSize: '10% 10%'
               }}
             >
                <div className="absolute inset-4 border-2 border-2 border-black rounded-none"></div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
                <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 hidden"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 border-b-2 border-x-2 border-2 border-black rounded-none-lg pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 border-t-2 border-x-2 border-2 border-black rounded-none-lg pointer-events-none"></div>

                {FORMATIONS[selectedFormation].map((slot, i) => (
                  <div 
                    key={`ghost-${i}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-none border-2 border-2 border-black flex items-center justify-center pointer-events-none"
                    style={{ top: `${slot.y}%`, left: `${slot.x}%` }}
                  >
                    <div className="w-1 h-1 bg-white/20 rounded-none"></div>
                  </div>
                ))}

                {activeTalent.map(employee => {
                  const boardPos = getBoardPosition(employee.x, employee.y);
                  const isSelected = selectedConsultantId === employee.id;
                  return (
                    <div
                      key={employee.id}
                      draggable={!isMobile}
                      onDragStart={(e) => handleDragStart(e, employee)}
                      onClick={(e) => handleConsultantClick(e, employee)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-move z-10 hover:z-20 transition-all duration-200 ${isSelected ? 'scale-110 z-30' : ''}`}
                      style={{ top: `${employee.y}%`, left: `${employee.x}%` }}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-none border-2 shadow-none flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform ${boardPos === 'DIR' ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black border-2 border-black' : 'bg-white border-2 border-black group-hover:border-2 border-black'} ${isSelected ? 'ring-4 ring-yellow-400 border-transparent' : ''}`}>
                          <span className="font-black text-[10px] text-black/50 absolute top-1">{employee.position}</span>
                          <User size={24} className="text-black" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
                        </div>
                        <div className="mt-1 flex flex-col items-center">
                          <div className={`text-[9px] font-black px-1.5 rounded-none leading-tight mb-0.5 ${boardPos === 'DIR' ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black' : 'bg-white text-black'}`}>
                            {boardPos}
                          </div>
                          <div className="bg-black/70  text-black text-[10px] font-bold px-2 py-0.5 rounded-none border border-2 border-black whitespace-nowrap shadow-none">
                            {employee.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
          <div className="mt-4 text-center text-black text-xs italic">
            {isMobile ? "Tap employee to select, then tap empty spot to move or another employee to swap." : "Drag consultants to swap positions. Use formation buttons to reset structure."}
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col h-[80vh]">
          <div 
            onDragOver={handleDragOver}
            onDrop={handleBenchDrop}
            className="bg-white  border border-2 border-black rounded-none flex flex-col flex-1 overflow-hidden"
          >
            <div className="p-4 border-b border-2 border-black bg-white flex justify-between items-center">
              <h3 className="font-bold text-black flex items-center gap-2">
                <Shirt size={18} className="text-black" />
                Employee Roster
              </h3>
              <span className="text-xs font-mono bg-white px-2 py-1 rounded text-black">
                {currentPlan.consultants.length} Employees
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {benchTalent.length === 0 && activeTalent.length === 0 && (
                <div className="text-center p-8 text-black text-sm">
                  No consultants registered.<br/>Add consultants to start building.
                </div>
              )}
              
              {benchTalent.length === 0 && activeTalent.length > 0 && (
                <div className="text-center p-4 text-black text-xs border-2 border-dashed border-2 border-black rounded-none m-2">
                  All consultants are on the board.
                </div>
              )}

              {benchTalent.map(employee => {
                const isSelected = selectedConsultantId === employee.id;
                return (
                  <div 
                    key={employee.id}
                    draggable={!isMobile}
                    onDragStart={(e) => handleDragStart(e, employee)}
                    onClick={(e) => handleConsultantClick(e, employee)}
                    className={`bg-white hover:bg-white border p-3 rounded-none flex justify-between items-center cursor-grab active:cursor-grabbing group transition-colors ${isSelected ? 'border-2 border-black ring-1 ring-yellow-500 bg-white' : 'border-2 border-black'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-none flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black' : 'bg-white text-black'}`}>
                        {employee.name.substring(0,2).toUpperCase()}
                      </div>
                      <span className={`font-bold text-sm ${isSelected ? 'text-black' : 'text-black'}`}>{employee.name}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeConsultant(employee.id); }}
                      className="text-black hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 bg-white border-t border-2 border-black text-center">
              <p className="text-[10px] text-black">Drag consultants back here to remove from board.</p>
            </div>
          </div>
        </div>

      </div>
      {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />)}
    </div>
  );
}
