
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Encolher (Defense Curl).
 * Regra Oficial: 
 * 1. Aumenta a Defesa do usuário em 1 estágio.
 * 2. Ativa um estado que dobra o poder de Rolo Compressor (Rollout) e Bola de Gelo (Ice Ball).
 */
export function handleDefenseCurl(
    attacker: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // 1. Aumenta Defesa em 1 estágio
    StatChanges.applyMoveStatChange(
        attacker,
        'defense-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'defense-curl',
        state
    );

    // 2. Ativa o flag para Rollout/Ice Ball
    // Esse efeito persiste enquanto o Pokémon estiver em campo
    if (!attacker.statusEffects['defense-curl-active']) {
        attacker.statusEffects['defense-curl-active'] = { turns: -1 };
    }
}
