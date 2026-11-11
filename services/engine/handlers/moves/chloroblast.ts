
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { checkConsumableItems } from '../../../handlers/items';

/**
 * Lógica para o movimento Explosão de Clorofila (Chloroblast).
 * Regra Oficial: 
 * 1. O usuário sofre dano de recuo igual a 50% do seu HP Máximo (arredondado para cima).
 * 2. O recuo ocorre mesmo se o ataque errar, desde que o movimento seja executado.
 * 3. Habilidade Magic Guard previne esse dano.
 */
export function handleChloroblastRecoil(
    attacker: Pokemon, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.ability === 'magic-guard') return;

    // Recuo de 50% do HP Máximo (Arredondado para cima)
    const recoil = Math.ceil(attacker.maxHP / 2);
    
    attacker.hp = Math.max(0, attacker.hp - recoil);
    
    log(logs, BATTLE_MESSAGES.SACRIFICE_RECOIL(attacker.name, recoil), 'text-red-600 font-bold');
    
    // Verifica se ativou itens (ex: Sitrus Berry) após o dano de recuo
    checkConsumableItems(attacker, logs as any, state);
}
