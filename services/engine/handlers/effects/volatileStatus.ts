
import { Pokemon, Move, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as PartialTrapping from '../moves/partialTrapping';
import * as InnerFocus from '../abilities/inner_focus';
import { applyStatus } from './statusConditions';

export function handleVolatileStatus(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    status: string,
    logs: LogEntry[], 
    state?: BattleState
) {
    if (status === 'leech-seed') {
        if (defender.types.includes('grass')) {
            log(logs, `Não afeta Pokémon do tipo Grama!`, 'text-gray-500 italic');
            return;
        }
        
        if (defender.statusEffects['leech-seed']) {
            log(logs, `${defender.name} já está infectado!`, 'text-gray-500 italic');
            return;
        }

        applyStatus(defender, 'leech-seed', logs, attacker, false, state);
        if (defender.statusEffects['leech-seed']) {
            defender.statusEffects['leech-seed'].isVolatile = true;
            defender.statusEffects['leech-seed'].batonPassable = true;
            defender.statusEffects['leech-seed'].sourceId = attacker.name;
            defender.statusEffects['leech-seed'].turns = -1;
        }
    } 
    else if (PartialTrapping.isPartialTrappingMove(move)) {
        PartialTrapping.applyPartialTrapping(attacker, defender, move, logs);
    } 
    else {
        applyStatus(defender, status, logs, attacker, false, state);
    }
}

export function handleFlinch(
    defender: Pokemon,
    logs: LogEntry[],
    ignoresAbilities: boolean
) {
    if (!InnerFocus.isImmuneToFlinch(defender) || ignoresAbilities) {
        defender.isFlinched = true;
    } else {
        log(logs, `${defender.name} protegeu-se do recuo com seu Foco Interno!`, 'text-gray-500 italic text-xs');
    }
}
