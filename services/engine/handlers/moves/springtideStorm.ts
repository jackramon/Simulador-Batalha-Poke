import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Handler para o efeito secundário de Springtide Storm.
 * 
 * Efeito:
 * - Se usado por Enamorus-Therian: 100% de chance de reduzir o Ataque do alvo em 1 estágio.
 * - Caso contrário (Incarnate): 30% de chance.
 */
export function handleSpringtideStormEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    const isTherian = attacker.name.includes('Therian') || attacker.name.includes('therian');
    const chance = isTherian ? 100 : 30;
    const sereneGraceMult = attacker.ability === 'serene-grace' ? 2 : 1;
    const finalChance = chance * sereneGraceMult;

    if (Math.random() * 100 < finalChance) {
        StatChanges.applyMoveStatChange(defender, 'attack-down', logs, true, false, 'springtide-storm', state);
    }
}
