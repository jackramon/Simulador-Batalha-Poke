
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

export function handleFocusEnergy(attacker: Pokemon, logs: LogEntry[]) {
    if (attacker.statusEffects['focus-energy']) {
        log(logs, `Mas falhou! ${attacker.name} já está concentrado.`, 'text-gray-500 italic');
        return;
    }

    attacker.statusEffects['focus-energy'] = { turns: -1 };
    log(logs, `${attacker.name} está bombeando energia!`, 'text-orange-600 font-bold');
}
