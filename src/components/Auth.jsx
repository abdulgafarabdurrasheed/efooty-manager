import React, { useState } from 'react';
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { LogOut, User as UserIcon } from 'lucide-react';
import { auth, db, provider } from '../firebase';

export const UserProfile = ({ user }) => {
  return (
    <div className="font-mono flex items-center gap-3 bg-white p-2 pr-4 rounded-none border border-2 border-black">
      {user.photoURL ? (
        <img src={user.photoURL} alt="Profile" className="font-mono w-8 h-8 rounded-none border border-2 border-black" />
      ) : (
        <div className="font-mono w-8 h-8 rounded-none bg-white flex items-center justify-center">
          <UserIcon size={16} className="font-mono text-black" />
        </div>
      )}
      <div className="font-mono flex flex-col">
        <span className="font-mono text-xs font-bold text-black leading-tight">{user.displayName}</span>
        <span className="font-mono text-[10px] text-black">Director</span>
      </div>
      <button 
        onClick={() => signOut(auth)} 
        className="font-mono ml-2 p-1.5 hover:bg-red-500/20 rounded-none text-black hover:text-red-400 transition-colors"
        title="Sign Out"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
};

export const LoginButton = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
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
          myProjects: [],
          managedProjects: [],
          savedTeams: [
            { id: "def_1", name: "Manchester Red", shorthand: "MUN", color: "#EF4444" },
            { id: "def_2", name: "Madrid White", shorthand: "RMA", color: "#F8FAFC" },
            { id: "def_3", name: "London Blue", shorthand: "CHE", color: "#3B82F6" }
          ]
        });
        console.log("New User Profile Created!");
      } else {
        console.log("Welcome back, Director.");
      }

    } catch (error) {
      console.error("Login Failed:", error);
      alert("Login failed. Check console.");
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleLogin}
      disabled={loading}
      className="font-mono bg-white text-black hover:bg-white font-bold py-2 px-6 rounded-none flex items-center gap-2 transition-all shadow-none shadow-none/10"
    >
      {loading ? (
        <span>Signing in...</span>
      ) : (
        <>
          <svg className="font-mono w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </>
      )}
    </button>
  );
};
