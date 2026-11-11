
import { Pokemon, BattleState } from '../../../../types';
import * as LongReach from './long_reach';
import { BattleEventBus } from '../../events/BattleEventBus';
import { 
    CONTACT_ABILITY_LISTENERS, 
    CONTACT_ITEM_LISTENERS, 
    beakBlastListener, 
    poisonTouchListener 
} from '../../events/listeners/contactListeners';

export function checkContactEffects(
    attacker: Pokemon, 
    defender: Pokemon, 
    hitsLanded: number, 
    isContact: boolean, 
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // Long Reach prevents all contact effects
    if (!isContact || defender.isFainted || LongReach.isContactSuppressed(attacker)) return;
    
    // 1. Instantiate Event Bus
    const bus = new BattleEventBus();

    // 2. Register Listeners Dynamically

    // A. Mechanics (Beak Blast)
    bus.subscribe('ON_CONTACT_HIT', beakBlastListener);

    // B. Items (Defender)
    if (defender.heldItem && CONTACT_ITEM_LISTENERS[defender.heldItem]) {
        bus.subscribe('ON_CONTACT_HIT', CONTACT_ITEM_LISTENERS[defender.heldItem]);
    }

    // C. Attacker Abilities (Poison Touch)
    // Registered before defender abilities to ensure Poison Touch triggers before Mummy/Lingering Aroma
    if (attacker.ability === 'poison-touch') {
        bus.subscribe('ON_CONTACT_HIT', poisonTouchListener);
    }

    // D. Defender Abilities (Static, Rough Skin, Mummy, etc)
    if (defender.ability && CONTACT_ABILITY_LISTENERS[defender.ability]) {
        bus.subscribe('ON_CONTACT_HIT', CONTACT_ABILITY_LISTENERS[defender.ability]);
    }

    // 3. Emit Event
    bus.emit('ON_CONTACT_HIT', {
        attacker,
        defender,
        hitsLanded,
        logs,
        state
    });
}
