
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Encharcar (Soak).
 * Categoria: Status.
 * Efeito: Muda o tipo do alvo para Água (Water) puro.
 * Falha se:
 * 1. O alvo já for puramente Água.
 * 2. O alvo tiver a habilidade Multitipo ou Sistema RKS.
 * 3. O alvo estiver Terastalizado.
 */
export function handleSoak(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Falha se o alvo tiver a habilidade Multitipo ou Sistema RKS
    // Arceus e Silvally não podem ter seu tipo alterado por movimentos externos.
    if (['multitype', 'rks-system'].includes(defender.ability)) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    // 2. Falha se o alvo estiver Terastalizado (Gen 9)
    if (defender.isTerastallized) {
        log(logs, `Mas falhou! O alvo está protegido pela energia Terastal.`, 'text-gray-500 italic');
        return;
    }

    // 3. Falha se o alvo já for puramente do tipo Água
    if (defender.types.length === 1 && defender.types[0] === 'water') {
        log(logs, `Mas falhou! ${defender.name} já é do tipo Água.`, 'text-gray-500 italic');
        return;
    }

    // Aplica a mudança de tipo
    defender.types = ['water'];
    
    // Remove "Terceiro Tipo" (Forest's Curse / Trick-or-Treat) se existir, resetando para array simples
    // A atribuição acima já cuida disso.

    log(logs, `${defender.name} transformou-se no tipo Água!`, 'text-blue-600 font-bold italic');
}
