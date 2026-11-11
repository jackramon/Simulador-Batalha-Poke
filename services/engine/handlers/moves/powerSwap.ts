
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Troca de Poder (Power Swap).
 * Regra Oficial: O usuário troca suas mudanças de estágios de Ataque e Ataque Especial com o alvo.
 * (Apenas os estágios, não os valores base).
 */
export function handlePowerSwap(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]) {
  if (defender.isFainted) return;

  // Swap Attack Stages
  const tempAtk = attacker.statStages.attack;
  attacker.statStages.attack = defender.statStages.attack;
  defender.statStages.attack = tempAtk;

  // Swap Sp. Attack Stages
  const tempSpAtk = attacker.statStages.spAttack;
  attacker.statStages.spAttack = defender.statStages.spAttack;
  defender.statStages.spAttack = tempSpAtk;

  log(logs, `${attacker.name} trocou suas alterações de ataque com o alvo!`, 'text-indigo-600 font-bold');
}
