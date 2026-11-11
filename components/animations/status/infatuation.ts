
import { CSSProperties } from 'react';

export const INFATUATION_CSS = `
@keyframes infatuation-bounce {
    0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 0 rgba(255, 105, 180, 0)); }
    50% { transform: translateY(-12px) scale(1.05); filter: drop-shadow(0 10px 10px rgba(255, 105, 180, 0.6)) brightness(1.1) sepia(0.5) hue-rotate(-50deg); }
}
.anim-status-infatuation { 
    animation: infatuation-bounce 1.0s ease-in-out infinite; 
    z-index: 30; 
}
`;

export const getInfatuationAnimation = () => {
  return { className: 'anim-status-infatuation' };
};
