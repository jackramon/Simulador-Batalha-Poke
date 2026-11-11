
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { checkConsumableItems } from '../../../handlers/items';

/**
 * Lógica para o movimento Explosão Mental (Mind Blown).
 * Regra Oficial: O usuário sofre dano de recuo igual a 50% do seu HP Máximo (arredondado para cima).
 * O recuo ocorre mesmo se o ataque errar ou o alvo proteger, desde que o movimento seja executado.
 */
export function handleMindBlownRecoil(
    attacker: Pokemon, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // Recuo de 50% do HP Máximo
    const recoil = Math.ceil(attacker.maxHP / 2);
    
    attacker.hp = Math.max(0, attacker.hp - recoil);
    
    log(logs, BATTLE_MESSAGES.SACRIFICE_RECOIL(attacker.name, recoil), 'text-red-600 font-bold');
    
    // Verifica se ativou itens (ex: Sitrus Berry) após o dano de recuo
    checkConsumableItems(attacker, logs as any, state);
    
    // Verifica desmaio se o HP chegar a 0
    if (attacker.hp === 0) {
        // A flag isFainted será processada pelo loop principal do motor ou turnEnd
        // mas marcamos aqui para consistência visual imediata se necessário
    }
}
