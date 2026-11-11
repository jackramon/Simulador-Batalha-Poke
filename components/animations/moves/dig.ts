import { CSSProperties } from 'react';

export const DIG_CSS = `
@keyframes dig-down { 
    0% { transform: translateY(0); opacity: 1; } 
    100% { transform: translateY(150%) scale(0.8); opacity: 0; } 
}
@keyframes dig-up { 
    0% { transform: translateY(150%) scale(0.8); opacity: 0; } 
    40% { transform: translateY(0) scale(1); opacity: 1; } 
    60% { transform: translateY(-20px) scale(1.1); } 
    100% { transform: translateY(0); } 
}
.animate-dig-down { animation: dig-down 0.4s ease-in forwards; }
.animate-dig-up { animation: dig-up 0.6s ease-out forwards; z-index: 50; }
`;

export const getDigAnimation = (isCharging: boolean, isAttacking: boolean, isPlayer: boolean) => {
  if (isAttacking) {
    // Turno 2: Atacando (Saindo do buraco)
    if (isCharging) {
      return { className: 'animate-dig-up' };
    }
    // Turno 1: Iniciando o golpe (Entrando no buraco)
    return { className: 'animate-dig-down' };
  }

  // Estado contínuo de carregamento (Escondido no buraco)
  if (isCharging) {
    return {
      style: {
        transform: 'translateY(150%) scale(0.8)',
        opacity: 0,
        transition: 'transform 0.5s, opacity 0.5s'
      } as CSSProperties
    };
  }

  return {};
};