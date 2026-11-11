
import { CSSProperties } from 'react';

export const SPECIAL_ATTACK_CSS = `
@keyframes special-cast-p1 {
    0% { transform: translate(0,0) scale(1); filter: brightness(1); }
    30% { transform: scale(1.15); filter: brightness(1.5); }
    40% { transform: translateX(-10px) scale(0.95); filter: brightness(1); }
    100% { transform: translate(0,0) scale(1); }
}
@keyframes special-cast-p2 {
    0% { transform: translate(0,0) scale(1); filter: brightness(1); }
    30% { transform: scale(1.15); filter: brightness(1.5); }
    40% { transform: translateX(10px) scale(0.95); filter: brightness(1); }
    100% { transform: translate(0,0) scale(1); }
}
.anim-special-p1 { animation: special-cast-p1 0.6s ease-in-out; z-index: 50; }
.anim-special-p2 { animation: special-cast-p2 0.6s ease-in-out; z-index: 50; }
`;

export const getSpecialAttackAnimation = (isPlayer: boolean) => {
  return { className: isPlayer ? 'anim-special-p1' : 'anim-special-p2' };
};
