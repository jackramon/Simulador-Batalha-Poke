
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Ticks de fim de turno dos efeitos temporários que ainda não tinham ciclo de vida.
 * Executados uma única vez por turno pela fonte canônica `processTurnEnd`.
 *
 * Regra: cada função decrementa o contador do efeito, remove o efeito ao chegar a zero
 * e nunca toca em dados que pertencem a outro efeito (por exemplo, `lockedMove` de
 * Choice Items, que é independente do Encore).
 */

const decrementTurns = (effect: { turns: number }, amount = 1): number => {
    effect.turns = Math.max(0, (effect.turns ?? 0) - amount);
    return effect.turns;
};

/** Provocação: bloqueia golpes de status por 3 turnos. */
export function handleTauntTurnEnd(pokemon: Pokemon, logs: LogEntry[]): void {
    const effect = pokemon.statusEffects['taunt'];
    if (!effect) return;

    if (decrementTurns(effect) > 0) return;

    delete pokemon.statusEffects['taunt'];
    log(logs, `${pokemon.name} não está mais provocado!`, 'text-gray-500 italic');
}

/**
 * Bis (Encore): força o último golpe por 3 turnos.
 * Ao expirar, apenas o bloqueio do Encore é removido; o `lockedMove` dos Choice Items
 * continua intacto e segue sendo limpo somente na troca ou por outro efeito que o remova.
 */
export function handleEncoreTurnEnd(pokemon: Pokemon, logs: LogEntry[]): void {
    const effect = pokemon.statusEffects['encore'];
    if (!effect) return;

    if (decrementTurns(effect) > 0) return;

    delete pokemon.statusEffects['encore'];
    log(logs, `${pokemon.name} não está mais sob efeito de Bis!`, 'text-pink-500 italic');
}

/**
 * Desativação (Disable): bloqueia um movimento específico por 4 turnos.
 * Cada entrada de `disabledMoves` é contada separadamente; ao zerar, apenas aquela
 * entrada é removida. Sem entradas restantes, o campo desaparece do estado, o que
 * mantém a canonicalização determinística (nunca sobra um objeto vazio).
 */
export function handleDisableTurnEnd(pokemon: Pokemon, logs: LogEntry[]): void {
    if (!pokemon.disabledMoves) return;

    const remaining: Record<string, number> = {};
    let expired = false;

    Object.entries(pokemon.disabledMoves).forEach(([moveName, turns]) => {
        const next = Math.max(0, (turns ?? 0) - 1);
        if (next > 0) remaining[moveName] = next;
        else expired = true;
    });

    if (Object.keys(remaining).length === 0) {
        delete pokemon.disabledMoves;
    } else {
        pokemon.disabledMoves = remaining;
    }

    if (expired) {
        log(logs, `${pokemon.name} não está mais com movimentos desativados!`, 'text-gray-500 italic');
    }
}

/** Levitação Magnética: 5 turnos de imunidade ao solo e aos golpes de Terra. */
export function handleMagnetRiseTurnEnd(pokemon: Pokemon, logs: LogEntry[]): void {
    const effect = pokemon.statusEffects['magnet-rise'];
    if (!effect) return;

    if (decrementTurns(effect) > 0) return;

    delete pokemon.statusEffects['magnet-rise'];
    log(logs, `${pokemon.name} não está mais levitando!`, 'text-yellow-600 italic');
}

/** Telecinesia: 3 turnos de imunidade ao solo e de precisão garantida para quem o ataca. */
export function handleTelekinesisTurnEnd(pokemon: Pokemon, logs: LogEntry[]): void {
    const effect = pokemon.statusEffects['telekinesis'];
    if (!effect) return;

    if (decrementTurns(effect) > 0) return;

    delete pokemon.statusEffects['telekinesis'];
    log(logs, `${pokemon.name} voltou ao chão após a telecinesia!`, 'text-purple-600 italic');
}

/**
 * Investida de Glaive: 2 turnos de vulnerabilidade do usuário.
 * Enquanto durar, os golpes recebidos não erram e causam dano dobrado; ao expirar,
 * o golpe volta a ser atingido pela checagem normal de precisão e de dano.
 */
export function handleGlaiveRushTurnEnd(pokemon: Pokemon, logs: LogEntry[]): void {
    const effect = pokemon.statusEffects['glaive-rush'];
    if (!effect) return;

    if (decrementTurns(effect) > 0) return;

    delete pokemon.statusEffects['glaive-rush'];
    log(logs, `${pokemon.name} voltou a se proteger!`, 'text-red-500 italic');
}
