
import { Pokemon, BattleState, StatStages } from '../../../../types';
import { log } from '../../utils';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Acupressão (Acupressure).
 * Regra Oficial: Aumenta drasticamente (2 estágios) um atributo aleatório do usuário.
 * Falha se todos os atributos já estiverem maximizados.
 */
export function handleAcupressure(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    const stats: (keyof StatStages)[] = ['attack', 'defense', 'spAttack', 'spDefense', 'speed', 'accuracy', 'evasion'];
    
    // Filtra stats que não estão no máximo (+6)
    const validStats = stats.filter(s => attacker.statStages[s] < 6);

    if (validStats.length === 0) {
        log(logs, `Mas falhou! Todos os atributos de ${attacker.name} estão no máximo.`, 'text-gray-500 italic');
        return;
    }

    // Escolhe um aleatório
    const randomStat = validStats[Math.floor(Math.random() * validStats.length)];
    
    // Converte chave do stat para o formato esperado por applyMoveStatChange (ex: 'attack' -> 'attack-up')
    const effectStatus = `${randomStat}-up`;

    // Aplica o aumento (+2)
    // O nome 'acupressure' é verificado em statChanges.ts para garantir magnitude 2
    StatChanges.applyMoveStatChange(
        attacker,
        effectStatus,
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'acupressure',
        state
    );
}
