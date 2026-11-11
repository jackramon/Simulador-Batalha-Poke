
import { Pokemon, Move, BattleState, LogEntry } from '../../../types';
import { isContactMove } from '../../battleUtils';
import * as Effects from './effects/index';
import * as Contact from './abilities/contact';
import * as OnHit from '../../handlers/abilities';
import * as Knockout from './abilities/knockout';
import * as SelfSwitch from './moves/selfSwitch';

// RE-EXPORTA AS FUNÇÕES PRINCIPAIS AGORA GERENCIADAS PELOS ROTEADORES
export const handleStatusMove = Effects.handleStatusMove;
export const handleSecondaryEffects = Effects.handleSecondaryEffects;

// RE-EXPORTA HELPERS
export const handleImmunityAbility = Effects.handleImmunityAbility;
export const handleRecoil = Effects.handleRecoil;
export const handleDrain = Effects.handleDrain;
export const handleLifeOrbRecoil = Effects.handleLifeOrbRecoil;
export const handleSelfDestruct = Effects.handleSelfDestruct;

// FUNÇÕES QUE PERMANECEM COM LÓGICA PRÓPRIA OU DELEGADAS A OUTROS MODULOS
export function handleContactEffects(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    hitsLanded: number, 
    logs: LogEntry[],
    state?: BattleState
) {
    const isContact = isContactMove(move);
    Contact.checkContactEffects(attacker, defender, hitsLanded, isContact, logs, state);
}

export function handleOnHit(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    logs: LogEntry[], 
    state: BattleState, 
    initialHp?: number, 
    isCrit: boolean = false
) {
    OnHit.checkOnHitAbilities(defender, attacker, move, logs, state, initialHp, isCrit);
}

export function handleKnockoutAbilities(
    attacker: Pokemon, 
    defender: Pokemon, 
    move: Move, 
    logs: LogEntry[], 
    defenderInitialHp: number = 0, 
    state?: BattleState
) {
    Knockout.handleKnockoutAbilities(attacker, defender, move, logs, defenderInitialHp, state);
}

export function checkSelfSwitch(attacker: Pokemon, move: Move, team: Pokemon[], logs: LogEntry[]): boolean {
    return SelfSwitch.checkSelfSwitch(attacker, move, team, logs);
}
