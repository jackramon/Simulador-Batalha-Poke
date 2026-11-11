
import { Pokemon, BattleState } from '../../types';
import { log, LogEntry } from '../engine/utils';
import * as EntryAbilities from '../engine/handlers/abilities/entry';
import * as ZenMode from '../engine/handlers/abilities/zen_mode';
import * as OwnTempo from '../engine/handlers/abilities/own_tempo';
import * as Rage from '../engine/handlers/moves/rage';
import * as NeutralizingGas from '../engine/handlers/abilities/neutralizing_gas';
import * as GulpMissile from '../engine/handlers/abilities/gulp_missile';
import * as MoldBreaker from '../engine/handlers/abilities/mold_breaker';
import * as AngerPoint from '../engine/handlers/abilities/anger_point';
import * as AngerShell from '../engine/handlers/abilities/anger_shell';
import * as SteamEngine from '../engine/handlers/abilities/steam_engine';
import * as Justified from '../engine/handlers/abilities/justified';
import * as WaterCompaction from '../engine/handlers/abilities/water_compaction';
import * as Electromorphosis from '../engine/handlers/abilities/electromorphosis';
import * as WindPower from '../engine/handlers/abilities/wind_power';
import * as ThermalExchange from '../engine/handlers/abilities/thermal_exchange';
import * as ToxicDebris from '../engine/handlers/abilities/toxic_debris';
import * as SandSpit from '../engine/handlers/abilities/sand_spit';
import * as SeedSower from '../engine/handlers/abilities/seed_sower';
import * as CottonDown from '../engine/handlers/abilities/cotton_down';
import * as Rattled from '../engine/handlers/abilities/rattled';
import * as ColorChange from '../engine/handlers/abilities/color_change';

export const handleEntryAbilities = (
    pokemon: Pokemon, 
    opponent: Pokemon | null, 
    weatherEnabled: boolean, 
    logs: LogEntry[], 
    state: BattleState,
    lastPokemon: Pokemon | null = null
) => {
    const res = EntryAbilities.handleEntryAbilities(pokemon, opponent, weatherEnabled, logs as any, state, lastPokemon);
    ZenMode.checkZenMode(pokemon, logs as any);
    OwnTempo.checkOwnTempo(pokemon, logs as any);
    return res;
};

export const checkOnHitAbilities = (defender: Pokemon, attacker: Pokemon, move: any, logs: LogEntry[], state: BattleState, initialHp?: number, isCrit: boolean = false) => {
    // Efeito do Movimento Fúria (Rage) - Ao ser atingido, aumenta o ataque
    Rage.handleRageOnHit(defender, logs as any);

    if (!NeutralizingGas.canAbilityTrigger(defender, state)) return;

    GulpMissile.handleGulpMissileCounter(defender, attacker, logs as any, state);

    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);
    if (ignoresAbilities) return;

    AngerPoint.triggerAngerPoint(defender, isCrit, logs as any);

    if (initialHp !== undefined) {
        AngerShell.handleAngerShell(defender, initialHp, logs as any);
    }

    if (defender.ability === 'stamina' && defender.statStages.defense < 6) {
        defender.statStages.defense++;
        log(logs, `Vigor de ${defender.name} aumentou sua Defesa!`, 'text-green-600');
    }
    
    SteamEngine.triggerSteamEngine(defender, move, logs as any);
    if (defender.ability === 'justified' && move.type === 'dark') Justified.triggerJustified(defender, logs);
    if (defender.ability === 'water-compaction' && move.type === 'water') WaterCompaction.triggerWaterCompaction(defender, logs);
    if (defender.ability === 'electromorphosis') Electromorphosis.triggerElectromorphosis(defender, logs as any);
    
    WindPower.handleWindPower(defender, move, logs as any);

    ThermalExchange.triggerThermalExchange(defender, move, logs as any);
    if (defender.ability === 'toxic-debris' && move.damageClass === 'physical') ToxicDebris.triggerToxicDebris(defender, state, logs as any);
    if (defender.ability === 'sand-spit') SandSpit.handleSandSpit(defender, state, logs as any);
    
    if (move.damageClass !== 'status') {
        SeedSower.handleSeedSower(defender, state, logs as any);
        CottonDown.handleCottonDown(defender, attacker, state, logs as any);
    }

    if (defender.ability === 'weak-armor' && move.damageClass === 'physical') {
        let changed = false;
        if (defender.statStages.defense > -6) { defender.statStages.defense--; changed = true; }
        if (defender.statStages.speed < 6) { defender.statStages.speed = Math.min(6, defender.statStages.speed + 2); changed = true; }
        if (changed) log(logs, `A Armadura Frágil de ${defender.name} reduziu sua Defesa e aumentou muito sua Velocidade!`, 'text-orange-600 font-bold');
    }

    if (defender.ability === 'rattled' && ['bug', 'ghost', 'dark'].includes(move.type)) {
        Rattled.triggerRattled(defender, logs, "o golpe");
    }

    ColorChange.handleColorChange(defender, move, logs as any);
};
