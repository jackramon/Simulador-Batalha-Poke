
import React from 'react';

interface BaseProjectileProps {
  color: string;
  coreColor: string;
  particleColor: string;
  type: 'orb' | 'blob';
  isPlayer: boolean;
}

export const BaseProjectile: React.FC<BaseProjectileProps> = ({
  color,
  coreColor,
  particleColor,
  type,
  isPlayer
}) => {
  const styles = `
    @keyframes projectile-p1 {
      0% { left: 20%; bottom: 20%; transform: scale(0.5); opacity: 0; }
      10% { opacity: 1; transform: scale(1); }
      100% { left: 70%; bottom: 60%; transform: scale(1.5); opacity: 0; }
    }
    @keyframes projectile-p2 {
      0% { right: 20%; top: 35%; transform: scale(0.5); opacity: 0; }
      10% { opacity: 1; transform: scale(1); }
      100% { right: 70%; top: 75%; transform: scale(1.5); opacity: 0; }
    }
    @keyframes wobble {
      0% { transform: rotate(0deg); }
      50% { transform: rotate(180deg) scale(0.9, 1.1); }
      100% { transform: rotate(360deg); }
    }
    
    .projectile-container {
      position: absolute;
      width: 40px;
      height: 40px;
      z-index: 45; /* Below damage numbers/impacts but above pokemon */
      pointer-events: none;
      animation: ${isPlayer ? 'projectile-p1' : 'projectile-p2'} 0.5s ease-in-out forwards;
    }

    .projectile-core {
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 30% 30%, ${coreColor}, ${color});
      border-radius: ${type === 'blob' ? '50% 60% 40% 70% / 60% 50% 70% 40%' : '50%'};
      box-shadow: 0 0 15px ${color}, 0 0 30px ${color};
      filter: drop-shadow(0 0 5px ${particleColor});
      animation: ${type === 'blob' ? 'wobble 0.3s infinite linear' : 'none'};
    }

    .projectile-trail {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 300%;
      height: 80%;
      background: linear-gradient(90deg, ${color} 0%, transparent 100%);
      opacity: 0.5;
      z-index: -1;
      border-radius: 40px;
      transform-origin: left center;
      ${isPlayer ? 'transform: translate(-10%, -50%) rotate(-35deg);' : 'transform: translate(-10%, -50%) rotate(145deg);'}
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="projectile-container">
        <div className="projectile-core"></div>
        <div className="projectile-trail"></div>
      </div>
    </>
  );
};
