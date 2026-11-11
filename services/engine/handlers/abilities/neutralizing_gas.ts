
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as Illusion from './illusion';

/**
 * Habilidades que NÃO são afetadas pelo Gás Neutralizante (oficial).
 */
const UNGASABLE_ABILITIES = [
    'neutralizing-gas', 'multitype', 'zen-mode', 'schooling', 
    'shields-down', 'rks-system', 'comatose', 'disguise', 
    'gulp-missile', 'ice-face', 'zero-to-hero', 'tera-shift',
    'commander', 'as-one', 'as-one-glastrier', 'as-one-spectrier'
];

/**
 * Verifica se o Gás Neutralizante está ativo no campo.
 */
export function isGasActive(state?: BattleState): boolean {
    if (!state) return false;
    const p1 = state.currentPokemon1;
    const p2 = state.currentPokemon2;
    
    // Verifica se os portadores do gás não estão sob efeito de Gastro Acid
    const p1HasGas = p1 && p1.ability === 'neutralizing-gas' && !p1.isFainted && !p1.statusEffects['gastro-acid'];
    const p2HasGas = p2 && p2.ability === 'neutralizing-gas' && !p2.isFainted && !p2.statusEffects['gastro-acid'];

    return !!(p1HasGas || p2HasGas);
}

/**
 * Verifica se uma habilidade específica pode ser ativada dado o estado do campo.
 * Considera Gás Neutralizante e Ácido Gástrico.
 */
export function canAbilityTrigger(pokemon: Pokemon | null, state?: BattleState): boolean {
    if (!pokemon) return false;
    
    // Habilidades imunes a supressão sempre funcionam
    if (UNGASABLE_ABILITIES.includes(pokemon.ability)) return true;

    // Se o Pokémon está sob efeito de Ácido Gástrico (ou Core Enforcer), a habilidade não ativa
    if (pokemon.statusEffects['gastro-acid']) return false;

    // Se o Gás Neutralizante está ativo no campo, a habilidade não ativa
    if (isGasActive(state)) return false;

    return true;
}

/**
 * Versão simplificada para quando o estado já foi verificado.
 */
export function isAbilitySuppressed(ability: string, gasInField: boolean): boolean {
    if (!gasInField) return false;
    return !UNGASABLE_ABILITIES.includes(ability);
}

export function announceGas(pokemon: Pokemon, logs: {message: string, color: string}[], state: BattleState) {
    if (pokemon.statusEffects['gastro-acid']) return;

    log(logs, `O Gás Neutralizante de ${pokemon.name} preencheu a área!`, 'text-gray-600 font-black italic');
    
    // Oficial: Quando o Gás Neutralizante entra, a Ilusão é quebrada imediatamente.
    const p1 = state.currentPokemon1;
    const p2 = state.currentPokemon2;

    if (p1 && p1.id !== pokemon.id) Illusion.breakIllusion(p1, logs);
    if (p2 && p2.id !== pokemon.id) Illusion.breakIllusion(p2, logs);
}
