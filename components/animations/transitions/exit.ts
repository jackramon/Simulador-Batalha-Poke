
import { CSSProperties } from 'react';

export const EXIT_CSS = `
/* Recall Red Beam Effect */
@keyframes recall-p1 {
    0% { transform: scale(1); filter: none; opacity: 1; }
    20% { transform: scale(1); filter: sepia(1) saturate(10) hue-rotate(-50deg) brightness(1.2); opacity: 1; } /* Red Filter */
    100% { transform: scale(0.1) translate(-200px, 200px); opacity: 0; filter: sepia(1) saturate(10) hue-rotate(-50deg) brightness(3); }
}

@keyframes recall-p2 {
    0% { transform: scale(1); filter: none; opacity: 1; }
    20% { transform: scale(1); filter: sepia(1) saturate(10) hue-rotate(-50deg) brightness(1.2); opacity: 1; } /* Red Filter */
    100% { transform: scale(0.1) translate(200px, -200px); opacity: 0; filter: sepia(1) saturate(10) hue-rotate(-50deg) brightness(3); }
}

.anim-exit-p1 {
    animation: recall-p1 0.5s ease-in forwards !important;
}

.anim-exit-p2 {
    animation: recall-p2 0.5s ease-in forwards !important;
}
`;

export const getExitAnimation = (isPlayer: boolean) => {
    return { className: isPlayer ? 'anim-exit-p1' : 'anim-exit-p2' };
};
