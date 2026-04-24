import React, { useState, useEffect } from 'react';
import { User, Trash2 } from 'lucide-react';

const HIERARCHIES = {
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

const getPitchPosition = (x, y) => {
  if (y > 80 && x > 35 && x < 65) return "DIR";
  if (y > 60) {
    if (x < 25) return "L-TL";
    if (x > 75) return "R-TL";
    return "MGR";
  }
  if (y > 35) {
    if (x < 20) return "L-SPC";
    if (x > 80) return "R-SPC";
    if (y > 50) return "SEN";
    if (y < 45) return "PM";
    return "SPC";
  }
  if (y <= 35) {
    if (x < 30) return "L-ANL";
    if (x > 70) return "R-ANL";
    if (y > 20) return "AAARCHOCOC";
    return "EXEC";
  }
  return "SPC";
};

const StructureBuilder = ({ initialEmployees = [], isReadOnly = false }) => {
  const [formation, setHierarchy] = useState("4-4-2");
  const [employees, setEmployees] = useState([]);
  
  useEffect(() => {
    if (initialEmployees && initialEmployees.length > 0) {
      const timer = setTimeout(() => {
        setEmployees(initialEmployees);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialEmployees]);

  const boardEmployees = employees.filter(p => p.isOnPitch);
  const benchEmployees = employees.filter(p => !p.isOnPitch);

  return (
    <div className="font-mono flex flex-col lg:flex-row gap-6 select-none h-full">
      
      <div className="font-mono order-1 lg:order-2 flex-1 relative">
        {!isReadOnly && (
          <div className="font-mono flex justify-center mb-4">
             <div className="font-mono bg-white p-1 rounded-none border border-2 border-black flex gap-2">
               {Object.keys(HIERARCHIES).map(fmt => (
                 <button
                   key={fmt}
                   onClick={() => setHierarchy(fmt)}
                   className={`px-3 py-1 rounded text-xs font-bold transition-colors ${formation === fmt ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black' : 'text-black hover:text-black'}`}
                 >
                   {fmt}
                 </button>
               ))}
             </div>
          </div>
        )}

        <div className="font-mono aspect-[3/4] bg-white rounded-none relative overflow-hidden border-4 border-2 border-black shadow-none"
             style={{ 
               backgroundImage: `
                 linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
               `,
               backgroundSize: '10% 10%'
             }}
        >
          <div className="font-mono absolute inset-4 border-2 border-2 border-black rounded-none"></div>
          <div className="font-mono absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
          <div className="font-mono absolute top-1/2 left-1/2 w-32 h-32 border-2 border-2 border-black rounded-none -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="font-mono absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 border-b-2 border-x-2 border-2 border-black rounded-none-lg pointer-events-none"></div>
          <div className="font-mono absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 border-t-2 border-x-2 border-2 border-black rounded-none-lg pointer-events-none"></div>

          {HIERARCHIES[formation].map((slot, i) => (
            <div 
              key={`ghost-${i}`}
              className="font-mono absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-none border-2 border-2 border-black flex items-center justify-center pointer-events-none"
              style={{ top: `${slot.y}%`, left: `${slot.x}%` }}
            >
              <div className="font-mono w-1 h-1 bg-white/20 rounded-none"></div>
            </div>
          ))}

          {boardEmployees.map(employee => {
            const boardPos = getPitchPosition(employee.x, employee.y);
            return (
              <div
                key={employee.id}
                className="font-mono absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
                style={{ top: `${employee.y}%`, left: `${employee.x}%` }}
              >
                <div className="font-mono flex flex-col items-center">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-none border-2 shadow-none flex items-center justify-center relative overflow-hidden ${boardPos === 'DIR' ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black border-2 border-black' : 'bg-white border-2 border-black'}`}>
                    <span className="font-mono font-black text-[8px] md:text-[10px] text-black/50 absolute top-1">{employee.position}</span>
                    <User size={20} className="font-mono text-black md:w-6 md:h-6" />
                    <div className="font-mono absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
                  </div>
                  <div className="font-mono mt-1 flex flex-col items-center">
                    <div className={`text-[8px] md:text-[9px] font-black px-1.5 rounded-none leading-tight mb-0.5 ${boardPos === 'DIR' ? 'bg-black text-white border-2 border-black hover:bg-white hover:text-black' : 'bg-white text-black'}`}>
                      {boardPos}
                    </div>
                    <div className="font-mono bg-black/70  text-black text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-none border border-2 border-black whitespace-nowrap shadow-none max-w-[80px] truncate">
                      {employee.name}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="font-mono order-2 lg:order-1 w-full lg:w-1/3 flex flex-col h-[40vh] lg:h-auto bg-white rounded-none border border-2 border-black overflow-hidden">
        <div className="font-mono p-4 border-b border-2 border-black bg-white flex justify-between items-center">
          <h3 className="font-mono text-black font-bold flex items-center gap-2">
            <User size={16} className="font-mono text-black" /> 
            Bench ({benchEmployees.length})
          </h3>
        </div>

        <div className="font-mono flex-1 overflow-y-auto p-2 space-y-2">
          {benchEmployees.length === 0 && (
            <div className="font-mono text-center p-8 text-black text-xs italic">Bench is empty</div>
          )}
          {benchEmployees.map(employee => (
            <div 
              key={employee.id}
              className="font-mono bg-white border border-2 border-black p-3 rounded-none flex items-center gap-3"
            >
              <div className="font-mono w-8 h-8 rounded-none bg-white flex items-center justify-center font-bold text-xs text-black">
                {employee.name.substring(0,2).toUpperCase()}
              </div>
              <div>
                <div className="font-mono text-sm font-bold text-black">{employee.name}</div>
                <div className="font-mono text-[10px] text-black">{employee.position}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default StructureBuilder;
