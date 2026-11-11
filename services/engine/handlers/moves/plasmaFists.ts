import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o efeito secundário de Plasma Fists.
 * Torna todos os movimentos do tipo Normal em Elétrico pelo resto do turno.
 */
export function handlePlasmaFistsEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state: BattleState
) {
    // Aplica o status 'plasma-fists' em ambos os Pokémon ativos
    // Este status é verificado no movePipeline.ts para alterar o tipo dos movimentos
    
    // Aplica no atacante (caso ele use outro movimento, ex: Dancer, ou em Doubles)
    attacker.statusEffects['plasma-fists'] = { turns: 1 };
    
    // Aplica no defensor (principal alvo do efeito em Singles)
    if (!defender.isFainted) {
        defender.statusEffects['plasma-fists'] = { turns: 1 };
    }

    log(logs, `Uma chuva de íons cobriu o campo de batalha!`, 'text-yellow-500 font-bold italic');
}
