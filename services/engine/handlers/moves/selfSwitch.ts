
import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para movimentos que trocam o usuário após o ataque (switch-self).
 * Exemplos: Volt Switch, U-turn, Flip Turn, Parting Shot.
 * Regra: Só permite a troca se houver aliados vivos na equipe.
 */
export function checkSelfSwitch(
    attacker: Pokemon, 
    move: Move, 
    team: Pokemon[], 
    logs: {message: string, color: string}[]
): boolean {
    // Adicionado suporte para parting-shot-effect
    if (move.effect?.status === 'switch-self' || move.effect?.status === 'parting-shot-effect') {
        const hasAliveMembers = team.some(p => !p.isFainted && p.id !== attacker.id);
        
        if (hasAliveMembers) {
            log(logs, BATTLE_MESSAGES.SWITCH_SELF(attacker.name), 'text-green-600 font-bold');
            return true;
        }
    }
    return false;
}
