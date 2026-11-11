
import React from 'react';
import { EnergyBall } from './projectiles/moves/EnergyBall';
import { ShadowBall } from './projectiles/moves/ShadowBall';
import { SludgeBomb } from './projectiles/moves/SludgeBomb';

export const getProjectileAnimation = (moveName: string | undefined, isPlayer: boolean): React.ReactNode | null => {
  if (!moveName) return null;

  switch (moveName) {
    case 'energy-ball':
      return <EnergyBall isPlayer={isPlayer} />;
    case 'shadow-ball':
      return <ShadowBall isPlayer={isPlayer} />;
    case 'sludge-bomb':
      return <SludgeBomb isPlayer={isPlayer} />;
    default:
      return null;
  }
};
