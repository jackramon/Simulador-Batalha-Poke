import { Pokemon, BattleState, StatStages } from '../../../../types';
import { log } from '../../utils';
import { STAT_NAMES_PT } from '../../../../data/pokemon';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Oportunista (Opportunist).
 * Regra Oficial: Se um oponente aumentar seus atributos, este Pokémon aumenta os mesmos atributos.
 */
export function handleOpportunist(
    target: Pokemon,
    statKey: keyof StatStages,
    amount: number,
    state: BattleState,
    logs: {message: string, color: string}[]
) {
    // Identifica o oponente do alvo que recebeu o boost
    const potentialUser = target === state.currentPokemon1 ? state.currentPokemon2 : state.currentPokemon1;
    
    if (!potentialUser || potentialUser.isFainted || potentialUser.ability !== 'opportunist') {
        return;
    }

    // Verifica se a habilidade está suprimida pelo Gás Neutralizante
    if (!NeutralizingGas.canAbilityTrigger(potentialUser, state)) {
        return;
    }

    // Apenas copia aumentos
    if (amount <= 0) return;

    const currentStage = potentialUser.statStages[statKey];
    if (currentStage < 6) {
        const finalIncrease = Math.min(amount, 6 - currentStage);
        if (finalIncrease > 0) {
            potentialUser.statStages[statKey] += finalIncrease;
            const statNamePT = STAT_NAMES_PT[statKey] || statKey;
            log(logs, `${potentialUser.name} copiou o aumento de ${statNamePT} com Oportunista!`, 'text-indigo-600 font-bold italic');
        }
    }
}
