
import React from 'react';
import { BaseProjectile } from '../BaseProjectile';

export const EnergyBall: React.FC<{ isPlayer: boolean }> = ({ isPlayer }) => (
  <BaseProjectile 
    color="#4ade80" 
    coreColor="#ffffff" 
    particleColor="#16a34a" 
    type="orb" 
    isPlayer={isPlayer} 
  />
);
