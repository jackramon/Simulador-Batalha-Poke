import { Pokemon, Move, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Guarda Maravilha (Wonder Guard).
 * Regra Oficial: O Pokémon só pode ser atingido por movimentos Super Efetivos.
 * Movimentos de Status, dano de clima e condições de status NÃO são bloqueados.
 */
export function isImmune(
    defender: Pokemon, 
    typeMultiplier: number, 
    move: Move, 
    ignoresAbilities: boolean, 
    state?: BattleState
): boolean {
    if (defender.ability !== 'wonder-guard' || defender.isFainted || ignoresAbilities) {
        return false;
    }

    // Wonder Guard não protege contra movimentos de Status
    if (move.damageClass === 'status') {
        return false;
    }

    // Verifica se a habilidade está suprimida (ex: Gás Neutralizante)
    if (state && !NeutralizingGas.canAbilityTrigger(defender, state)) {
        return false;
    }

    // Só permite acertos se o multiplicador de tipo for maior que 1 (Super Efetivo)
    // Nota: Struggle ignora Wonder Guard desde a Gen 4, mas aqui tratamos como move comum se não especificado
    return typeMultiplier <= 1.0;
}
