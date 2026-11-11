
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

export function handleMindReader(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]) {
    if (defender.statusEffects['lock-on']) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    // Aplica o status de Trava de Mira no defensor
    // Duração: 2 turnos (O atual e o próximo).
    defender.statusEffects['lock-on'] = {
        turns: 2,
        sourceMoveName: attacker.id.toString() // Usa ID para identificar o atacante que mirou
    };

    log(logs, `${attacker.name} mirou em ${defender.name}!`, 'text-indigo-600 font-bold');
}

export function handleLockOnTurnEnd(pokemon: Pokemon) {
    if (pokemon.statusEffects['lock-on']) {
        pokemon.statusEffects['lock-on'].turns--;
        if (pokemon.statusEffects['lock-on'].turns <= 0) {
            delete pokemon.statusEffects['lock-on'];
        }
    }
}
