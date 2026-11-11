
export const POISON_CSS = `
@keyframes poison-pulse {
    0% { filter: drop-shadow(0 0 0 rgba(168, 85, 247, 0)); transform: scale(1); }
    50% { filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.8)) hue-rotate(280deg) brightness(0.8); transform: scale(0.98); }
    100% { filter: drop-shadow(0 0 0 rgba(168, 85, 247, 0)); transform: scale(1); }
}
.anim-status-poison { animation: poison-pulse 1s ease-in-out infinite; z-index: 30; }
`;

export const getPoisonAnimation = () => {
  return { className: 'anim-status-poison' };
};
