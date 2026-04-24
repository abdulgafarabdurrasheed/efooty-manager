import React, { useState } from 'react';
import { Briefcase, Activity, BarChart3, Zap, ArrowRight, X } from 'lucide-react';

const DEMO_STEPS = [
  {
    title: "INITIATIVE DEPLOYMENT",
    icon: <Briefcase size={40} className="text-black" />,
    description: "Welcome to E.F.O.O.T.Y. Manager. The first step is deploying cross-functional Initiatives (formerly Tournaments).",
    why: "WHY IT'S HERE: To create isolated, trackable zones where different departments can run their own sprints without contaminating global metrics."
  },
  {
    title: "SPRINT TRACKING",
    icon: <Activity size={40} className="text-black" />,
    description: "Log your weekly 'Sprint Reviews' between Pods and individual contributors.",
    why: "WHY IT'S HERE: Consistent sprint logging generates real-time velocity data. If you don't track the sprint, you can't measure the yield."
  },
  {
    title: "KPIs & OUTCOMES",
    icon: <BarChart3 size={40} className="text-black" />,
    description: "Every sprint generates Yields, Synergies, and Zero-Defect metrics.",
    why: "WHY IT'S HERE: To transition away from 'vibes-based' management. Hard data on yields automatically generates an objective Leaderboard."
  },
  {
    title: "THE AI ORACLE",
    icon: <Zap size={40} className="text-black" />,
    description: "Our Gemini-powered Executive Agile Coach automatically reads your sprint data.",
    why: "WHY IT'S HERE: To detect bottlenecks before they become blockers. The Oracle identifies which Pods are underperforming and prescribes actionable pivots."
  }
];

export default function InteractiveDemo({ onComplete }) {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < DEMO_STEPS.length - 1) setStep(step + 1);
    else onComplete();
  };

  return (
    <div className="font-mono absolute inset-0 z-50 bg-[#000] text-white flex flex-col items-center justify-center p-6">      <button 
        onClick={onComplete}
        className="absolute top-6 right-6 text-white hover:text-red-400 flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
      >
        Skip Tutorial <X size={16} />
      </button>

      <div className="bg-white border-4 border-white w-full max-w-2xl p-8 md:p-12 shadow-[12px_12px_0px_rgba(255,255,255,0.2)] flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
        
        <div className="mb-8 p-4 border-2 border-black inline-block bg-gray-100">
          {DEMO_STEPS[step].icon}
        </div>

        <h2 className="text-3xl font-black text-black tracking-tight uppercase mb-4">
          {DEMO_STEPS[step].title}
        </h2>
        
        <p className="text-lg text-black mb-8 leading-relaxed font-bold">
          {DEMO_STEPS[step].description}
        </p>

        <div className="bg-black text-white p-6 w-full text-left border-l-8 border-blue-500 mb-10">
          <p className="font-bold text-sm tracking-wide leading-relaxed">
            {DEMO_STEPS[step].why}
          </p>
        </div>

        <div className="w-full flex items-center justify-between mt-auto">
          <div className="flex gap-2">
            {DEMO_STEPS.map((_, i) => (
              <div key={i} className={`h-3 w-8 border-2 border-black ${i === step ? 'bg-black' : 'bg-transparent'}`} />
            ))}
          </div>

          <button 
            onClick={nextStep}
            className="flex items-center gap-2 bg-black text-white px-6 py-3 font-bold uppercase hover:bg-blue-600 transition-colors"
          >
            {step === DEMO_STEPS.length - 1 ? 'Begin Onboarding' : 'Next Insight'}
            <ArrowRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}