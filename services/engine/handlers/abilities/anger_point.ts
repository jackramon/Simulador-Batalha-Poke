import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Ponto de Raiva (Anger Point).
 * Regra Oficial: Se o Pokémon for atingido por um acerto crítico, seu Ataque aumenta para o nível máximo (+6).
 * Nota: Funciona mesmo se o Pokémon estiver atrás de um Substituto (Gen 5+).
 */
export function triggerAngerPoint(
    pokemon: Pokemon, 
    isCrit: boolean, 
    logs: {message: string, color: string}[]
): boolean {
    if (pokemon.ability !== 'anger-point' || pokemon.isFainted || !isCrit) {
        return false;
    }

    if (pokemon.statStages.attack < 6) {
        pokemon.statStages.attack = 6;
        log(logs, `O Ponto de Raiva de ${pokemon.name} maximizou seu Ataque!`, 'text-red-600 font-black italic animate-pulse');
        return true;
    }

    return false;
}
