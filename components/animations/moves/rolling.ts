import { CSSProperties } from 'react';

export const ROLLING_CSS = `
@keyframes roll-anim-right {
    0% { transform: translateX(0) rotate(0deg); }
    50% { transform: translateX(60px) rotate(180deg); }
    100% { transform: translateX(0) rotate(360deg); }
}
@keyframes roll-anim-left {
    0% { transform: translateX(0) rotate(0deg); }
    50% { transform: translateX(-60px) rotate(-180deg); }
    100% { transform: translateX(0) rotate(-360deg); }
}
.animate-roll-right { animation: roll-anim-right 0.8s linear; z-index: 50; }
.animate-roll-left { animation: roll-anim-left 0.8s linear; z-index: 50; }
`;

export const getRollingAnimation = (isAttacking: boolean, isPlayer: boolean) => {
  if (isAttacking) {
    return { className: isPlayer ? 'animate-roll-right' : 'animate-roll-left' };
  }
  return {};
};