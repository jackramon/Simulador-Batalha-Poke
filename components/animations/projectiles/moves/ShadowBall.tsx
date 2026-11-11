
import React from 'react';
import { BaseProjectile } from '../BaseProjectile';

export const ShadowBall: React.FC<{ isPlayer: boolean }> = ({ isPlayer }) => (
  <BaseProjectile 
    color="#9333ea" 
    coreColor="#1a1a1a" 
    particleColor="#581c87" 
    type="orb" 
    isPlayer={isPlayer} 
  />
);
