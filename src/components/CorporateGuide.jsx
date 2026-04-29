import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TUTORIAL_STEPS = {
  '/': [
    { text: "Welcome to your centralized E.F.O.O.T.Y. Director Dashboard.", highlight: false },
    { text: "Here you can track active initiatives or deploy a new corporate project. Click 'Create Project' when you're ready to synergize.", highlight: true },
    { text: "If you're just looking around, you can click 'Explore Demo Project' on the login screen to see a pre-populated Synergy Matrix.", highlight: false }
  ],
  '/project/demo-project': [
    { text: "You are currently viewing a READ-ONLY Demo Project. You cannot make permanent edits, but you can explore the pipeline.", highlight: false },
    { text: "This is the Managers Dashboard. Here you track KPIs, Sprints, and active yields for all participants.", highlight: false },
    { text: "Try navigating through the tabs above: View the Sprint Pipeline, check Analytics, or see the Corporate Hierarchy.", highlight: true },
    { text: "Normally, Executive Directors can add resources or trigger Sprints here. Give it a shot, but authorization will be denied.", highlight: false }
  ]
};

export default function CorporateGuide() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  let steps = [];
  if (location.pathname === '/') {
    steps = TUTORIAL_STEPS['/'];
  } else if (location.pathname.startsWith('/project/')) {
    steps = TUTORIAL_STEPS['/project/demo-project']; 
  }

  useEffect(() => {
    if (steps && steps.length > 0) {
      setCurrentStep(0);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [location.pathname]);

  if (!isVisible || !steps || steps.length === 0) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      setIsVisible(false);
    }
  };

  const currentTutorial = steps[currentStep];

  return (
    <div className="fixed bottom-6 right-6 z-[999] w-80 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-sans">
      <div className="bg-yellow-400 border-b-4 border-black p-2 flex justify-between items-center">
        <span className="font-black uppercase tracking-tighter text-sm flex items-center gap-2">
          <span>🤖</span>
        </span>
        <button onClick={() => setIsVisible(false)} className="font-bold hover:text-white hover:bg-black px-1 border-2 border-transparent">✕</button>
      </div>
      <div className="p-4">
        <p className={`text-sm ${currentTutorial.highlight ? 'font-bold bg-yellow-100 p-1' : 'text-gray-700'}`}>
          {currentTutorial.text}
        </p>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs font-mono text-gray-500 font-bold">Step {currentStep + 1}/{steps.length}</span>
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