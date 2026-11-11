
import { CSSProperties } from 'react';

export const CONFUSION_CSS = `
@keyframes confusion-wobble {
    0% { transform: translateX(0) rotate(0deg); }
    25% { transform: translateX(-5px) rotate(-5deg); }
    50% { transform: translateX(5px) rotate(5deg) scaleX(-1); filter: saturate(1.5) hue-rotate(90deg); }
    75% { transform: translateX(-3px) rotate(-3deg) scaleX(-1); }
    100% { transform: translateX(0) rotate(0deg) scaleX(1); }
}
.anim-status-confusion { 
    animation: confusion-wobble 1.5s ease-in-out infinite; 
    z-index: 30; 
}
`;

export const getConfusionAnimation = () => {
  return { className: 'anim-status-confusion' };
};
