import { CSSProperties } from 'react';

export const SEISMIC_CSS = `
@keyframes seismic-slam {
    0% { transform: translateY(0); }
    30% { transform: translateY(-40px) scale(1.1); } 
    40% { transform: translateY(10px) scale(0.9); } 
    50% { transform: translateY(0) translateX(-5px); } 
    60% { transform: translateY(0) translateX(5px); }
    70% { transform: translateY(0) translateX(-5px); }
    80% { transform: translateY(0) translateX(5px); }
    100% { transform: translateY(0); }
}
.animate-seismic { animation: seismic-slam 0.6s ease-in; z-index: 50; }
`;

export const getSeismicAnimation = (isAttacking: boolean) => {
  if (isAttacking) {
    return { className: 'animate-seismic' };
  }
  return {};
};