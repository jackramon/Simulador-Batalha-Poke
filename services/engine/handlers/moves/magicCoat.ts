
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Casaco Mágico (Magic Coat).
 * Regra Oficial: Cobre o usuário com um véu mágico que reflete movimentos de status (como Toxic, Leech Seed, Taunt)
 * de volta para o atacante.
 * Prioridade: +4.
 * Duração: Apenas no turno de uso.
 */
export function handleMagicCoat(attacker: Pokemon, logs: LogEntry[]) {
    if (attacker.isFainted) return;

    // Falha se já estiver sob efeito de Magic Coat (embora a prioridade alta geralmente previna isso)
    if (attacker.statusEffects['magic-coat']) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    // Aplica o status de reflexão
    attacker.statusEffects['magic-coat'] = { turns: 1 };
    
    log(logs, `${attacker.name} se envolveu com um Casaco Mágico!`, 'text-pink-500 font-bold');
}
