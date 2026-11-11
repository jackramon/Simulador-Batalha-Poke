
import { CSSProperties } from 'react';

export const FREEZE_CSS = `
@keyframes freeze-pulse {
    0%, 100% { filter: saturate(0) brightness(1.2) sepia(1) hue-rotate(170deg); }
    50% { filter: saturate(0) brightness(1.5) sepia(1) hue-rotate(170deg) drop-shadow(0 0 5px rgba(0, 255, 255, 0.5)); }
}
.anim-status-freeze { 
    animation: freeze-pulse 2s infinite ease-in-out; 
    transform: none !important; 
    z-index: 30; 
}
`;

export const getFreezeAnimation = () => {
  return { className: 'anim-status-freeze' };
};
