
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Carga (Charge).
 * Regra Oficial: 
 * 1. Aumenta a Defesa Especial do usuário em 1 estágio.
 * 2. Aplica o estado "Carregado" (Charged), que dobra o poder do próximo movimento Elétrico.
 */
export function handleCharge(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // 1. Aumenta Defesa Especial em 1 estágio
    // isOpponentSource = false (Self-buff)
    StatChanges.applyMoveStatChange(
        attacker,
        'spDefense-up',
        logs,
        false, 
        false, // ignoresAbilities
        'charge',
        state
    );

    // 2. Aplica status 'charged'
    // Reutiliza a chave usada por Eletromorfose (Electromorphosis) e Energia Eólica (Wind Power)
    // O motor de dano (damageModifiers.ts e moves.ts) já está configurado para consumir este status.
    if (!attacker.statusEffects['charged']) {
        attacker.statusEffects['charged'] = { turns: -1 }; // Dura até ser consumido
        log(logs, `${attacker.name} começou a carregar energia!`, 'text-yellow-500 font-bold italic');
    } else {
        log(logs, `${attacker.name} continua carregando energia!`, 'text-yellow-600 italic');
    }
}
