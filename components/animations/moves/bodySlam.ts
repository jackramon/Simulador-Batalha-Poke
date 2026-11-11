import { CSSProperties } from 'react';

export const BODY_SLAM_CSS = `
@keyframes body-slam-anim {
    0% { transform: scale(1) translateY(0); }
    30% { transform: scale(1) translateY(-100px); }
    50% { transform: scale(1) translateY(0); }
    60% { transform: scale(1.4, 0.6) translateY(10px); }
    75% { transform: scale(0.9, 1.1) translateY(-5px); }
    100% { transform: scale(1) translateY(0); }
}
.animate-body-slam { animation: body-slam-anim 0.6s ease-in-out; z-index: 50; }
`;

export const getBodySlamAnimation = (isAttacking: boolean) => {
  if (isAttacking) {
    return { className: 'animate-body-slam' };
  }
  return {};
};