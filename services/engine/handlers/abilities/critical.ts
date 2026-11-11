
import { Pokemon, Move, BattleState } from '../../../../types';
import { HIGH_CRIT_MOVES } from '../../../../data/moves/categories';

/**
 * Verifica se um pokemon é imune a acertos críticos devido à sua habilidade ou efeitos de campo
 */
export function isImmuneToCritical(defender: Pokemon, ignoresAbilities: boolean, state?: BattleState): boolean {
    if (ignoresAbilities) return false;
    
    // Armadura de Batalha e Armadura de Concha têm o mesmo efeito
    if (defender.ability === 'battle-armor' || defender.ability === 'shell-armor') {
        return true;
    }

    // Verifica Lucky Chant (Canção da Sorte)
    if (state) {
        const isP1 = state.currentPokemon1?.id === defender.id;
        const hazards = isP1 ? state.p1Hazards : state.p2Hazards;
        
        if (hazards && hazards.luckyChant > 0) {
            return true;
        }
    }

    return false;
}

/**
 * Calcula o estágio de chance crítica do atacante.
 */
export function getCritStage(attacker: Pokemon, move: Move, itemsSuppressed: boolean): number {
    let stage = 0;
    
    // Bônus do Movimento (ex: Folha Navalha)
    if (HIGH_CRIT_MOVES.includes(move.name)) {
        stage++;
    }
    
    // Habilidade Super Sorte
    if (attacker.ability === 'super-luck') {
        stage++;
    }
    
    // Itens (Pedra do Rei no simulador atual, idealmente seria Scope Lens)
    if (attacker.heldItem === 'kings-rock' && !itemsSuppressed) {
        stage++;
    }
    
    // Foco de Energia (+2 Estágios)
    if (attacker.statusEffects['focus-energy']) {
        stage += 2;
    }

    // Dragon Cheer (+1 ou +2 Estágios)
    if (attacker.statusEffects['dragon-cheer']) {
        stage += (attacker.statusEffects['dragon-cheer'].damageAccumulated || 1);
    }
    
    return stage;
}
