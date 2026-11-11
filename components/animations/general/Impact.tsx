import React, { useState } from 'react';

const IMPACT_STYLES = `
@keyframes impact-pop {
  0% { transform: scale(0) rotate(var(--rotation)); opacity: 1; }
  40% { transform: scale(1.5) rotate(var(--rotation)); opacity: 1; }
  100% { transform: scale(1.2) rotate(var(--rotation)); opacity: 0; }
}

.impact-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin-top: -60px;
  margin-left: -60px;
  background: radial-gradient(circle, #ffffff 30%, #facc15 60%, #ef4444 100%);
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 
    50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
  );
  z-index: 60;
  pointer-events: none;
  animation: impact-pop 0.4s ease-out forwards;
  filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
}
`;

export const Impact: React.FC = () => {
  // Randomize rotation for variety on each hit
  const [rotation] = useState(() => 0); // Removed Math.random() to prevent PRNG desync

  return (
    <>
      <style>{IMPACT_STYLES}</style>
      <div 
        className="impact-burst" 
        style={{ '--rotation': `${rotation}deg` } as React.CSSProperties} 
      />
    </>
  );
};
