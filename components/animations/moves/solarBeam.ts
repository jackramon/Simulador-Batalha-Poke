import { CSSProperties } from 'react';

export const SOLAR_BEAM_CSS = `
@keyframes solar-charge {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.5) sepia(1) drop-shadow(0 0 10px gold); }
}
@keyframes solar-shoot-right {
    0% { transform: translateX(0); opacity: 1; }
    20% { transform: translateX(-20px); opacity: 1; }
    40% { transform: translateX(100px); opacity: 0; }
    41% { transform: translateX(0); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
}
@keyframes solar-shoot-left {
    0% { transform: translateX(0); opacity: 1; }
    20% { transform: translateX(20px); opacity: 1; }
    40% { transform: translateX(-100px); opacity: 0; }
    41% { transform: translateX(0); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
}
.animate-solar-charge { animation: solar-charge 1.5s ease-in-out infinite; }
.animate-solar-shoot-right { animation: solar-shoot-right 0.4s cubic-bezier(0.5, 0, 0.5, 1); z-index: 50; }
.animate-solar-shoot-left { animation: solar-shoot-left 0.4s cubic-bezier(0.5, 0, 0.5, 1); z-index: 50; }
`;

export const getSolarBeamAnimation = (isCharging: boolean, isAttacking: boolean, isPlayer: boolean) => {
  if (isAttacking) {
    // Turno 2: Disparo
    return { className: isPlayer ? 'animate-solar-shoot-right' : 'animate-solar-shoot-left' };
  }

  // Turno 1 / Estado de Carga: Brilhando
  if (isCharging) {
    return { className: 'animate-solar-charge' };
  }

  return {};
};