import { CSSProperties } from 'react';

export const PHANTOM_CSS = `
@keyframes phantom-fade {
    0% { opacity: 1; filter: none; }
    50% { opacity: 0; filter: blur(2px) grayscale(1); }
    100% { opacity: 1; filter: none; }
}
.animate-phantom-fade { animation: phantom-fade 1s ease-in-out; }
`;

export const getPhantomAnimation = (isCharging: boolean, isAttacking: boolean) => {
  // Turno de ataque (ou Teleport)
  if (isAttacking) {
    return { className: 'animate-phantom-fade' };
  }

  // Estado de carregamento (Phantom Force / Shadow Force) - Fica invisível/fantasma
  if (isCharging) {
    return {
      style: {
        opacity: 0.2,
        filter: 'grayscale(1) blur(1px)',
        transition: 'opacity 0.5s, filter 0.5s'
      } as CSSProperties
    };
  }

  return {};
};