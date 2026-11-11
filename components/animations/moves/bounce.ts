import { CSSProperties } from 'react';

export const BOUNCE_CSS = `
@keyframes bounce-up { 
    0% { transform: translateY(0); opacity: 1; } 
    100% { transform: translateY(-150%) scale(0.9); opacity: 0; } 
}
@keyframes bounce-crash-right { 
    0% { transform: translate(0, -150%) scale(0.9); opacity: 0; } 
    20% { transform: translate(0, -150%) scale(1); opacity: 1; } 
    50% { transform: translate(30px, 0) scale(1.1, 0.8); } /* Impacto no chão com squash */
    70% { transform: translate(15px, -20px) scale(1); } /* Rebote */
    100% { transform: translate(0,0); } 
}
@keyframes bounce-crash-left { 
    0% { transform: translate(0, -150%) scale(0.9); opacity: 0; } 
    20% { transform: translate(0, -150%) scale(1); opacity: 1; } 
    50% { transform: translate(-30px, 0) scale(1.1, 0.8); } /* Impacto no chão com squash */
    70% { transform: translate(-15px, -20px) scale(1); } /* Rebote */
    100% { transform: translate(0,0); } 
}
.animate-bounce-up { animation: bounce-up 0.4s ease-in forwards; }
.animate-bounce-crash-right { animation: bounce-crash-right 0.6s ease-in-out forwards; z-index: 50; }
.animate-bounce-crash-left { animation: bounce-crash-left 0.6s ease-in-out forwards; z-index: 50; }
`;

export const getBounceAnimation = (isCharging: boolean, isAttacking: boolean, isPlayer: boolean) => {
  if (isAttacking) {
    // Turno 2: Atacando (Caindo e quicando)
    if (isCharging) {
      return { className: isPlayer ? 'animate-bounce-crash-right' : 'animate-bounce-crash-left' };
    }
    // Turno 1: Iniciando o golpe (Saltando)
    return { className: 'animate-bounce-up' };
  }

  // Estado contínuo de carregamento (No ar)
  if (isCharging) {
    return {
      style: {
        transform: 'translateY(-150%) scale(0.9)',
        opacity: 0,
        transition: 'transform 0.5s, opacity 0.5s'
      } as CSSProperties
    };
  }

  return {};
};