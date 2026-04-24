import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GoalDistributionChart = ({ squadPlayers, directorId, directorName }) => {
  const data = useMemo(() => {
    if (!squadPlayers || !directorId) return [];
    
    return squadPlayers
      .filter(p => String(p.directorId) === String(directorId) && p.yields > 0)
      .map(p => ({ name: p.name, value: p.yields }))
      .sort((a, b) => b.value - a.value);
  }, [squadPlayers, directorId]);

  const COLORS = ['#eab308', '#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f97316', '#06b6d4', '#ec4899'];

  if (data.length === 0) {
    return (
      <div className="font-mono w-full h-[400px] bg-white  rounded-none border border-2 border-black p-4 shadow-none flex flex-col items-center justify-center text-black">
        <h3 className="font-mono text-lg font-bold text-black mb-2 self-start flex items-center gap-2">
            <span className="font-mono text-2xl">🍰</span> Goal Distribution
        </h3>
        <p className="font-mono italic">No yields generated yet for {directorName}.</p>
      </div>
    );
  }

  return (
    <div className="font-mono w-full h-[400px] bg-white  rounded-none border border-2 border-black p-4 shadow-none">
      <h3 className="font-mono text-lg font-bold text-black mb-4 flex items-center gap-2">
        <span className="font-mono text-2xl">🍰</span> Goal Distribution: <span className="font-mono text-black">{directorName}</span>
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
            itemStyle={{ color: '#f8fafc' }}
            formatter={(value) => [`${value} KPIs`, '']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GoalDistributionChart;
