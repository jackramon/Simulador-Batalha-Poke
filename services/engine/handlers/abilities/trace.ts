
import { Pokemon } from '../../../../types';
import { ABILITY_EFFECTS } from '../../../../data/abilities';
import { log, LogEntry } from '../../utils';

/**
 * Lista de habilidades que não podem ser copiadas por Rastro (Trace).
 * Baseado nas restrições oficiais da franquia.
 */
const NON_TRACEABLE_ABILITIES = [
    'trace', 'illusion', 'multitype', 'zen-mode', 'schooling', 
    'shields-down', 'commander', 'tera-shift', 'zero-to-hero', 
    'hunger-switch', 'disguise', 'ice-face', 'rks-system', 'battle-bond'
];

/**
 * Lógica para a habilidade Rastro (Trace).
 * Copia a habilidade do oponente ao entrar em campo.
 */
export function handleTrace(pokemon: Pokemon, opponent: Pokemon | null, logs: LogEntry[]): boolean {
    if (pokemon.ability !== 'trace' || !opponent || opponent.isFainted) {
        return false;
    }

    const opponentAbility = opponent.ability;

    // Verifica se a habilidade do oponente é válida para ser copiada
    if (opponentAbility && !NON_TRACEABLE_ABILITIES.includes(opponentAbility)) {
        const abilityName = ABILITY_EFFECTS[opponentAbility]?.name || opponentAbility;
        
        log(logs, `${pokemon.name} rastreou o ${abilityName} de ${opponent.name}!`, 'text-purple-600 font-bold italic');
        
        // Copia a habilidade
        pokemon.ability = opponentAbility;
        return true;
    }

    return false;
}
