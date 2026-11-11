
import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Ferrão Mortal (Fell Stinger).
 * Regra Oficial: Se o usuário nocautear o oponente com este movimento,
 * seu Ataque aumenta drasticamente (3 estágios).
 */
export function handleFellStinger(attacker: Pokemon, move: Move, logs: {message: string, color: string}[]) {
    if (move.name === 'fell-stinger' && !attacker.isFainted) {
        if (attacker.statStages.attack < 6) {
            // Aumenta em 3 estágios (Drasticamente)
            const oldStage = attacker.statStages.attack;
            attacker.statStages.attack = Math.min(6, attacker.statStages.attack + 3);
            
            if (attacker.statStages.attack > oldStage) {
                log(logs, BATTLE_MESSAGES.FELL_STINGER_BOOST(attacker.name), 'text-green-600 font-black animate-pulse');
            }
        }
    }
}
