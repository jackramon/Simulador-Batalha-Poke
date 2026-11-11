
import { Pokemon, Move, BattleState } from '../../../../types';

export function getFairyWindPower(
    attacker: Pokemon,
    basePower: number,
    state?: BattleState
): number {
    // Vento de Fada é um movimento básico de 40 de poder.
    // Não tem efeitos secundários complexos além de ser um movimento de Vento (Wind Move).
    // A lógica de Vento (Wind Power/Wind Rider) é tratada globalmente via categorias.
    return basePower;
}
