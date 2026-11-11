
import { CSSProperties } from 'react';

export const DAMAGE_CSS = `
@keyframes damage-flash {
    0%, 10% { filter: brightness(10) grayscale(1); transform: translate(0,0); }
    11% { filter: sepia(1) hue-rotate(-50deg) saturate(5); transform: translateX(-4px); }
    25% { transform: translateX(4px); }
    40% { transform: translateX(-4px); }
    55% { transform: translateX(3px); }
    70% { transform: translateX(-2px); }
    100% { filter: none; transform: translate(0,0); }
}
.anim-damage-flash { 
    animation: damage-flash 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97); 
}
`;

export const getDamageAnimation = () => {
  return { className: 'anim-damage-flash' };
};
