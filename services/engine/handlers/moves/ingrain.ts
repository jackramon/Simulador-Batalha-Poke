
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

const INGRAIN_KEY = 'ingrain';

/**
 * Lógica para o movimento Enraizar (Ingrain).
 * Regras Oficiais:
 * 1. O usuário restaura 1/16 do HP Máximo no final de cada turno.
 * 2. O usuário não pode trocar de Pokémon (Trapped), a menos que use Baton Pass, U-turn, Volt Switch, etc.
 * 3. O usuário torna-se "Aterrado" (Grounded), sendo afetado por golpes de Terra e Terrenos,
 *    mesmo que seja Voador ou tenha Levitate.
 * 4. O usuário não pode ser forçado a sair por Roar, Whirlwind, Dragon Tail ou Circle Throw.
 */
export function handleIngrain(attacker: Pokemon, logs: LogEntry[]) {
    // Falha se já estiver enraizado
    if (attacker.statusEffects[INGRAIN_KEY]) {
        log(logs, `Mas falhou! ${attacker.name} já lançou suas raízes.`, 'text-gray-500 italic');
        return;
    }

    // Aplica o status
    // Duração: -1 (Infinito até o Pokémon desmaiar ou a batalha acabar. Não sai com troca normal pois troca é bloqueada)
    attacker.statusEffects[INGRAIN_KEY] = { turns: -1 };

    log(logs, `${attacker.name} lançou suas raízes no chão!`, 'text-green-700 font-bold');
}

/**
 * Verifica se o Pokémon está imune a trocas forçadas (Phazing) devido ao Ingrain.
 */
export function isImmuneToForcedSwitch(pokemon: Pokemon): boolean {
    return !!pokemon.statusEffects[INGRAIN_KEY];
}
