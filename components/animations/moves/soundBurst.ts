import { CSSProperties } from 'react';

export const SOUND_BURST_CSS = `
@keyframes sound-burst-anim {
    0% { transform: scale(1) translate(0,0); }
    20% { transform: scale(1.15); }
    30% { transform: scale(1.2) translate(-5px, 0); }
    40% { transform: scale(1.2) translate(5px, 0); }
    50% { transform: scale(1.2) translate(-5px, 0); }
    60% { transform: scale(1.2) translate(5px, 0); }
    70% { transform: scale(1.2) translate(-5px, 0); }
    100% { transform: scale(1) translate(0,0); }
}
.animate-sound-burst { animation: sound-burst-anim 0.8s ease-in-out; z-index: 50; }
`;

export const getSoundBurstAnimation = (isAttacking: boolean) => {
  if (isAttacking) {
    return { className: 'animate-sound-burst' };
  }
  return {};
};