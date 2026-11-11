import React from 'react';
import { SideHazards } from '../../../types';

interface ScreensProps {
  hazards?: SideHazards;
}

const SCREENS_STYLES = `
@keyframes screen-pulse {
  0% { opacity: 0.3; box-shadow: inset 0 0 10px currentColor; }
  50% { opacity: 0.6; box-shadow: inset 0 0 20px currentColor; }
  100% { opacity: 0.3; box-shadow: inset 0 0 10px currentColor; }
}

@keyframes screen-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.screen-wall {
  position: absolute;
  inset: -10%;
  border-radius: 20%;
  border: 2px solid currentColor;
  animation: screen-pulse 3s infinite ease-in-out;
  pointer-events: none;
  z-index: 20;
  mix-blend-mode: screen;
}

.screen-reflect {
  color: #f472b6; /* Pink-400 */
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.1) 0%, rgba(244, 114, 182, 0) 50%, rgba(244, 114, 182, 0.1) 100%);
}

.screen-light-screen {
  color: #facc15; /* Yellow-400 */
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, rgba(250, 204, 21, 0) 50%, rgba(250, 204, 21, 0.1) 100%);
  transform: scale(1.1);
}

.screen-aurora-veil {
  color: #22d3ee; /* Cyan-400 */
  border-width: 3px;
  border-style: double;
  background: linear-gradient(45deg, rgba(34, 211, 238, 0.1), rgba(168, 85, 247, 0.1), rgba(34, 211, 238, 0.1));
  background-size: 200% 200%;
  animation: screen-pulse 3s infinite ease-in-out, screen-shimmer 5s infinite linear;
}

.screen-honeycomb {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(currentColor 1px, transparent 1px);
  background-size: 10px 10px;
  opacity: 0.3;
  mask-image: radial-gradient(circle, black 40%, transparent 80%);
}
`;

export const Screens: React.FC<ScreensProps> = ({ hazards }) => {
  if (!hazards) return null;

  const hasReflect = hazards.reflect > 0;
  const hasLightScreen = hazards.lightScreen > 0;
  const hasAuroraVeil = hazards.auroraVeil > 0;

  if (!hasReflect && !hasLightScreen && !hasAuroraVeil) return null;

  return (
    <>
      <style>{SCREENS_STYLES}</style>
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        {hasReflect && (
          <div className="screen-wall screen-reflect">
            <div className="screen-honeycomb" />
          </div>
        )}
        {hasLightScreen && (
          <div className="screen-wall screen-light-screen">
            <div className="screen-honeycomb" />
          </div>
        )}
        {hasAuroraVeil && (
          <div className="screen-wall screen-aurora-veil">
            <div className="screen-honeycomb" />
          </div>
        )}
      </div>
    </>
  );
};
