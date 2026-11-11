
import { CSSProperties } from 'react';

export const SLEEP_CSS = `
@keyframes float-zzz {
    0% { 
        opacity: 0; 
        transform: translate(-50%, 0) scale(0.5); 
    }
    15% { 
        opacity: 1; 
        transform: translate(-50%, -15px) scale(1); 
    }
    100% { 
        opacity: 0; 
        transform: translate(-50%, -50px) scale(1.2); 
    }
}

.anim-status-sleep { 
    /* Static filter only. 
       CRITICAL: Do NOT set position: relative here. 
       The parent element in BattleScene is already position: absolute.
       Setting relative here overrides absolute and breaks the layout coordinates.
    */
    filter: grayscale(0.4) brightness(0.95) contrast(0.9);
    z-index: 30; 
}

.anim-status-sleep::after {
    content: 'Zzz';
    position: absolute;
    /* Positioned relative to the sprite container (which is absolute) */
    top: -20%;
    left: 50%;
    
    /* Typography */
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-weight: 900;
    font-size: 28px;
    line-height: 1;
    color: #ffffff;
    
    /* High contrast outline for visibility on any background */
    -webkit-text-stroke: 1.5px #1e3a8a; /* Dark Blue */
    text-shadow: 3px 3px 0px rgba(0,0,0,0.15);
    
    /* Particle Animation */
    animation: float-zzz 2.5s infinite linear;
    pointer-events: none;
    white-space: nowrap;
}
`;

export const getSleepAnimation = () => {
  return { className: 'anim-status-sleep' };
};
