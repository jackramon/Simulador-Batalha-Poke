
import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Saque Rápido (Quick Draw).
 * Regra Oficial: Tem 30% de chance de fazer o Pokémon se mover primeiro 
 * dentro de sua faixa de prioridade.
 * Isso é representado por um pequeno aumento fracionário na prioridade (+0.1),
 * o que permite superar outros movimentos de mesma prioridade mas mantém abaixo
 * de movimentos com prioridade +1 real.
 */
export function getPriorityBoost(pokemon: Pokemon, state: BattleState): number {
    if (pokemon.ability !== 'quick-draw' || pokemon.isFainted) {
        return 0;
    }

    // Respeita o Gás Neutralizante
    if (!NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return 0;
    }

    // 30% de chance de ativar
    if (Math.random() < 0.3) {
        return 0.1;
    }

    return 0;
}
