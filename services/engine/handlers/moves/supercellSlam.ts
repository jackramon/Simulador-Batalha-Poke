
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { checkConsumableItems } from '../../../handlers/items';

/**
 * Aplica o dano de colisão (Crash Damage) ao usuário.
 * Usado por: Colisão Supercélula (Supercell Slam), Voadora Alta (High Jump Kick), Chute Pulo (Jump Kick).
 * Regra: O usuário perde 50% do seu HP Máximo se o golpe falhar (Miss, Imunidade, Protect).
 */
export function handleCrashDamage(
    attacker: Pokemon, 
    logs: {message: string, color: string}[], 
    state?: BattleState
) {
    // Calcula 50% do HP Máximo
    const crashDmg = Math.floor(attacker.maxHP / 2);
    
    // Aplica o dano
    attacker.hp = Math.max(0, attacker.hp - crashDmg);
    
    log(logs, BATTLE_MESSAGES.CRASH_DAMAGE(attacker.name, crashDmg), 'text-red-600 font-bold');
    
    // Verifica se ativou itens (ex: Berry) após o dano
    checkConsumableItems(attacker, logs as any, state);
    
    // Verifica desmaio
    if (attacker.hp === 0) {
        attacker.isFainted = true;
    }
}
