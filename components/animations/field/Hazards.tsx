import React from 'react';
import { SideHazards } from '../../../types';

interface HazardsProps {
  hazards?: SideHazards;
}

const HAZARDS_STYLES = `
@keyframes float-rock {
  0% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-5px) rotate(180deg); }
  100% { transform: translateY(0) rotate(360deg); }
}

@keyframes spike-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
}

.hazard-container {
  position: absolute;
  inset: -30%;
  pointer-events: none;
  z-index: 15;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

/* Stealth Rock */
.stealth-rock {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #78716c; /* stone-500 */
  border: 1px solid #44403c;
  clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
  opacity: 0.8;
  animation: float-rock 4s infinite linear;
  box-shadow: 2px 2px 2px rgba(0,0,0,0.3);
}

/* Spikes */
.spike-layer {
  position: absolute;
  bottom: 15%;
  width: 0; 
  height: 0; 
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 16px solid #ef4444; /* red-500 */
  filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.5));
  animation: spike-pulse 2s infinite ease-in-out;
}

/* Toxic Spikes */
.toxic-spike-layer {
  position: absolute;
  bottom: 12%;
  width: 0; 
  height: 0; 
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 14px solid #a855f7; /* purple-500 */
  filter: drop-shadow(0 0 3px #581c87);
  animation: spike-pulse 3s infinite ease-in-out reverse;
}

/* Sticky Web */
.sticky-web-net {
  position: absolute;
  bottom: -10%;
  left: 10%;
  right: 10%;
  height: 60%;
  background: 
    radial-gradient(circle, transparent 20%, rgba(255,255,255,0.5) 21%, transparent 22%),
    radial-gradient(circle, transparent 40%, rgba(255,255,255,0.4) 41%, transparent 42%),
    conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.3) 10deg, transparent 20deg, rgba(255,255,255,0.3) 30deg, transparent 40deg, rgba(255,255,255,0.3) 50deg, transparent 60deg, rgba(255,255,255,0.3) 70deg, transparent 80deg, rgba(255,255,255,0.3) 90deg, transparent 100deg, rgba(255,255,255,0.3) 110deg, transparent 120deg, rgba(255,255,255,0.3) 130deg, transparent 140deg, rgba(255,255,255,0.3) 150deg, transparent 160deg, rgba(255,255,255,0.3) 170deg, transparent 180deg, rgba(255,255,255,0.3) 190deg, transparent 200deg, rgba(255,255,255,0.3) 210deg, transparent 220deg, rgba(255,255,255,0.3) 230deg, transparent 240deg, rgba(255,255,255,0.3) 250deg, transparent 260deg, rgba(255,255,255,0.3) 270deg, transparent 280deg, rgba(255,255,255,0.3) 290deg, transparent 300deg, rgba(255,255,255,0.3) 310deg, transparent 320deg, rgba(255,255,255,0.3) 330deg, transparent 340deg, rgba(255,255,255,0.3) 350deg, transparent 360deg);
  transform: scaleY(0.3);
  opacity: 0.7;
}
`;

export const Hazards: React.FC<HazardsProps> = ({ hazards }) => {
  if (!hazards) return null;

  const hasStealthRock = hazards.stealthRock;
  const spikesCount = hazards.spikes;
  const toxicSpikesCount = hazards.toxicSpikes;
  const hasStickyWeb = hazards.stickyWeb;

  if (!hasStealthRock && spikesCount === 0 && toxicSpikesCount === 0 && !hasStickyWeb) return null;

  return (
    <>
      <style>{HAZARDS_STYLES}</style>
      <div className="hazard-container">
        {hasStickyWeb && <div className="sticky-web-net" />}
        
        {hasStealthRock && (
           <>
             <div className="stealth-rock" style={{ bottom: '25%', left: '15%', animationDelay: '0s' }} />
             <div className="stealth-rock" style={{ bottom: '40%', right: '15%', animationDelay: '1.5s' }} />
             <div className="stealth-rock" style={{ bottom: '15%', left: '45%', animationDelay: '2.5s' }} />
           </>
        )}

        {spikesCount > 0 && (
            <>
                <div className="spike-layer" style={{ left: '25%' }} />
                {spikesCount >= 2 && <div className="spike-layer" style={{ right: '25%' }} />}
                {spikesCount >= 3 && <div className="spike-layer" style={{ left: '50%', transform: 'translateX(-50%)' }} />}
            </>
        )}

        {toxicSpikesCount > 0 && (
            <>
                 <div className="toxic-spike-layer" style={{ left: '35%' }} />
                 {toxicSpikesCount >= 2 && <div className="toxic-spike-layer" style={{ right: '35%' }} />}
            </>
        )}
      </div>
    </>
  );
};
