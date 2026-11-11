
import { CSSProperties } from 'react';

export const FLINCH_CSS = `
@keyframes flinch-p1 {
    0% { transform: translate(0, 0) scale(1); }
    20% { transform: translate(-40px, 10px) scale(0.9); }
    50% { transform: translate(-35px, 8px) scale(0.92); }
    100% { transform: translate(0, 0) scale(1); }
}
@keyframes flinch-p2 {
    0% { transform: translate(0, 0) scale(1); }
    20% { transform: translate(40px, -10px) scale(0.9); }
    50% { transform: translate(35px, -8px) scale(0.92); }
    100% { transform: translate(0, 0) scale(1); }
}
.anim-flinch-p1 { 
    animation: flinch-p1 0.6s cubic-bezier(0.1, 0.7, 1.0, 0.1); 
    z-index: 30; 
}
.anim-flinch-p2 { 
    animation: flinch-p2 0.6s cubic-bezier(0.1, 0.7, 1.0, 0.1); 
    z-index: 30; 
}
`;

export const getFlinchAnimation = (isPlayer: boolean) => {
  return { className: isPlayer ? 'anim-flinch-p1' : 'anim-flinch-p2' };
};
