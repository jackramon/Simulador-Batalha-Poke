
import { Pokemon, BattleState } from '../../types';
import { LogEntry } from '../engine/utils';
import * as Forms from '../engine/handlers/abilities/forms';
import * as Contact from '../engine/handlers/abilities/contact';
import * as StatusConditions from '../engine/handlers/effects/statusConditions';

export const checkSchooling = (pokemon: Pokemon, logs: LogEntry[]) => Forms.checkSchooling(pokemon, logs as any);
export const checkShieldsDown = (pokemon: Pokemon, logs: LogEntry[]) => Forms.checkShieldsDown(pokemon, logs as any);

// DELEGAÇÃO: A lógica central de status foi movida para engine/handlers/effects/statusConditions.ts
export const applyStatus = (
    target: Pokemon, 
    status: string, 
    logs: LogEntry[], 
    attacker?: Pokemon, 
    isFromSynchronize: boolean = false, 
    state?: BattleState
) => {
    StatusConditions.applyStatus(target, status, logs, attacker, isFromSynchronize, state);
};

export const checkContactEffects = (
    attacker: Pokemon, 
    defender: Pokemon, 
    hitsLanded: number, 
    isContact: boolean, 
    logs: LogEntry[],
    state?: BattleState
) => Contact.checkContactEffects(attacker, defender, hitsLanded, isContact, logs as any, state);
