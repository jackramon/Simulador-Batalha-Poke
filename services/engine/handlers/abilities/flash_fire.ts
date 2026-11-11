
import { Pokemon, Move } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o efeito de Fogo Absorvente (Flash Fire).
 * Quando ativado, o poder dos golpes de Fogo do usuário aumenta em 50%.
 */
export function activateFlashFire(pokemon: Pokemon, logs: LogEntry[]) {
    if (pokemon.ability !== 'flash-fire' || pokemon.isFainted) return;

    if (!pokemon.statusEffects['flash-fire-active']) {
        pokemon.statusEffects['flash-fire-active'] = { turns: -1 }; // -1 indica persistência até a troca
        log(logs, `O Fogo Absorvente de ${pokemon.name} foi ativado! Seus golpes de Fogo ficaram mais fortes!`, 'text-orange-600 font-bold');
    } else {
        log(logs, `O Fogo Absorvente de ${pokemon.name} já está ativo!`, 'text-gray-500 italic text-xs');
    }
}

/**
 * Calcula o multiplicador de dano para movimentos de Fogo.
 * Regra: 1.5x se a habilidade Flash Fire estiver ativa.
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'flash-fire' && move.type === 'fire' && pokemonHasActiveFlashFire(attacker)) {
        return 1.5;
    }
    return 1;
}

/**
 * Verifica se o estado de ativação da habilidade está presente.
 */
export function pokemonHasActiveFlashFire(pokemon: Pokemon): boolean {
    return !!pokemon.statusEffects['flash-fire-active'];
}
