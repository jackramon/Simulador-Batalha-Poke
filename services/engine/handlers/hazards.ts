
import { Pokemon, SideHazards, BattleState } from '../../../types';
import { log } from '../utils';
import { calculateTypeEffectiveness } from '../../battleUtils';
import * as Terrain from './terrain';
import * as StatChanges from './moves/statChanges';
import { BATTLE_MESSAGES } from '../../../data/battleMessages';

export function checkEntryHazards(
    pokemon: Pokemon, 
    sideHazards: SideHazards, 
    logs: {message: string, color: string}[],
    state: BattleState
) {
    if (pokemon.isFainted) return;

    // Heavy-Duty Boots (Botas Pesadas): Imunidade total a hazards
    if (pokemon.heldItem === 'heavy-duty-boots') {
        return;
    }

    const hasMagicGuard = pokemon.ability === 'magic-guard';

    // 1. Stealth Rock (Pedras Ocultas)
    if (sideHazards.stealthRock) {
        if (!hasMagicGuard) {
            // Calcula fraqueza a PEDRA
            const eff = calculateTypeEffectiveness('rock', pokemon.types, pokemon.ability);
            let damageFactor = 0.125; // Base 1/8 (12.5%)

            // Ajusta baseada na eficácia
            // 0.25x -> 1/32 (approx 3%)
            // 0.5x  -> 1/16 (6.25%)
            // 1x    -> 1/8  (12.5%)
            // 2x    -> 1/4  (25%)
            // 4x    -> 1/2  (50%)
            
            damageFactor *= eff.multiplier;

            if (damageFactor > 0) {
                const damage = Math.floor(pokemon.maxHP * damageFactor) || 1;
                pokemon.hp = Math.max(0, pokemon.hp - damage);
                log(logs, `Pontas de pedra feriram ${pokemon.name}!`, 'text-red-500 font-bold');
                
                if (pokemon.hp === 0) {
                    pokemon.isFainted = true;
                    log(logs, BATTLE_MESSAGES.FAINTED(pokemon.name), 'text-red-900 font-bold');
                    return; // Se desmaiou, para de processar hazards
                }
            }
        } else {
            // Magic Guard protege
        }
    }

    // 2. Spikes (Espinhos)
    if (sideHazards.spikes > 0) {
        // Afeta apenas quem toca o chão
        if (Terrain.isGrounded(pokemon) && !hasMagicGuard) {
            let damageFactor = 0;
            if (sideHazards.spikes === 1) damageFactor = 1/8;
            else if (sideHazards.spikes === 2) damageFactor = 1/6;
            else if (sideHazards.spikes >= 3) damageFactor = 1/4;

            const damage = Math.floor(pokemon.maxHP * damageFactor) || 1;
            pokemon.hp = Math.max(0, pokemon.hp - damage);
            log(logs, `${pokemon.name} foi ferido pelos espinhos!`, 'text-red-500 font-bold');

            if (pokemon.hp === 0) {
                pokemon.isFainted = true;
                log(logs, BATTLE_MESSAGES.FAINTED(pokemon.name), 'text-red-900 font-bold');
                return;
            }
        }
    }

    // 3. Toxic Spikes (Espinhos Tóxicos)
    if (sideHazards.toxicSpikes > 0) {
        if (Terrain.isGrounded(pokemon)) {
            // Se for Poison type e estiver no chão, absorve (remove) os Toxic Spikes
            if (pokemon.types.includes('poison')) {
                sideHazards.toxicSpikes = 0;
                log(logs, `${pokemon.name} absorveu os espinhos tóxicos do campo!`, 'text-purple-600 font-bold');
            } else if (!hasMagicGuard && !pokemon.types.includes('steel') && !pokemon.statusEffects.poison && !pokemon.statusEffects.toxic) {
                // Aplica veneno
                const status = sideHazards.toxicSpikes >= 2 ? 'toxic' : 'poison';
                
                if (pokemon.ability !== 'immunity' && !['poison', 'toxic', 'burn', 'paralysis', 'sleep', 'freeze'].some(s => pokemon.statusEffects[s])) {
                     pokemon.statusEffects[status] = { turns: 0 };
                     log(logs, `${pokemon.name} pisou nos espinhos tóxicos!`, 'text-purple-600');
                }
            }
        }
    }

    // 4. Sticky Web (Teia Pegajosa)
    if (sideHazards.stickyWeb) {
        if (Terrain.isGrounded(pokemon)) {
            log(logs, `${pokemon.name} ficou preso na teia pegajosa!`, 'text-purple-500 italic');
            // Reduz Speed em 1
            StatChanges.applyMoveStatChange(
                pokemon, 
                'speed-down', 
                logs, 
                true, 
                false, 
                'sticky-web', 
                state
            );
        }
    }
}

export function clearEntryHazards(hazards: SideHazards): void {
    hazards.stealthRock = false;
    hazards.spikes = 0;
    hazards.toxicSpikes = 0;
    hazards.stickyWeb = false;
}

export function clearScreens(hazards: SideHazards): void {
    hazards.reflect = 0;
    hazards.lightScreen = 0;
    hazards.auroraVeil = 0;
    hazards.safeguard = 0;
    hazards.mist = 0;
}
