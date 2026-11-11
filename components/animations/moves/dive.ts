import { CSSProperties } from 'react';

export const DIVE_CSS = `
@keyframes dive-down { 
    0% { transform: translateY(0); opacity: 1; filter: none; } 
    100% { transform: translateY(150%) scale(0.8); opacity: 0.7; filter: brightness(0.8) sepia(1) hue-rotate(190deg) saturate(3); } 
}
@keyframes dive-up { 
    0% { transform: translateY(150%) scale(0.8); opacity: 0.7; filter: brightness(0.8) sepia(1) hue-rotate(190deg) saturate(3); } 
    40% { transform: translateY(0) scale(1); opacity: 1; filter: none; } 
    60% { transform: translateY(-20px) scale(1.1); } 
    100% { transform: translateY(0); } 
}
.animate-dive-down { animation: dive-down 0.4s ease-in forwards; }
.animate-dive-up { animation: dive-up 0.6s ease-out forwards; z-index: 50; }
`;

export const getDiveAnimation = (isCharging: boolean, isAttacking: boolean, isPlayer: boolean) => {
  if (isAttacking) {
    // Turno 2: Atacando (Surgindo da água)
    if (isCharging) {
      return { className: 'animate-dive-up' };
    }
    // Turno 1: Iniciando o golpe (Mergulhando)
    return { className: 'animate-dive-down' };
  }

  // Estado contínuo de carregamento (Submerso)
  if (isCharging) {
    return {
      style: {
        transform: 'translateY(150%) scale(0.8)',
        opacity: 0.7,
        filter: 'brightness(0.8) sepia(1) hue-rotate(190deg) saturate(3)',
        transition: 'transform 0.5s, opacity 0.5s, filter 0.5s'
      } as CSSProperties
    };
  }

  return {};
};