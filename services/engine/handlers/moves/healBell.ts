
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as Soundproof from '../abilities/soundproof';

/**
 * Lógica para o movimento Sino de Cura (Heal Bell).
 * Regra Oficial: Cura todas as condições de status não-voláteis de todos os Pokémon da equipe do usuário.
 * Pokémon com a habilidade À Prova de Som (Soundproof) não são afetados.
 */
export function handleHealBell(
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
            // Verifica imunidade por Soundproof
            // Heal Bell é um movimento de som, então Soundproof bloqueia o efeito mesmo sendo aliado/self.
            if (Soundproof.isImmune(p, 'heal-bell', false)) {
                // Não cura este membro específico
                return;
            }

            // Remove os status
            statusKeys.forEach(s => delete p.statusEffects[s]);
            curedCount++;
        }
    });

    if (curedCount > 0) {
        log(logs, `Um sino tocou! As condições de status da equipe foram curadas!`, 'text-green-600 font-bold');
    } else {
        log(logs, `Um sino tocou, mas não teve efeito...`, 'text-gray-500 italic');
    }
}
