import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Instrução (Coaching).
 * Regra Oficial: Aumenta o Ataque e a Defesa dos aliados em 1 estágio.
 * Adaptação 1v1: Como não há aliados, o usuário "treina a si mesmo", aumentando
 * seu próprio Ataque e Defesa em 1 estágio.
 */
export function handleCoaching(
  attacker: Pokemon,
  logs: LogEntry[],
  state?: BattleState
): void {
  log(logs, `${attacker.name} está treinando seus movimentos!`, 'text-blue-600 font-bold');
  
  // Aplica +1 Attack
  StatChanges.applyMoveStatChange(
    attacker, 
    'attack-up', 
    logs, 
    false, // isOpponentSource
    false, // ignoresAbilities
    'coaching', 
    state
  );
  
  // Aplica +1 Defense
  StatChanges.applyMoveStatChange(
    attacker, 
    'defense-up', 
    logs, 
    false, // isOpponentSource
    false, // ignoresAbilities
    'coaching', 
    state
  );
}
