
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

export function handleLaserFocus(attacker: Pokemon, logs: LogEntry[]) {
    // Aplica o status 'laser-focus'.
    // Duração: 2 turnos (Turno atual e o próximo).
    // O próximo ataque de dano será crítico garantido.
    attacker.statusEffects['laser-focus'] = { turns: 2 };
    
    log(logs, `${attacker.name} concentrou-se intensamente!`, 'text-orange-600 font-bold');
}

export function handleLaserFocusTurnEnd(pokemon: Pokemon) {
    if (pokemon.statusEffects['laser-focus']) {
        pokemon.statusEffects['laser-focus'].turns--;
        if (pokemon.statusEffects['laser-focus'].turns <= 0) {
            delete pokemon.statusEffects['laser-focus'];
        }
    }
}
