
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Psicose (Psych Up).
 * Regra Oficial: O usuário copia todas as mudanças de estágios de atributos do alvo.
 * Isso inclui mudanças positivas e negativas.
 * Copia: Attack, Defense, SpAttack, SpDefense, Speed, Accuracy, Evasion.
 * Ignora efeitos de Substitutos.
 */
export function handlePsychUp(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (attacker.isFainted || defender.isFainted) return;

    // Copia os estágios de atributos
    attacker.statStages = { ...defender.statStages };

    log(logs, `${attacker.name} copiou as mudanças de atributos de ${defender.name}!`, 'text-indigo-600 font-bold italic');
}
