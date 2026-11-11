
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

export function checkShellTrapFailure(attacker: Pokemon, logs: {message: string, color: string}[]): boolean {
    // Shell Trap só funciona se o usuário foi atingido por um ataque FÍSICO neste turno
    const tookPhysicalDamage = !!attacker.statusEffects['physical-damage-taken'];

    if (!tookPhysicalDamage) {
        log(logs, BATTLE_MESSAGES.SHELL_TRAP_FAIL(attacker.name), 'text-gray-500 italic');
        return true;
    }

    return false;
}
