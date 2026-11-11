
import { CSSProperties } from 'react';

export const ENTRY_CSS = `
/* Pokéball Styles */
.pokeball-projectile {
    position: absolute;
    width: 24px;
    height: 24px;
    background: radial-gradient(circle at 30% 30%, #fff 2px, transparent 2.5px), linear-gradient(to bottom, #ef4444 48%, #333 48%, #333 52%, #fff 52%);
    border-radius: 50%;
    border: 2px solid #333;
    z-index: 50;
    box-shadow: 0 0 5px rgba(0,0,0,0.3);
}
.pokeball-projectile::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: #fff;
    border: 2px solid #333;
    border-radius: 50%;
}

/* Player 1 Throw */
@keyframes throw-arc-p1 {
    0% { left: -50px; bottom: -50px; transform: rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    100% { left: 20%; bottom: 20%; transform: rotate(720deg); opacity: 1; }
}

/* Player 2 Throw */
@keyframes throw-arc-p2 {
    0% { right: -50px; top: -50px; transform: rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    100% { right: 20%; top: 40%; transform: rotate(-720deg); opacity: 1; }
}

/* Burst/Pop Effect when Pokemon appears */
@keyframes summon-flash {
    0% { opacity: 0; transform: scale(0.1); filter: brightness(100); }
    50% { opacity: 1; transform: scale(1.1); filter: brightness(50); }
    100% { opacity: 1; transform: scale(1); filter: none; }
}

/* Classes */
.anim-throw-p1 {
    animation: throw-arc-p1 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}
.anim-throw-p2 {
    animation: throw-arc-p2 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}
.anim-enter {
    animation: summon-flash 0.4s ease-out forwards;
}
`;

export const getEntryAnimation = (isPlayer: boolean) => {
    return { className: 'anim-enter' };
};
