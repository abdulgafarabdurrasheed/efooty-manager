import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TUTORIAL_STEPS = {
  'dashboard': [
    { text: "Welcome to your centralized E.F.O.O.T.Y. Director Dashboard. All executive readouts exist here.", highlight: false },
    { text: "Track active initiatives or deploy a new corporate project. Click 'Create Project' when you're ready to synergize.", highlight: true },
  ],
  'create': [
    { text: "This is the Initiative Creation Wizard. Prepare to launch a new synergy framework.", highlight: false },
    { text: "Set parameters, define your KPI format, and allocate resources efficiently.", highlight: true }
  ],
  'profile': [
    { text: "Your executive matrix awaits. This is your personal clearance data.", highlight: false },
    { text: "Review your system logs and total generated yield metrics across all projects here.", highlight: true }
  ],
  'project': [
    { text: "Welcome to the Project Control Center. This dashboard controls Sprints, Pipelines, and Analytics.", highlight: false },
    { text: "Navigate the tabs to view Resource Rosters, the Sprint Kanban, or Corporate Hierarchies.", highlight: true },
    { text: "Warning: Only authorized executives can enforce sprints or liquidate underperforming resources.", highlight: false }
  ],
  'demo-project': [
    { text: "You are currently viewing a READ-ONLY Demo Project via guest access.", highlight: false },
    { text: "You cannot make permanent edits, but you can explore the pipeline and check our analytics.", highlight: true },
    { text: "Click around! But any attempt to trigger executive actions will prompt a security warning.", highlight: false }
  ]
};

export default function CorporateGuide({ user }) {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tutorialKey, setTutorialKey] = useState(null);

  useEffect(() => {
    if (!user && location.pathname === '/') {
      setIsVisible(false);
      return;
    }

    let key = null;
    if (location.pathname === '/') {
      key = 'dashboard';
    } else if (location.pathname === '/create') {
      key = 'create';
    } else if (location.pathname === '/profile') {
      key = 'profile';
    } else if (location.pathname === '/project/demo-project') {
      key = 'demo-project';
    } else if (location.pathname.startsWith('/project/')) {
      key = 'project';
    }

    if (!key) {
      setIsVisible(false);
      return;
    }

    const userId = user ? user.uid : 'guest';
    const storageKey = `efooty_tutorial_${userId}_${key}`;
    const hasSeen = localStorage.getItem(storageKey);

    if (!hasSeen) {
      setTutorialKey(key);
      setCurrentStep(0);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [location.pathname, user]);

  if (!tutorialKey || !TUTORIAL_STEPS[tutorialKey]) return null;

  if (!isVisible) {
    return (
      <button
        onClick={() => {
          const key = tutorialKey || (() => {
            if (location.pathname === '/') return 'dashboard';
            if (location.pathname === '/create') return 'create';
            if (location.pathname === '/profile') return 'profile';
            if (location.pathname === '/project/demo-project') return 'demo-project';
            if (location.pathname.startsWith('/project/')) return 'project';
            return null;
          })();
          if (key && TUTORIAL_STEPS[key]) {
            setTutorialKey(key);
            setCurrentStep(0);
            setIsVisible(true);
          }
        }}
        className="fixed bottom-6 right-6 z-[999] w-12 h-12 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-xl hover:bg-black hover:text-yellow-400 transition-colors cursor-pointer"
        title="Reopen Synergy Guide"
      >
        ?
      </button>
    );
  };

  const steps = TUTORIAL_STEPS[tutorialKey];
  const currentTutorial = steps[currentStep];

  const markComplete = () => {
    const userId = user ? user.uid : 'guest';
    localStorage.setItem(`efooty_tutorial_${userId}_${tutorialKey}`, 'true');
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      markComplete();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] w-80 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-sans">
      <div className="bg-yellow-400 border-b-4 border-black p-2 flex justify-between items-center">
        <span className="font-black uppercase tracking-tighter text-sm flex items-center gap-2">
          <span>🤖</span> Synergy Guide
        </span>
        <button 
          onClick={markComplete} 
          className="font-bold hover:text-white hover:bg-black px-1 border-2 border-transparent transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="p-4">
        <p className={`text-sm ${currentTutorial.highlight ? 'font-bold bg-yellow-100 p-1' : 'text-gray-700'}`}>
          {currentTutorial.text}
        </p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs font-mono text-gray-500 font-bold">
            Step {currentStep + 1}/{steps.length}
          </span>
          <button 
            onClick={handleNext}
            className="bg-black text-white text-xs font-black uppercase px-4 py-2 border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all"
          >
            {currentStep < steps.length - 1 ? 'Acknowledge' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
}
