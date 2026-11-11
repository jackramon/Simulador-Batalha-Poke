import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { applyMoveStatChange } from '../effects/statChanges';

export function handleSeedFlareEffect(
  attacker: Pokemon,
  defender: Pokemon,
  logs: LogEntry[],
  state?: BattleState
): void {
  // Seed Flare has a 40% chance to lower the target's Sp. Def by 2 stages.
  // The chance is handled in the router, so here we just apply the effect.
  applyMoveStatChange(defender, 'spDefense-down', logs, true, false, 'seed-flare', state);
}
