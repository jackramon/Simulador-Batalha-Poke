import { CSSProperties } from 'react';

export const FLY_CSS = `
@keyframes fly-up { 
    0% { transform: translateY(0); opacity: 1; } 
    100% { transform: translateY(-150%) scale(0.5); opacity: 0; } 
}
@keyframes fly-crash-right { 
    0% { transform: translate(0, -150%) scale(0.5); opacity: 0; } 
    20% { transform: translate(0, -150%) scale(1); opacity: 1; } 
    50% { transform: translate(30px, -10px) scale(1.2); } 
    100% { transform: translate(0,0); } 
}
@keyframes fly-crash-left { 
    0% { transform: translate(0, -150%) scale(0.5); opacity: 0; } 
    20% { transform: translate(0, -150%) scale(1); opacity: 1; } 
    50% { transform: translate(-30px, 10px) scale(1.2); } 
    100% { transform: translate(0,0); } 
}
.animate-fly-up { animation: fly-up 0.4s ease-in forwards; }
.animate-fly-crash-right { animation: fly-crash-right 0.5s ease-in-out forwards; z-index: 50; }
.animate-fly-crash-left { animation: fly-crash-left 0.5s ease-in-out forwards; z-index: 50; }
`;

export const getFlyAnimation = (isCharging: boolean, isAttacking: boolean, isPlayer: boolean) => {
  if (isAttacking) {
    // Turno 2: Atacando (Descendo do céu)
    if (isCharging) {
      return { className: isPlayer ? 'animate-fly-crash-right' : 'animate-fly-crash-left' };
    }
    // Turno 1: Iniciando o golpe (Subindo)
    return { className: 'animate-fly-up' };
  }

  // Estado contínuo de carregamento (Voando alto)
  if (isCharging) {
    return {
      style: {
        transform: 'translateY(-150%) scale(0.5)',
        opacity: 0,
        transition: 'transform 0.5s, opacity 0.5s'
      } as CSSProperties
    };
  }

  return {};
};