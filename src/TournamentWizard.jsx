import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from './firebase';

export default function TournamentWizard({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("ENGINEERING");
  const [format, setFormat] = useState("LEAGUE");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { setError("Authentication Error: You must be logged in."); return; }
    
    setLoading(true);
    setError(null);
    
    try {
      const inviteCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      
      const payload = {
        name: name,
        hostName: user?.displayName || "Director",
        status: "DRAFT",
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        participants: [user.uid],
        admins: [user.uid],
        inviteCode: inviteCode,
        game: department,
        platform: "HYBRID",
        format: format,
        privacy: "public",
        registrationType: "open",
        settings: {
          pointsForWin: 3,
          pointsForDraw: 1,
          pointsForLoss: 0,
          legs: 1,
          hybridConfig: {
            type: 'SINGLE_GROUP',
            teamsPerGroup: 4,
            qualifiersPerGroup: 2
          }
        }
      };
      
      
      const docRef = await addDoc(collection(db, "projects"), payload);
  
      navigate(`/project/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create initiative. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <div className="font-mono min-h-screen bg-white text-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/')} 
          className="mb-8 flex items-center gap-2 text-black border-none hover:underline bg-transparent px-0 font-bold"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="border-2 border-black bg-white p-8 md:p-12 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
          <h1 className="text-3xl font-black uppercase mb-8">Deploy Initiative</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-500 text-red-800 font-bold text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-bold uppercase mb-2">Initiative Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-black p-3 focus:outline-none uppercase"
                placeholder="e.g. Q4 Sprint"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold uppercase mb-2">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border-2 border-black p-3 bg-white uppercase font-bold appearance-none cursor-pointer"
                >
                  <option value="ENGINEERING">Product Engineering</option>
                  <option value="SALES">Direct Sales</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="OTHER">Cross-Functional</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase mb-2">Framework Structure</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full border-2 border-black p-3 bg-white uppercase font-bold appearance-none cursor-pointer"
                >
                  <option value="LEAGUE">Continuous (Sprint Score)</option>
                  <option value="KNOCKOUT">Elimination (Escalation)</option>
                  <option value="HYBRID">Phased Hybrid</option>
                </select>
              </div>
            </div>

            <div className="pt-8 mt-2 border-t-2 border-black">
              <button
                type="submit"
                disabled={loading || !name}
                className={`w-full py-4 text-center font-bold uppercase transition-colors border-2 border-black flex justify-center items-center gap-2 ${
                  loading || !name 
                    ? 'bg-gray-300 text-gray-600 border-gray-400 cursor-not-allowed' 
                    : 'bg-black text-white hover:bg-white hover:text-black cursor-pointer'
                }`}
              >
                {loading ? 'Initializing Database...' : 'Launch Final Initiative'} 
                {loading ? null : <CheckCircle2 size={20} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
