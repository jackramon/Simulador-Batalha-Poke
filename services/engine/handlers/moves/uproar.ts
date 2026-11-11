
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

const UPROAR_TURNS = 3;

/**
 * Inicia o efeito da Algazarra.
 * Trava o usuário no movimento e define o status de uproar.
 */
export function handleUproarStart(attacker: Pokemon, logs: {message: string, color: string}[]) {
    if (!attacker.statusEffects['uproar']) {
        attacker.statusEffects['uproar'] = { turns: UPROAR_TURNS };
        attacker.lockedMove = 'uproar';
        log(logs, BATTLE_MESSAGES.UPROAR_START(attacker.name), 'text-red-600 font-bold italic');
    }
}

/**
 * Processa a contagem de turnos da Algazarra.
 * Chamado na etapa de validação pré-movimento.
 */
export function processUproarLock(attacker: Pokemon, logs: {message: string, color: string}[]) {
    if (attacker.isFainted) return;

    if (attacker.statusEffects['uproar']) {
        attacker.statusEffects['uproar'].turns--;

        // Se falta 1 turno (ou menos) para acabar, libera a trava de movimento
        // Isso permite que no próximo turno (Turno 4) o jogador possa escolher um movimento.
        // O status 'uproar' ainda persiste durante este último ataque para impedir o sono.
        if (attacker.statusEffects['uproar'].turns <= 1) {
            attacker.lockedMove = null;
        }
    }
}

/**
 * Finaliza o efeito de Algazarra no final do turno.
 * Chamado em turnEnd.ts.
 */
export function handleUproarTurnEnd(attacker: Pokemon, logs: {message: string, color: string}[]) {
    if (attacker.statusEffects['uproar']) {
        // Se a contagem chegou a 1 (após o decremento no pré-move), significa que este foi o último turno.
        // O status deve ser removido agora.
        if (attacker.statusEffects['uproar'].turns <= 1) {
            delete attacker.statusEffects['uproar'];
            log(logs, BATTLE_MESSAGES.UPROAR_END(attacker.name), 'text-gray-500 italic');
        }
    }
}

/**
 * Verifica se a Algazarra está ativa em qualquer Pokémon no campo.
 */
export function isUproarActive(state: BattleState): boolean {
    const p1 = state.currentPokemon1;
    const p2 = state.currentPokemon2;

    const p1Active = p1 && !p1.isFainted && !!p1.statusEffects['uproar'];
    const p2Active = p2 && !p2.isFainted && !!p2.statusEffects['uproar'];

    return !!(p1Active || p2Active);
}

/**
 * Acorda todos os Pokémon no campo se a Algazarra estiver ativa.
 */
export function wakeUpEveryone(state: BattleState, logs: {message: string, color: string}[]) {
    [state.currentPokemon1, state.currentPokemon2].forEach(p => {
        if (p && !p.isFainted && p.statusEffects.sleep) {
            delete p.statusEffects.sleep;
            log(logs, BATTLE_MESSAGES.UPROAR_WAKE(p.name), 'text-blue-600 font-bold');
        }
    });
}
