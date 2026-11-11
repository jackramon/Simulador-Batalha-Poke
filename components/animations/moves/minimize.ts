import { CSSProperties } from 'react';

export const MINIMIZE_CSS = `
@keyframes minimize-effect {
    0% { transform: scale(1); }
    20% { transform: scale(0.1); }
    40% { transform: scale(0.1) translate(10px, 0); }
    60% { transform: scale(0.1) translate(-10px, 0); }
    80% { transform: scale(0.1); }
    100% { transform: scale(1); }
}
.animate-minimize { animation: minimize-effect 1s ease-in-out; z-index: 50; }
`;

export const getMinimizeAnimation = (isAttacking: boolean) => {
  if (isAttacking) {
    return { className: 'animate-minimize' };
  }
  return {};
};