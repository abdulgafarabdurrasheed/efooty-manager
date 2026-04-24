import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User as UserIcon, Settings, LogOut, X, Save, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, provider } from '../firebase';

export const ProfileSettingsModal = ({ user, onClose }) => {
  const [teamA, setPodA] = useState("");
  const [teamB, setPodB] = useState("");
  const [teamC, setPodC] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.defaultPods) {
          setPodA(data.defaultPods[0] || "");
          setPodB(data.defaultPods[1] || "");
          setPodC(data.defaultPods[2] || "");
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        defaultPods: [teamA, teamB, teamC]
      });
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    }
    setLoading(false);
  };

  return (
    <div className="font-mono fixed inset-0 z-50 flex items-center justify-center bg-black/80  p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="font-mono bg-white border border-2 border-black w-full max-w-md rounded-none overflow-hidden shadow-none" onClick={e => e.stopPropagation()}>
        <div className="font-mono bg-white p-6 border-b border-2 border-black flex justify-between items-center">
          <h2 className="font-mono text-lg font-bold text-black flex items-center gap-2">
            <Settings size={20} className="font-mono text-black" />
            Profile Settings
          </h2>
          <button onClick={onClose} className="font-mono text-black hover:text-black"><X size={20} /></button>
        </div>
        <div className="font-mono p-6 space-y-4">
          <h3 className="font-mono text-sm font-bold text-black uppercase tracking-wider">My Default Pods</h3>
          <p className="font-mono text-xs text-black">Set your 3 favorite teams for quick selection.</p>
          
          <div className="font-mono space-y-3">
            <div>
              <label className="font-mono text-xs text-black mb-1 block">Pod 1</label>
              <input 
                type="text" 
                value={teamA} 
                onChange={(e) => setPodA(e.target.value)}
                className="font-mono w-full bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                placeholder="e.g. Manchester City"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-black mb-1 block">Pod 2</label>
              <input 
                type="text" 
                value={teamB} 
                onChange={(e) => setPodB(e.target.value)}
                className="font-mono w-full bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                placeholder="e.g. Real Madrid"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-black mb-1 block">Pod 3</label>
              <input 
                type="text" 
                value={teamC} 
                onChange={(e) => setPodC(e.target.value)}
                className="font-mono w-full bg-white border border-2 border-black rounded-none px-3 py-2 text-black text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                placeholder="e.g. Arsenal"
              />
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={loading}
            className="font-mono w-full mt-4 bg-black text-white border-2 border-black hover:bg-white hover:text-black font-bold py-2 px-4 rounded-none transition-colors flex items-center justify-center gap-2"
          >
            {loading ? "Saving..." : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export const UserProfile = ({ user, onOpenProfile }) => {
  return (
    <div className="font-mono flex items-center gap-3 bg-white p-2 pr-2 rounded-none border border-2 border-black">
      <div className="font-mono pl-2 flex items-center gap-3">
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="font-mono w-8 h-8 rounded-none border border-2 border-black" />
        ) : (
          <div className="font-mono w-8 h-8 rounded-none bg-white flex items-center justify-center">
            <UserIcon size={16} className="font-mono text-black" />
          </div>
        )}
        <div className="font-mono flex flex-col text-left mr-2">
          <span className="font-mono text-xs font-bold text-black leading-tight">{user.displayName}</span>
          <span className="font-mono text-[10px] text-black">Director</span>
        </div>
      </div>
      
      <div className="font-mono h-6 w-px bg-white mx-1"></div>

      <button 
        onClick={onOpenProfile}
        className="font-mono p-2  rounded-none text-black hover:text-black transition-colors"
        title="Profile Settings"
      >
        <Settings size={16} />
      </button>

      <button 
        onClick={() => signOut(auth)} 
        className="font-mono p-2 /20 rounded-none text-black hover:text-red-400 transition-colors"
        title="Sign Out"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
};

const AuthModal = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!name.trim()) throw new Error("Please enter a display name.");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        await setDoc(doc(db, "users", user.uid), {
          displayName: name,
          email: user.email,
          createdAt: new Date(),
          activeFormation: "4-4-2",
          startingXI: {},
          defaultPods: []
        });
      }
      onClose();
    } catch (err) {
      console.error("Auth Error:", err);
      let msg = "Authentication failed.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName,
          email: user.email,
          avatar: user.photoURL,
          createdAt: new Date(),
          activeFormation: "4-4-2",
          startingXI: {} 
        });
      }
      onClose();
    } catch (err) {
        console.error("Google Auth Error:", err);
        setError("Google Sign-In failed.");
    } finally {
        setLoading(false);
    }
  };

  return createPortal(
    <div className="font-mono fixed inset-0 z-50 flex items-center justify-center bg-black/80  p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="font-mono bg-white border border-2 border-black w-full max-w-2xl rounded-none overflow-hidden shadow-none" onClick={e => e.stopPropagation()}>
        
        <div className="font-mono bg-white p-6 border-b border-2 border-black text-center">
          <h2 className="font-mono text-2xl font-black text-black tracking-tight mb-1">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="font-mono text-black text-sm">
            {isLogin ? "Enter your tactics board." : "Start your directorial career."}
          </p>
        </div>

        <div className="font-mono p-6 space-y-6">
          {error && (
            <div className="font-mono bg-red-500/10 border border-red-500/20 rounded-none p-3 flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle size={18} />
                {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="font-mono space-y-4">
            {!isLogin && (
              <div className="font-mono space-y-1">
                <label className="font-mono text-xs font-bold text-black uppercase ml-1">Director Name</label>
                <div className="font-mono relative">
                    <UserIcon size={18} className="font-mono absolute left-3 top-3 text-black" />
                    <input 
                        type="text" 
                        required 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="font-mono w-full bg-white border border-2 border-black rounded-none py-2.5 pl-10 pr-4 text-black placeholder:text-black focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                        placeholder="e.g. Pep Guardiola"
                    />
                </div>
              </div>
            )}

            <div className="font-mono space-y-1">
              <label className="font-mono text-xs font-bold text-black uppercase ml-1">Email Address</label>
              <div className="font-mono relative">
                <Mail size={18} className="font-mono absolute left-3 top-3 text-black" />
                <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="font-mono w-full bg-white border border-2 border-black rounded-none py-2.5 pl-10 pr-4 text-black placeholder:text-black focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                    placeholder="director@example.com"
                />
              </div>
            </div>

            <div className="font-mono space-y-1">
              <label className="font-mono text-xs font-bold text-black uppercase ml-1">Password</label>
              <div className="font-mono relative">
                <Lock size={18} className="font-mono absolute left-3 top-3 text-black" />
                <input 
                    type="password" 
                    required 
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="font-mono w-full bg-white border border-2 border-black rounded-none py-2.5 pl-10 pr-4 text-black placeholder:text-black focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                    placeholder="••••••••"
                />
              </div>
            </div>
            
            <button 
                type="submit" 
                disabled={loading}
                className="font-mono w-full bg-black text-white border-2 border-black hover:bg-white hover:text-black font-black py-3 rounded-none shadow-none shadow-none/20 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="font-mono animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
            </button>
          </form>

          <div className="font-mono relative flex py-2 items-center">
            <div className="font-mono flex-grow border-t border-2 border-black"></div>
            <span className="font-mono flex-shrink mx-4 text-black text-xs uppercase font-bold">Or continue with</span>
            <div className="font-mono flex-grow border-t border-2 border-black"></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            type="button"
            className="font-mono w-full bg-white  text-black font-bold py-3 rounded-none transition-colors flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="font-mono w-5 h-5" />
            Google
          </button>

          <div className="font-mono text-center pt-2">
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="font-mono text-black hover:text-black text-sm transition-colors"
            >
                {isLogin ? (
                    <>New to E.F.O.O.T.Y? <span className="font-mono text-black font-bold underline decoration-dotted">Create an account</span></>
                ) : (
                    <>Already have an account? <span className="font-mono text-black font-bold underline decoration-dotted">Sign In</span></>
                )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const LoginButton = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="font-mono bg-black text-white border-2 border-black hover:bg-white hover:text-black font-black py-2 px-6 rounded-none flex items-center gap-2 transition-all shadow-none shadow-none/20 hover:scale-105"
      >
        Sign In / Join
        <ArrowRight size={16} />
      </button>

      <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
