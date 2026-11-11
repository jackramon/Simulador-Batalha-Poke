import React from 'react';
import { Pokemon } from '../../types';
import { getDigAnimation } from './moves/dig';
import { getFlyAnimation } from './moves/fly';
import { getRapidSpinAnimation } from './moves/rapidSpin';
import { getSolarBeamAnimation } from './moves/solarBeam';
import { getDiveAnimation } from './moves/dive';
import { getBounceAnimation } from './moves/bounce';
import { getBodySlamAnimation } from './moves/bodySlam';
import { getStompAnimation } from './moves/stomp';
import { getMinimizeAnimation } from './moves/minimize';
import { getSoundBurstAnimation } from './moves/soundBurst';
import { getRollingAnimation } from './moves/rolling';
import { getSeismicAnimation } from './moves/seismic';
import { getPhantomAnimation } from './moves/phantom';

interface AnimationResult {
  className?: string;
  style?: React.CSSProperties;
}

export const getMoveAnimation = (
  pokemon: Pokemon | null,
  animationType: 'attack' | 'damage' | null,
  isPlayer: boolean
): AnimationResult => {
  if (!pokemon) return {};

  const moveName = pokemon.selectedMove?.name;
  const isCharging = !!pokemon.chargingMove;
  const isAttacking = animationType === 'attack';

  // Verifica Dig
  if (pokemon.chargingMove === 'dig' || (isAttacking && moveName === 'dig')) {
    return getDigAnimation(isCharging, isAttacking, isPlayer);
  }

  // Verifica Dive
  if (pokemon.chargingMove === 'dive' || (isAttacking && moveName === 'dive')) {
    return getDiveAnimation(isCharging, isAttacking, isPlayer);
  }

  // Verifica Fly
  if (pokemon.chargingMove === 'fly' || (isAttacking && moveName === 'fly')) {
    return getFlyAnimation(isCharging, isAttacking, isPlayer);
  }

  // Verifica Bounce
  if (pokemon.chargingMove === 'bounce' || (isAttacking && moveName === 'bounce')) {
    return getBounceAnimation(isCharging, isAttacking, isPlayer);
  }

  // Verifica Phantom Force / Shadow Force / Teleport
  const phantomMoves = ['phantom-force', 'shadow-force', 'teleport'];
  if (phantomMoves.includes(pokemon.chargingMove || '') || (isAttacking && phantomMoves.includes(moveName || ''))) {
    return getPhantomAnimation(isCharging, isAttacking);
  }

  // Verifica Rapid Spin
  if (isAttacking && moveName === 'rapid-spin') {
    return getRapidSpinAnimation(isAttacking);
  }

  // Verifica Rolling Moves
  if (isAttacking && ['rollout', 'ice-ball'].includes(moveName || '')) {
    return getRollingAnimation(isAttacking, isPlayer);
  }

  // Verifica Seismic Moves
  if (isAttacking && ['earthquake', 'bulldoze', 'fissure', 'magnitude'].includes(moveName || '')) {
    return getSeismicAnimation(isAttacking);
  }

  // Verifica Body Slam
  if (isAttacking && moveName === 'body-slam') {
    return getBodySlamAnimation(isAttacking);
  }

  // Verifica Stomp
  if (isAttacking && moveName === 'stomp') {
    return getStompAnimation(isAttacking);
  }

  // Verifica Minimize
  if (isAttacking && moveName === 'minimize') {
    return getMinimizeAnimation(isAttacking);
  }

  // Verifica Sound Burst (Roar, Hyper Voice, Uproar)
  const soundMoves = ['roar', 'hyper-voice', 'uproar'];
  if (isAttacking && soundMoves.includes(moveName || '')) {
    return getSoundBurstAnimation(isAttacking);
  }

  // Verifica Solar Beam / Solar Blade
  const solarMoves = ['solar-beam', 'solar-blade'];
  if (solarMoves.includes(pokemon.chargingMove || '') || (isAttacking && solarMoves.includes(moveName || ''))) {
    return getSolarBeamAnimation(isCharging, isAttacking, isPlayer);
  }

  return {};
};