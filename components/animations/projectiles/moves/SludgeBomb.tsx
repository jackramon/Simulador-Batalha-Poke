
import React from 'react';
import { BaseProjectile } from '../BaseProjectile';

export const SludgeBomb: React.FC<{ isPlayer: boolean }> = ({ isPlayer }) => (
  <BaseProjectile 
    color="#a855f7" 
    coreColor="#4a044e" 
    particleColor="#7e22ce" 
    type="blob" 
    isPlayer={isPlayer} 
  />
);
