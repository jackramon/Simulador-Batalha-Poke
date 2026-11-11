
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Investida de Glaive (Glaive Rush).
 * Regra Oficial: O usuário se torna vulnerável até sua próxima ação.
 * Enquanto vulnerável:
 * 1. Ataques contra ele não podem errar (Sure Hit).
 * 2. Ataques contra ele causam o dobro do dano (2x).
 */
export function handleGlaiveRushEffect(attacker: Pokemon, logs: {message: string, color: string}[]) {
    if (attacker.isFainted) return;

    // Aplica o status de vulnerabilidade
    // Duração: 2 turnos para cobrir o turno atual (se atacou primeiro) e o próximo
    // até que ele aja novamente ou o turno acabe.
    attacker.statusEffects['glaive-rush'] = { turns: 2 };
    
    log(logs, BATTLE_MESSAGES.GLAIVE_RUSH_VULNERABLE(attacker.name), 'text-red-500 font-bold italic');
}
