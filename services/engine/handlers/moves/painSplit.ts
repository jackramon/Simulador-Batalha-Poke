
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Dividir Dor (Pain Split).
 * Regra Oficial: Soma o HP atual do usuário e do alvo, divide por 2 (arredondado para baixo)
 * e define o HP de ambos para esse valor.
 */
export function handlePainSplit(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[]
) {
    if (attacker.isFainted || defender.isFainted) return;

    const totalHp = attacker.hp + defender.hp;
    const splitHp = Math.floor(totalHp / 2);

    // Atualiza HP do atacante (respeitando MaxHP)
    attacker.hp = Math.min(attacker.maxHP, splitHp);
    
    // Atualiza HP do defensor (respeitando MaxHP)
    defender.hp = Math.min(defender.maxHP, splitHp);

    log(logs, `Os combatentes dividiram sua dor!`, 'text-indigo-600 font-bold');
}
