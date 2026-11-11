
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Véu de Aroma (Aroma Veil).
 * Regra Oficial: Protege o Pokémon e seus aliados de efeitos que limitem seus movimentos.
 * Efeitos protegidos: Attract (infatuation), Disable, Encore, Heal Block, Taunt e Torment.
 * Esta habilidade É ignorada por Mold Breaker.
 */

const MENTAL_EFFECTS = ['infatuation', 'taunt', 'encore', 'disable', 'torment', 'heal-block'];

/**
 * Verifica se o Pokémon é imune a um status específico devido ao Véu de Aroma.
 */
export function isImmune(pokemon: Pokemon, status: string): boolean {
    if (pokemon.ability !== 'aroma-veil' || pokemon.isFainted) {
        return false;
    }

    return MENTAL_EFFECTS.includes(status);
}

/**
 * Verifica se o Pokémon é imune ao efeito de "Disable" (usado por Cursed Body ou o movimento Disable).
 */
export function isImmuneToDisable(pokemon: Pokemon, ignoresAbilities: boolean): boolean {
    if (ignoresAbilities || pokemon.isFainted) return false;
    return pokemon.ability === 'aroma-veil';
}
