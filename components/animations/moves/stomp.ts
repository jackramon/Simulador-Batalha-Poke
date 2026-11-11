import { CSSProperties } from 'react';

export const STOMP_CSS = `
@keyframes stomp-anim {
    0% { transform: scale(1) translateY(0) rotate(0); }
    25% { transform: scale(1) translateY(-60px) rotate(-5deg); }
    40% { transform: scale(1) translateY(0) rotate(0); }
    50% { transform: scale(1.15, 0.85) translateY(5px); }
    100% { transform: scale(1) translateY(0); }
}
.animate-stomp { animation: stomp-anim 0.4s ease-in; z-index: 50; }
`;

export const getStompAnimation = (isAttacking: boolean) => {
  if (isAttacking) {
    return { className: 'animate-stomp' };
  }
  return {};
};