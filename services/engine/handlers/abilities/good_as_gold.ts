
import { Pokemon, Move } from '../../../../types';

/** Identificador oficial da habilidade (mesmo valor usado em data/abilities_data). */
export const ABILITY_ID = 'good-as-gold';

/**
 * Vale Ouro (Good as Gold).
 * Regra Oficial: o Pokémon é imune a movimentos da categoria Status usados por outros
 * Pokémon que tenham ele como alvo (`damageClass === 'status'`).
 *
 * - Quem decide "o alvo é este Pokémon" é o pipeline (`movePipeline.executeStatusMoveStep`):
 *   hazards, telas, Tailwind e efeitos do próprio usuário continuam valendo, porque não miram
 *   o portador. Curse de Fantasma, Defog, Memento e Strength Sap miram e são bloqueados.
 * - NÃO é ignorada por Mold Breaker, Teravolt ou Turboblaze (regra oficial).
 * - É suprimida por Gás Neutralizante e por Ácido Gástrico.
 */
export function isImmuneToStatusMove(defender: Pokemon, move: Move, isGasActive: boolean = false): boolean {
    if (defender.ability !== ABILITY_ID || defender.isFainted) {
        return false;
    }

    // Supressões: enquanto suprimida, a habilidade não existe para a regra.
    if (isGasActive || defender.statusEffects['gastro-acid']) {
        return false;
    }

    // A imunidade só se aplica a movimentos de categoria status (damageClass === 'status')
    return move.damageClass === 'status';
}
