
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Aromaterapia (Aromatherapy).
 * Regra Oficial: Cura todas as condições de status não-voláteis de todos os Pokémon da equipe do usuário.
 * Diferente de Heal Bell, não é um movimento de som, portanto não é bloqueado por Soundproof.
 */
export function handleAromatherapy(
    attacker: Pokemon, 
    logs: LogEntry[], 
    state: BattleState
) {
    if (attacker.isFainted) return;

    // Identifica a equipe do usuário
    const isP1 = state.team1.some(p => p.id === attacker.id);
    const team = isP1 ? state.team1 : state.team2;

    let curedCount = 0;
    const statusKeys = ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'];

    team.forEach(p => {
        // Verifica se o Pokémon tem condições de status para curar
        const hasStatus = statusKeys.some(s => !!p.statusEffects[s]);
        
        if (hasStatus) {
            // Aromaterapia cura independentemente de Soundproof
            statusKeys.forEach(s => delete p.statusEffects[s]);
            curedCount++;
        }
    });

    if (curedCount > 0) {
        log(logs, `Um aroma calmante curou as condições de status da equipe!`, 'text-green-600 font-bold');
    } else {
        log(logs, `Um aroma calmante se espalhou, mas não teve efeito...`, 'text-gray-500 italic');
    }
}
