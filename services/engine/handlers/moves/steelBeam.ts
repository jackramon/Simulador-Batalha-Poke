
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import { checkConsumableItems } from '../../../handlers/items';

/**
 * Lógica para o movimento Raio de Aço (Steel Beam).
 * Regra Oficial: 
 * 1. O usuário sofre dano de recuo igual a 50% do seu HP Máximo (arredondado para cima).
 * 2. O recuo ocorre mesmo se o ataque errar, falhar ou for protegido, desde que o movimento seja executado.
 * 3. Habilidade Magic Guard previne esse dano.
 * 4. Habilidade Rock Head NÃO previne esse dano.
 */
export function handleSteelBeamRecoil(
    attacker: Pokemon, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // Magic Guard previne danos indiretos/recuo
    if (attacker.ability === 'magic-guard') return;

    // Recuo de 50% do HP MÁXIMO (Regra Oficial: Rounded Up)
    // Nota: NÃO é baseado no HP atual, e NÃO é baseado no dano causado.
    const recoil = Math.ceil(attacker.maxHP / 2);
    
    // Aplica o dano
    attacker.hp = Math.max(0, attacker.hp - recoil);
    
    log(logs, BATTLE_MESSAGES.SACRIFICE_RECOIL(attacker.name, recoil), 'text-red-600 font-bold');
    
    // Verifica se ativou itens (ex: Sitrus Berry) após o dano de recuo
    checkConsumableItems(attacker, logs as any, state);
    
    // O desmaio é tratado no ciclo principal se HP chegar a 0, 
    // mas a flag isFainted pode ser setada pelo chamador (pipeline) se hp == 0
}
