import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function StandupFeed({ projectId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [type, setType] = useState("WIN");

  useEffect(() => {
    if (!projectId) return;
    
    const q = query(
      collection(db, `projects/${projectId}/standups`),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsub();
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    await addDoc(collection(db, `projects/${projectId}/standups`), {
      text: newMessage,
      type: type,
      author: user.displayName || 'Unknown Resource',
      authorId: user.uid,
      createdAt: serverTimestamp()
    });

    setNewMessage("");
  };

  return (
    <div className="font-mono bg-white border-4 border-black p-6 flex flex-col h-[500px]">
      <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-4">
        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
          <MessageSquare /> Async Standup
        </h3>
        <span className="text-xs bg-black text-white px-2 py-1 font-bold uppercase animate-pulse">Live</span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-4 pr-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm font-bold uppercase mt-10">No standup logs yet.</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`p-3 border-2 border-black border-l-8 ${msg.type === 'BLOCKER' ? 'border-l-red-500 bg-red-50' : 'border-l-green-500 bg-green-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                {msg.type === 'BLOCKER' ? <AlertCircle size={14} className="text-red-600" /> : <CheckCircle2 size={14} className="text-green-600" />}
                <span className="text-xs font-black uppercase tracking-widest">{msg.author}</span>
              </div>
              <p className="text-sm font-bold text-black">{msg.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t-4 border-black pt-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button type="button" onClick={() => setType('WIN')} className={`flex-1 text-xs font-bold uppercase py-1 border-2 border-black ${type === 'WIN' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}>Yield / Win</button>
            <button type="button" onClick={() => setType('BLOCKER')} className={`flex-1 text-xs font-bold uppercase py-1 border-2 border-black ${type === 'BLOCKER' ? 'bg-red-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}>Blocker</button>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              maxLength={140}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Log status (max 140 chars)..."
              className="flex-1 border-2 border-black p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-black text-white px-3 border-2 border-black hover:bg-blue-600 transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}