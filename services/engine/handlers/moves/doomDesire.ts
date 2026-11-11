
import { Pokemon, BattleState, Move } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { calculateDamage } from '../damageUtils';

const DOOM_DESIRE_KEY = 'doom-desire';

/**
 * Inicia a contagem do Desejo Fatal.
 */
export function handleDoomDesireStart(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.statusEffects[DOOM_DESIRE_KEY] || defender.statusEffects['future-sight']) {
        log(logs, 'Mas falhou! Já existe um ataque previsto para este alvo.', 'text-gray-500 italic');
        return;
    }

    // Registra o status no alvo. 3 turnos para o impacto.
    defender.statusEffects[DOOM_DESIRE_KEY] = { 
        turns: 3, 
        sourceMoveName: attacker.id.toString() 
    };

    log(logs, BATTLE_MESSAGES.DOOM_DESIRE_START(attacker.name), 'text-indigo-600 font-bold italic');
}

/**
 * Processa a contagem e causa dano no final do turno.
 */
export function handleDoomDesireEnd(
    defender: Pokemon, 
    state: BattleState, 
    logs: {message: string, color: string}[]
) {
    if (!defender.statusEffects[DOOM_DESIRE_KEY] || defender.isFainted) return;

    defender.statusEffects[DOOM_DESIRE_KEY].turns--;

    if (defender.statusEffects[DOOM_DESIRE_KEY].turns <= 0) {
        delete defender.statusEffects[DOOM_DESIRE_KEY];
        
        log(logs, BATTLE_MESSAGES.DOOM_DESIRE_HIT(defender.name), 'text-gray-700 font-black text-lg');

        const isP1 = state.currentPokemon1?.id === defender.id;
        const attacker = isP1 ? state.currentPokemon2 : state.currentPokemon1;

        if (!attacker) return;

        const doomDesireMove: Move = {
            name: 'doom-desire',
            displayName: 'Desejo Fatal',
            type: 'steel',
            power: 140,
            accuracy: 100,
            damageClass: 'special',
            isStatus: false,
            uses: 0, maxUses: 0, description: ''
        };

        const damage = calculateDamage(
            attacker, 
            defender, 
            doomDesireMove, 
            state.weather, 
            false, 
            1.0, 
            0,   
            logs,
            state
        );

        if (damage > 0) {
            defender.hp = Math.max(0, defender.hp - damage);
            log(logs, BATTLE_MESSAGES.DAMAGE_DEALT(damage), 'text-red-700 font-bold');
            
            if (defender.hp === 0) {
                defender.isFainted = true;
                log(logs, BATTLE_MESSAGES.FAINTED(defender.name), 'text-red-900 font-bold');
            }
        } else {
            log(logs, 'Não afeta o alvo...', 'text-gray-500 italic');
        }
    }
}
