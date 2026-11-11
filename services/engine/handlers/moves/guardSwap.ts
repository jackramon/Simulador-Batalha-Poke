
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

export function handleGuardSwap(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]) {
  if (defender.isFainted) return;

  // Swap Defense Stages
  const tempDef = attacker.statStages.defense;
  attacker.statStages.defense = defender.statStages.defense;
  defender.statStages.defense = tempDef;

  // Swap Sp. Def Stages
  const tempSpDef = attacker.statStages.spDefense;
  attacker.statStages.spDefense = defender.statStages.spDefense;
  defender.statStages.spDefense = tempSpDef;

  log(logs, `${attacker.name} trocou suas alterações de defesa com o alvo!`, 'text-indigo-600 font-bold');
}
