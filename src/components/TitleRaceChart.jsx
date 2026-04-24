import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateRaceData } from '../utils/analytics';
import { ChevronLeft, ChevronRight, PlayCircle, History } from 'lucide-react';

const TitleRaceChart = ({ matches, directors }) => {
  const raceData = useMemo(() => generateRaceData(matches, directors), [matches, directors]);
  const [viewMode, setViewMode] = useState('full');
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  useEffect(() => {
    if (raceData && raceData.length > 0) {
        const timer = setTimeout(() => {
            setCurrentWeekIndex(raceData.length - 1);
        }, 0);
        return () => clearTimeout(timer);
    }
  }, [raceData]);

  const displayedData = useMemo(() => {
    if (!raceData || raceData.length === 0) return [];
    if (viewMode === 'full') return raceData;
    

    return raceData.slice(0, currentWeekIndex + 1);
  }, [raceData, viewMode, currentWeekIndex]);
  
  const colors = [
    '#eab308',
    '#3b82f6',
    '#ef4444',
    '#22c55e',
    '#a855f7',
    '#f97316',
    '#06b6d4',
    '#ec4899',
    '#6366f1',
    '#14b8a6',
  ];

  if (!raceData || raceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-none border border-2 border-black">
        <p className="text-black italic">Not enough match data to generate title race.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white  rounded-none border border-2 border-black p-4 shadow-none">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-black flex items-center gap-2">
            <span className="text-2xl">📈</span> Title Race
        </h3>
        
        <div className="flex bg-white rounded-none p-1 border border-2 border-black">
            <button 
                onClick={() => setViewMode('full')}
                className={`px-3 py-1.5 rounded-none text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'full' ? 'bg-white text-black shadow' : 'text-black hover:text-black'}`}
            >
                <History size={14} /> Full History
            </button>
            <button 
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-none text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'weekly' ? 'bg-white text-black shadow' : 'text-black hover:text-black'}`}
            >
                <PlayCircle size={14} /> Replay
            </button>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
            data={displayedData}
            margin={{
                top: 5,
                right: 30,
                left: 0,
                bottom: 5,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
                dataKey="week" 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={{ stroke: '#334155' }}
            />
            <YAxis 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickLine={{ stroke: '#334155' }}
                domain={[0, 'auto']}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {directors.map((mgr, index) => (
                <Line
                key={mgr.id}
                type="monotone"
                dataKey={mgr.name}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={true}
                animationDuration={1000}
                />
            ))}
            </LineChart>
        </ResponsiveContainer>
      </div>

      {viewMode === 'weekly' && (
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-2 border-black animate-in slide-in-from-top-2">
            <button 
                onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
                disabled={currentWeekIndex === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-none bg-white hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black hover:text-black transition-colors font-bold text-sm"
            >
                <ChevronLeft size={16} /> Prev Week
            </button>
            
            <div className="text-sm font-mono text-black">
                {displayedData[displayedData.length - 1]?.week || "Start"}
            </div>

            <button 
                onClick={() => setCurrentWeekIndex(prev => Math.min(raceData.length - 1, prev + 1))}
                disabled={currentWeekIndex === raceData.length - 1}
                className="flex items-center gap-2 px-4 py-2 rounded-none bg-white hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-black hover:text-black transition-colors font-bold text-sm"
            >
                Next Week <ChevronRight size={16} />
            </button>
        </div>
      )}
    </div>
  );
};

export default TitleRaceChart;
