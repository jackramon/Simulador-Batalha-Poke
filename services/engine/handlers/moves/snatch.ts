
import { Pokemon, Move, BattleState, LogEntry, BattleConfig } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Moves from '../../moves';

// Lista de movimentos que podem ser roubados pelo Snatch
// Inclui movimentos que aumentam stats ou curam o usuário/time
const SNATCHABLE_MOVES = [
    'recover', 'synthesis', 'moonlight', 'morning-sun', 'soft-boiled', 'swallow', 
    'wish', 'healing-wish', 'lunar-dance', 'tail-glow', 'cotton-guard', 'swords-dance', 
    'growth', 'meditate', 'agility', 'teleport', 'double-team', 'minimize', 
    'barrier', 'light-screen', 'reflect', 'mist', 'safeguard', 'magnet-rise', 
    'substitute', 'shell-smash', 'coil', 'bulk-up', 'calm-mind', 'nasty-plot', 
    'dragon-dance', 'rock-polish', 'hone-claws', 'quiver-dance', 'work-up', 
    'belly-drum', 'amnesia', 'acid-armor', 'iron-defense', 'cosmic-power', 
    'autotomize', 'shift-gear', 'stockpile', 'ingrain', 'aqua-ring', 'lucky-chant',
    'purify', 'shore-up', 'strengthen', 'stuff-cheeks', 'clangorous-soul', 'no-retreat',
    'victory-dance', 'take-heart', 'tidy-up', 'spicy-extract', 'fillet-away',
    'shed-tail', 'revival-blessing', 'recycle'
];

/**
 * Ativa o status de espera para roubar um movimento.
 * Prioridade: +4.
 */
export function handleSnatch(attacker: Pokemon, logs: LogEntry[]) {
    attacker.statusEffects['snatch-waiting'] = { turns: 1 };
    log(logs, BATTLE_MESSAGES.SNATCH_WAIT(attacker.name), 'text-indigo-600 font-bold italic');
}

/**
 * Verifica se um movimento é elegível para ser roubado.
 */
export function isSnatchable(move: Move): boolean {
    return SNATCHABLE_MOVES.includes(move.name);
}

/**
 * Verifica se o defensor (que usou Snatch anteriormente) deve roubar o movimento do atacante.
 * Se verdadeiro, executa o movimento usando o defensor como origem e retorna true.
 */
export function checkSnatchInterception(
    state: BattleState,
    attacker: Pokemon, // Quem está tentando usar o golpe (Vítima)
    defender: Pokemon, // Quem usou Snatch (Ladrão)
    move: Move,
    logs: LogEntry[],
    config: BattleConfig
): boolean {
    // Verifica se o defensor está esperando para roubar
    if (!defender.statusEffects['snatch-waiting'] || defender.isFainted) {
        return false;
    }

    // Verifica se o movimento é roubável
    if (!isSnatchable(move)) {
        return false;
    }

    // INTERCEPÇÃO
    log(logs, BATTLE_MESSAGES.SNATCH_SUCCESS(defender.name, attacker.name), 'text-purple-600 font-black italic text-lg');

    // Consome o status de espera para não roubar múltiplos golpes no mesmo turno (em duplas)
    // Em 1v1 isso acontece naturalmente no final do turno, mas é seguro remover.
    delete defender.statusEffects['snatch-waiting'];

    // O Ladrão executa o movimento
    // Nota: O alvo do movimento roubado depende do movimento.
    // A maioria dos snatchable moves são self-target (ex: Recover, Swords Dance).
    // Mas movimentos como Reflect afetam o campo do usuário.
    // Ao roubar, o efeito é aplicado ao Ladrão e seu campo.
    
    // Chamada recursiva para executar o movimento com o Ladrão como usuário
    // Passamos 'undefined' como defenderAction para evitar loops lógicos complexos
    Moves.executeMove(state, defender, attacker, move, config, undefined, false, false, false);

    return true;
}
