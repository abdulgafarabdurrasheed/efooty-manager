import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(0), 50);
    const closeTimer = setTimeout(onClose, 3000);
    return () => { clearTimeout(timer); clearTimeout(closeTimer); };
  }, [onClose]);

  const isError = type === 'error';
  
  return (
    <div className="font-mono fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
      <div className={`relative overflow-hidden flex items-center gap-3 px-6 py-3 rounded-none shadow-none border pointer-events-auto ${
        isError 
          ? 'bg-black border-red-500/50 text-red-500' 
          : 'bg-white border-green-500/50 text-green-700'
      }`}>
        {isError ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
        <span className="font-mono font-bold text-sm">{message}</span>
        <div 
          className={`absolute bottom-0 left-0 h-1 ${isError ? 'bg-red-600' : 'bg-green-500'} transition-all ease-linear duration-[3000ms]`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Toast;
