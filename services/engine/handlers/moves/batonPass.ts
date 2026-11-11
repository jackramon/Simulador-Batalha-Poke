
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

export function handleBatonPass(
    attacker: Pokemon, 
    logs: {message: string, color: string}[],
    state: BattleState
): { switchRequested: boolean, isBatonPass: boolean } {
    
    // Identifica o time do atacante
    const isP1 = state.currentPokemon1?.id === attacker.id;
    const team = isP1 ? state.team1 : state.team2;

    // Verifica se há aliados vivos para passar
    const hasAliveMembers = team.some(p => !p.isFainted && p.id !== attacker.id);

    if (!hasAliveMembers) {
        log(logs, `Mas falhou! Não há ninguém para trocar.`, 'text-gray-500 italic');
        return { switchRequested: false, isBatonPass: false };
    }

    log(logs, `${attacker.name} vai passar o bastão!`, 'text-green-600 font-bold');
    
    // Retorna as flags que instruirão o motor (executeMove) a solicitar uma troca especial
    return {
        switchRequested: true,
        isBatonPass: true
    };
}
