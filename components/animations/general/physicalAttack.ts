
import { CSSProperties } from 'react';

export const PHYSICAL_ATTACK_CSS = `
@keyframes lunge-right { 
    0% { transform: translate(0,0); } 
    40% { transform: translate(25px, -10px) scale(1.1); } 
    100% { transform: translate(0,0); } 
}
@keyframes lunge-left { 
    0% { transform: translate(0,0); } 
    40% { transform: translate(-25px, 10px) scale(1.1); } 
    100% { transform: translate(0,0); } 
}
.animate-lunge-right { animation: lunge-right 0.35s cubic-bezier(0.4, 0, 0.2, 1); z-index: 50; }
.animate-lunge-left { animation: lunge-left 0.35s cubic-bezier(0.4, 0, 0.2, 1); z-index: 50; }
`;

export const getPhysicalAttackAnimation = (isPlayer: boolean) => {
  return { className: isPlayer ? 'animate-lunge-right' : 'animate-lunge-left' };
};
