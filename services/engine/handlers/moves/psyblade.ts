import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Psyblade (Psicolâmina).
 * Poder base: 80.
 * Efeito: Poder aumenta em 50% se o Terreno Elétrico estiver ativo.
 */
export function getPsybladePower(
    attacker: Pokemon,
    basePower: number,
    state: BattleState | undefined,
    logs: LogEntry[]
): number {
    if (state?.terrain === 'electric') {
        log(logs, 'O Terreno Elétrico fortaleceu a lâmina psíquica!', 'text-yellow-500 font-bold');
        return basePower * 1.5;
    }
    return basePower;
}
