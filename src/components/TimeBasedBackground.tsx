'use client';

import { useEffect, useState } from 'react';

export default function TimeBasedBackground() {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getTimeBasedBackground = () => {
    if (currentHour >= 6 && currentHour < 10) {
      // 朝 6:00-10:00
      return {
        background: 'linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 50%, #74b9ff 100%)',
        animation: 'morning-glow 20s ease-in-out infinite alternate'
      };
    } else if (currentHour >= 10 && currentHour < 18) {
      // 昼 10:00-18:00
      return {
        background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)',
        animation: 'day-sky 25s ease-in-out infinite alternate'
      };
    } else if (currentHour >= 18 && currentHour < 21) {
      // 夕方 18:00-21:00
      return {
        background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 50%, #74b9ff 100%)',
        animation: 'sunset-glow 15s ease-in-out infinite alternate'
      };
    } else {
      // 夜 21:00-6:00
      return {
        background: 'linear-gradient(135deg, #2d3436 0%, #636e72 30%, #74b9ff 100%)',
        animation: 'night-twinkle 3s ease-in-out infinite alternate'
      };
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 -z-10"
        style={getTimeBasedBackground()}
      />
      <div className="fixed inset-0 bg-white/5 -z-5" />
    </>
  );
}

