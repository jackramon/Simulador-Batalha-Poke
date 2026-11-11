
import { Pokemon, Move } from '../../../../types';
import * as Psyshock from '../moves/psyshock';

/**
 * Lógica para a habilidade Casaco de Pele (Fur Coat).
 * Regra Oficial: Dobra a estatística de Defesa do Pokémon.
 * No cálculo de dano final, isso resulta em um multiplicador de 0.5x para movimentos
 * que atingem a Defesa física (Golpes físicos e Psyshock/Psystrike/Secret Sword).
 * Esta habilidade é ignorada por Mold Breaker, Teravolt e Turboblaze.
 */
export function getDamageMultiplier(defender: Pokemon, move: Move, ignoresAbilities: boolean): number {
    if (defender.ability !== 'fur-coat' || defender.isFainted || ignoresAbilities) {
        return 1.0;
    }

    // Verifica se o movimento atinge a Defesa Física
    const hitsDefense = move.damageClass === 'physical' || Psyshock.targetsPhysicalDefense(move.name);

    if (hitsDefense) {
        return 0.5;
    }

    return 1.0;
}
