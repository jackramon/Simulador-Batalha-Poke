import { CSSProperties } from 'react';

export const RAPID_SPIN_CSS = `
@keyframes spin-fast {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.animate-spin-fast { animation: spin-fast 0.5s linear infinite; z-index: 50; }
`;

export const getRapidSpinAnimation = (isAttacking: boolean) => {
  if (isAttacking) {
    return { className: 'animate-spin-fast' };
  }
  return {};
};