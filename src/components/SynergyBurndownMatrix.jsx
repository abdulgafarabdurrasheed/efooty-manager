import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from 'lucide-react';

export default function SynergyBurndownMatrix({ matches }) {
    const timelineData = useMemo(() => {
        if (!matches || matches.length === 0) return [];

        const sprints = {};
        matches.forEach(m => {
            if (!m.round) return;
            if (!sprints[m.round]) {
                sprints[m.round] = { name: `Sprint ${ m.round }`, totalYield: 0, target: 5};
            }
            sprints[m.round].totalYield += (m.hScore || 0) + (m.aScore || 0);
        });

        return Object.values(sprints).sort((a,b) => parseInt(a.name.split(' ')[1]) - parseInt(b.name.split(' ')[1]));
    }, [matches]);

    if (timelineData.length === 0) {
        return (
            <div className="font-mono bg-white border border-2 border-black p-8 text-center text-gray-500 italic font-bold">
              Insufficient data to plot Synergy Matrix. Log sprints to calibrate.
            </div>
        )
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black border-2 border-white text-white p-3 shadow-[4px_4px_0px_#000]">
                    <p className="font-black uppercase mb-1">{label}</p>
                    <p className="text-green-400 font-bold">Yield Vol: {payload[0].value}</p>
                    <p className="text-blue-400 font-bold opacity-75">Tgt Vol: {payload[1].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="font-mono bg-white border border-2 border-black overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)] mb-8">
            <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
                <h2 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                    <TrendingUp className="text-green-400" /> Synergy Delivery Matrix
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-white text-black px-2 py-0.5">Real-Time</span>
            </div>
            
            <div className="bg-[#f8f9fa] p-4 pt-8 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        tick={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12 }} 
                        axisLine={{ stroke: 'black', strokeWidth: 2 }}
                        tickLine={{ stroke: 'black', strokeWidth: 2 }}
                    />
                    <YAxis 
                        tick={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12 }}
                        axisLine={{ stroke: 'black', strokeWidth: 2 }}
                        tickLine={{ stroke: 'black', strokeWidth: 2 }}
                        domain={[0, 'dataMax + 2']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="square" wrapperStyle={{ fontFamily: 'monospace', fontWeight: 'bold', paddingTop: '20px' }} />
                    
                    <Line 
                        type="stepAfter" 
                        dataKey="totalYield" 
                        name="Actual Yield Delivered" 
                        stroke="black" 
                        strokeWidth={4} 
                        dot={{ fill: 'white', stroke: 'black', strokeWidth: 2, r: 6 }} 
                        activeDot={{ r: 8, fill: 'black', stroke: '#4ade80' }}
                        isAnimationActive={true}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="target" 
                        name="Base Target Trajectory" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        strokeDasharray="5 5" 
                        dot={false} 
                    />
                </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}