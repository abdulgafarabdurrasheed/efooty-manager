import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { getDesktopSteps, getMobileSteps } from '../config/tourSteps';

const OnboardingTour = ({ isAdmin }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('E.F.O.O.T.Y_tour_completed');
    
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setSteps(isMobile ? getMobileSteps(isAdmin) : getDesktopSteps(isAdmin));
        setRun(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAdmin, isMobile]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem('E.F.O.O.T.Y_tour_completed', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#0f172a',
          backgroundColor: '#0f172a',
          overlayColor: 'rgba(0, 0, 0, 0.85)',
          primaryColor: '#eab308',
          textColor: '#fff',
          zIndex: 1000,
        },
        buttonNext: {
          backgroundColor: '#eab308',
          color: '#000',
          fontWeight: 'bold',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(234, 179, 8, 0.4)',
        },
        buttonBack: {
          color: '#94a3b8',
        },
        tooltipContainer: {
          textAlign: 'left',
          fontSize: '14px',
          border: '1px solid #334155',
          borderRadius: '12px',
        }
      }}
      locale={{
        last: 'Finish',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default OnboardingTour;
