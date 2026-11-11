
import { Pokemon, Move } from '../../../../types';
import { log, LogEntry } from '../../utils';
import { TYPE_NAMES_PT } from '../../../../data/types';

/**
 * Lógica para a habilidade Mudança de Cor (Color Change).
 * Regra Oficial: Muda o tipo do Pokémon para o tipo do movimento que o atingiu.
 * Ativa apenas por movimentos que causam dano.
 */
export function handleColorChange(
    defender: Pokemon,
    move: Move,
    logs: LogEntry[]
): boolean {
    if (defender.ability !== 'color-change' || defender.isFainted) {
        return false;
    }

    // Só ativa com movimentos de dano (não status)
    if (move.damageClass === 'status') {
        return false;
    }

    const moveType = move.type.toLowerCase();
    
    // Não ativa se o Pokémon já for exclusivamente daquele tipo
    if (defender.types.length === 1 && defender.types[0] === moveType) {
        return false;
    }

    // Altera o tipo
    defender.types = [moveType];
    const typeDisplayName = TYPE_NAMES_PT[moveType] || moveType;
    
    log(logs, `A Mudança de Cor de ${defender.name} o transformou no tipo ${typeDisplayName}!`, 'text-purple-600 font-bold italic');
    
    return true;
}
