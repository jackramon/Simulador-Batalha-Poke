
import { CSSProperties } from 'react';

export const PARALYSIS_CSS = `
@keyframes paralysis-glitch {
    0%, 75% { transform: translate(0, 0) skew(0deg); filter: none; }
    76% { transform: translate(-5px, 0) skew(-10deg); filter: none; }
    78% { transform: translate(5px, 0) skew(10deg); filter: brightness(1.3) sepia(1) saturate(5) hue-rotate(50deg); }
    80% { transform: translate(0, -4px) skew(0deg); filter: none; }
    82%, 100% { transform: translate(0, 0) skew(0deg); filter: none; }
}

.anim-status-paralysis { 
    animation: paralysis-glitch 2s infinite linear; 
    z-index: 30; 
    will-change: transform, filter;
}
`;

export const getParalysisAnimation = () => {
  return { className: 'anim-status-paralysis' };
};
