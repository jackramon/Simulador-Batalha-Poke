
export const BURN_CSS = `
@keyframes burn-flicker {
    0% { filter: sepia(1) hue-rotate(-50deg) saturate(3) brightness(1); }
    25% { filter: sepia(1) hue-rotate(-50deg) saturate(5) brightness(1.2); }
    50% { filter: sepia(1) hue-rotate(-50deg) saturate(3) brightness(1); }
    75% { filter: sepia(1) hue-rotate(-50deg) saturate(5) brightness(0.8); }
    100% { filter: sepia(1) hue-rotate(-50deg) saturate(3) brightness(1); }
}
.anim-status-burn { animation: burn-flicker 0.8s linear infinite; z-index: 30; }
`;

export const getBurnAnimation = () => {
  return { className: 'anim-status-burn' };
};
