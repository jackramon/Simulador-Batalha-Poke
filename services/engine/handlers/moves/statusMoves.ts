
import { Pokemon, Move, BattleState, LogEntry } from '../../../../types';
import * as Effects from '../../../effectHandlers';
import * as PartialTrapping from './partialTrapping';
import { log } from '../../utils';

export function handleConditionMove(attacker: Pokemon, defender: Pokemon, move: Move, logs: LogEntry[], state?: BattleState) {
    if (!move.effect) return;
    
    if (move.effect.status === 'leech-seed') {
        // Regra Oficial: Tipos Grama são imunes à Semente Sanguessuga
        if (defender.types.includes('grass')) {
            log(logs, `Não afeta Pokémon do tipo Grama!`, 'text-gray-500 italic');
            return;
        }
        
        // Regra Oficial: Não pode infectar um alvo que já possui a semente
        if (defender.statusEffects['leech-seed']) {
            log(logs, `${defender.name} já está infectado!`, 'text-gray-500 italic');
            return;
        }

        Effects.applyStatus(defender, 'leech-seed', logs, attacker, false, state);
    } else if (PartialTrapping.isPartialTrappingMove(move)) {
        PartialTrapping.applyPartialTrapping(attacker, defender, move, logs);
    } else {
        Effects.applyStatus(defender, move.effect.status, logs, attacker, false, state);
    }
}
