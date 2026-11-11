
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as StatChanges from './statChanges';

/**
 * Lógica para o movimento Cativar (Captivate).
 * Regra Oficial: 
 * 1. Reduz o Ataque Especial do alvo em 2 estágios.
 * 2. Funciona apenas se o alvo for do gênero oposto ao usuário.
 * 3. Falha se algum dos Pokémon não tiver gênero (genderless) ou se forem do mesmo gênero.
 * 4. A habilidade Insensível (Oblivious) protege contra este movimento.
 */
export function handleCaptivate(attacker: Pokemon, defender: Pokemon, logs: LogEntry[], state?: BattleState) {
    // 1. Verifica Gêneros
    if (attacker.gender === 'genderless' || defender.gender === 'genderless') {
        log(logs, `Mas falhou! Não afeta Pokémon sem gênero.`, 'text-gray-500 italic');
        return;
    }

    if (attacker.gender === defender.gender) {
        log(logs, `Mas falhou! Os gêneros não são compatíveis.`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica Habilidade Insensível (Oblivious)
    // Embora Captivate seja um movimento de redução de status, ele é tematicamente bloqueado por Oblivious.
    if (defender.ability === 'oblivious') {
         log(logs, `A habilidade Insensível de ${defender.name} protegeu-o de ser cativado!`, 'text-gray-500 italic text-xs');
         return;
    }

    // 3. Aplica Redução de Atq. Especial (-2)
    // A magnitude é tratada em statChanges.ts ao reconhecer o nome 'captivate'
    StatChanges.applyMoveStatChange(
        defender,
        'spAttack-down',
        logs,
        true, // isOpponentSource
        false, // ignoresAbilities (seria true se atacante tivesse Mold Breaker e chamasse via router, mas Captivate é status)
        'captivate',
        state
    );
}
