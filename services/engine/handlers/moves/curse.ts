
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as StatChanges from '../effects/statChanges';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Maldição (Curse).
 * Efeito varia dependendo do tipo do usuário:
 * 
 * 1. Tipo FANTASMA (Ghost):
 *    - O usuário sacrifica 50% do seu HP Máximo (arredondado para baixo).
 *    - O alvo é amaldiçoado: perde 1/4 do HP Máximo ao final de cada turno.
 *    - Ignora acerto/evasiva e proteção (Protect/Detect) pois é um movimento que afeta o próprio usuário para lançar um status.
 * 
 * 2. NÃO-FANTASMA:
 *    - O usuário tem sua Velocidade reduzida em 1 estágio.
 *    - O usuário tem seu Ataque e Defesa aumentados em 1 estágio cada.
 */
export function handleCurse(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[], 
    state?: BattleState
) {
    // Verifica se o usuário é do tipo Fantasma (considerando Terastalização)
    const isGhost = attacker.isTerastallized 
        ? attacker.teraType === 'ghost' 
        : attacker.types.includes('ghost');

    if (isGhost) {
        // --- LÓGICA FANTASMA ---
        
        if (defender.isFainted) {
            log(logs, `Mas falhou! Não há alvo para amaldiçoar.`, 'text-gray-500 italic');
            return;
        }

        // Verifica se o alvo já está amaldiçoado
        if (defender.statusEffects['curse']) {
            log(logs, `Mas falhou! ${defender.name} já está amaldiçoado.`, 'text-gray-500 italic');
            return;
        }

        // Custo de HP: 50% do Máximo
        const hpCost = Math.floor(attacker.maxHP / 2);
        
        // Verifica se tem HP suficiente (se tiver exatamente 50% ou menos, desmaia)
        // O movimento funciona mesmo que o usuário desmaie.
        attacker.hp = Math.max(0, attacker.hp - hpCost);
        
        log(logs, `${attacker.name} cortou seu próprio HP e lançou uma maldição em ${defender.name}!`, 'text-purple-800 font-bold');

        if (attacker.hp === 0) {
            attacker.isFainted = true;
            log(logs, BATTLE_MESSAGES.FAINTED(attacker.name), 'text-red-900 font-bold');
        }

        // Aplica a Maldição no alvo
        defender.statusEffects['curse'] = { 
            turns: -1, // Dura até troca ou nocaute
            sourceMoveName: 'curse'
        };

    } else {
        // --- LÓGICA NÃO-FANTASMA ---
        
        if (attacker.isFainted) return;

        log(logs, `${attacker.name} usou Maldição para aumentar seu poder!`, 'text-gray-700 font-bold');

        // Reduz Velocidade (-1)
        StatChanges.applyMoveStatChange(
            attacker,
            'speed-down',
            logs,
            false, // isOpponentSource: false (self-inflicted)
            false,
            'curse',
            state
        );

        // Aumenta Ataque (+1)
        StatChanges.applyMoveStatChange(
            attacker,
            'attack-up',
            logs,
            false,
            false,
            'curse',
            state
        );

        // Aumenta Defesa (+1)
        StatChanges.applyMoveStatChange(
            attacker,
            'defense-up',
            logs,
            false,
            false,
            'curse',
            state
        );
    }
}
