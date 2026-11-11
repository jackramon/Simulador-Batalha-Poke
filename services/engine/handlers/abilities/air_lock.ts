
import { BattleState, Pokemon } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Verifica se os efeitos de clima estão suprimidos por Air Lock ou Cloud Nine.
 * Regra Oficial: Enquanto um Pokémon com esta habilidade estiver em campo, 
 * todos os efeitos do clima são negados (embora o clima continue ativo).
 * A habilidade é anulada se o Gás Neutralizante estiver ativo.
 */
export function isWeatherSuppressed(state?: BattleState): boolean {
    if (!state) return false;

    const gasActive = NeutralizingGas.isGasActive(state);
    const p1 = state.currentPokemon1;
    const p2 = state.currentPokemon2;

    const p1Suppresses = p1 && 
        (p1.ability === 'air-lock' || p1.ability === 'cloud-nine') && 
        !p1.isFainted && 
        (!gasActive || !NeutralizingGas.isAbilitySuppressed(p1.ability, true));

    const p2Suppresses = p2 && 
        (p2.ability === 'air-lock' || p2.ability === 'cloud-nine') && 
        !p2.isFainted && 
        (!gasActive || !NeutralizingGas.isAbilitySuppressed(p2.ability, true));

    return !!(p1Suppresses || p2Suppresses);
}

export function announceAirLock(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    const name = pokemon.ability === 'air-lock' ? 'Bloqueio Aéreo' : 'Nuvem Nove';
    log(logs, `Os efeitos do clima foram anulados pelo ${name} de ${pokemon.name}!`, 'text-indigo-700 font-bold italic');
}
