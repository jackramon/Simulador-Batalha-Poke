
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Psicocâmbio (Psycho Shift).
 * Regras Oficiais:
 * 1. O usuário deve ter uma condição de status não-volátil (Burn, Poison, Toxic, Paralysis, Sleep, Freeze).
 * 2. O alvo não pode ter uma condição de status não-volátil.
 * 3. Tenta transferir o status para o alvo.
 * 4. Se a transferência for bem-sucedida (alvo não for imune), o usuário é curado.
 */
export function handlePsychoShift(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (attacker.isFainted || defender.isFainted) return;

    // Identifica o status do atacante
    const statuses = ['burn', 'poison', 'toxic', 'paralysis', 'sleep', 'freeze'];
    const activeStatus = statuses.find(s => !!attacker.statusEffects[s]);

    // Falha se o usuário não tiver status
    if (!activeStatus) {
        log(logs, `Mas falhou! ${attacker.name} não tem problemas de status para transferir.`, 'text-gray-500 italic');
        return;
    }

    // Falha se o alvo já tiver status
    const targetHasStatus = statuses.some(s => !!defender.statusEffects[s]);
    if (targetHasStatus) {
        log(logs, `Mas falhou! ${defender.name} já sofre de uma condição de status.`, 'text-gray-500 italic');
        return;
    }

    // Tenta aplicar o status no alvo
    // A função applyStatus lida com imunidades de tipo, habilidade e campo
    StatusConditions.applyStatus(defender, activeStatus, logs, attacker, false, state);

    // Verifica se a transferência foi bem sucedida
    // Se o defensor agora possui o status que tentamos passar
    if (defender.statusEffects[activeStatus]) {
        // Cura o atacante
        delete attacker.statusEffects[activeStatus];
        log(logs, `${attacker.name} transferiu seu problema de status e foi curado!`, 'text-green-600 font-bold');
    } else {
        // Se não conseguiu aplicar (imunidade), o movimento falha e o usuário não é curado
        log(logs, `Mas falhou! A transferência não funcionou.`, 'text-gray-500 italic');
    }
}
