import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para as habilidades Mais (Plus) e Menos (Minus).
 * Regra Oficial: Aumenta o Ataque Especial em 50% (1.5x) se houver um aliado em campo com Plus ou Minus.
 * Adaptação 1v1: O bônus é aplicado se houver um aliado saudável na reserva com Plus ou Minus.
 */
export function getMultiplier(pokemon: Pokemon, isGasActive: boolean, state?: BattleState): number {
    if (pokemon.ability !== 'plus' && pokemon.ability !== 'minus' || pokemon.isFainted) {
        return 1.0;
    }

    // Verifica se a habilidade está suprimida pelo Gás Neutralizante
    if (NeutralizingGas.isAbilitySuppressed(pokemon.ability, isGasActive)) {
        return 1.0;
    }

    if (!state) return 1.0;

    // Identifica a equipe do Pokémon
    const isP1 = state.team1.some(p => p.id === pokemon.id);
    const team = isP1 ? state.team1 : state.team2;

    // Verifica se existe algum aliado (na reserva ou ativo no futuro) com Plus ou Minus
    const hasPartner = team.some(p => 
        p.id !== pokemon.id && 
        !p.isFainted && 
        (p.ability === 'plus' || p.ability === 'minus')
    );

    return hasPartner ? 1.5 : 1.0;
}
