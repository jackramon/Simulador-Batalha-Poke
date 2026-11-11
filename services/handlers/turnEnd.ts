
import { Pokemon, BattleState } from '../../types';
import { log, LogEntry } from '../engine/utils';
import { checkConsumableItems } from './items';

import * as AirLock from '../engine/handlers/abilities/air_lock';
import * as NeutralizingGas from '../engine/handlers/abilities/neutralizing_gas';
import * as Forms from '../engine/handlers/abilities/forms';
import * as ZenMode from '../engine/handlers/abilities/zen_mode';
import * as OwnTempo from '../engine/handlers/abilities/own_tempo';
import * as ShedSkin from '../engine/handlers/abilities/shed_skin';
import * as IceBody from '../engine/handlers/abilities/ice_body';
import * as RainDish from '../engine/handlers/abilities/rain_dish';
import * as IceFace from '../engine/handlers/abilities/ice_face';
import * as Forecast from '../engine/handlers/abilities/forecast';
import * as Harvest from '../engine/handlers/abilities/harvest';
import * as Hydration from '../engine/handlers/abilities/hydration';
import * as BallFetch from '../engine/handlers/abilities/ball_fetch';
import * as Pickup from '../engine/handlers/abilities/pickup';
import * as HoneyGather from '../engine/handlers/abilities/honey_gather';
import * as Healer from '../engine/handlers/abilities/healer';
import * as SlowStart from '../engine/handlers/abilities/slow_start';
import * as Moody from '../engine/handlers/abilities/moody';
import * as BadDreams from '../engine/handlers/abilities/bad_dreams';
import * as SolarPower from '../engine/handlers/abilities/solar_power';
import * as CudChew from '../engine/handlers/abilities/cud_chew';
import * as HungerSwitch from '../engine/handlers/abilities/hunger_switch';
import * as Terrain from '../engine/handlers/terrain';
import * as WeatherDamage from '../engine/handlers/moves/weather_damage';
import * as Klutz from '../engine/handlers/abilities/klutz';
import * as LeechSeed from '../engine/handlers/moves/leech_seed';
import * as PoisonHeal from '../engine/handlers/abilities/poison_heal';
import * as ThroatChop from '../engine/handlers/moves/throatChop';
import * as PerishSong from '../engine/handlers/moves/perish_song';
import * as FutureSight from '../engine/handlers/moves/futureSight';
import * as PartialTrapping from '../engine/handlers/moves/partialTrapping';
import * as AquaRing from '../engine/handlers/moves/aquaRing';
import * as Nightmare from '../engine/handlers/moves/nightmare';
import * as MirrorArmor from '../engine/handlers/abilities/mirror_armor';
import * as GuardDog from '../engine/handlers/abilities/guard_dog';
import * as PowerConstruct from '../engine/handlers/abilities/power_construct';

export const processTurnEndEffects = (pokemonList: (Pokemon | null)[], weather: BattleState['weather'], weatherEnabled: boolean, logs: LogEntry[], state?: BattleState) => {
    const isWeatherSuppressed = AirLock.isWeatherSuppressed(state);
    const effectiveWeather = isWeatherSuppressed ? 'none' : weather;

    const p1 = pokemonList[0];
    const p2 = pokemonList[1];

    pokemonList.forEach((p, index) => {
        if (p && !p.isFainted) {
            ThroatChop.handleThroatChopTurnEnd(p);
            PerishSong.handlePerishCount(p, logs as any);
            Nightmare.handleNightmareTurnEnd(p, logs as any);
            
            // Processa Visão do Futuro (causa dano se o contador zerar)
            if (state) {
                FutureSight.handleFutureSightEnd(p, state, logs as any);
            }

            // Processa Dano de Aprisionamento (Infestação, Fire Spin, etc)
            PartialTrapping.handleTrappingDamage(p, logs as any);

            const gasSuppressed = state ? !NeutralizingGas.canAbilityTrigger(p, state) : false;

            if (!gasSuppressed) {
                if (p.ability === 'speed-boost' && p.statStages.speed < 6) { p.statStages.speed++; log(logs, `Impulso de ${p.name} aumentou sua Velocidade!`, 'text-green-600'); }
                Forms.checkSchooling(p, logs as any);
                Forms.checkShieldsDown(p, logs as any);
                ZenMode.checkZenMode(p, logs as any);
                OwnTempo.checkOwnTempo(p, logs as any);
                ShedSkin.handleShedSkin(p, logs as any);

                if (weatherEnabled) {
                    if (p.ability === 'ice-body') IceBody.handleIceBody(p, effectiveWeather, logs as any);
                    if (p.ability === 'rain-dish') RainDish.handleRainDish(p, effectiveWeather, logs as any);
                    IceFace.checkIceFaceRestoration(p, effectiveWeather, logs as any);
                    // Forecast check at end of turn as failsafe
                    if (state) Forecast.handleForecast(p, state, logs as any);
                }
                
                Harvest.handleHarvest(p, effectiveWeather, logs as any);
                Hydration.handleHydration(p, effectiveWeather, logs as any);
                BallFetch.handleBallFetch(p, logs as any);
                
                if (state) Pickup.handlePickup(p, state, logs as any);
                if (state) HoneyGather.handleHoneyGather(p, state, logs as any);
                if (state) Healer.handleHealer(p, state, logs as any);
                SlowStart.checkRecovery(p, logs as any);
                Moody.handleMoody(p, logs as any);
                
                // Agrupamento (Power Construct)
                if (state) PowerConstruct.checkPowerConstruct(p, state, logs as any);

                const opponent = index === 0 ? p2 : p1;
                BadDreams.handleBadDreams(p, opponent, logs as any);

                if (weatherEnabled) {
                    SolarPower.handleSolarPowerDamage(p, effectiveWeather, logs as any);
                }

                CudChew.processCudChew(p, logs as any, state);
                HungerSwitch.handleHungerSwitch(p, logs as any);
            }

            if (state?.terrain === 'grassy' && Terrain.isGrounded(p) && p.hp < p.maxHP) {
                const heal = Math.floor(p.maxHP / 16) || 1;
                p.hp = Math.min(p.maxHP, p.hp + heal);
                log(logs, `${p.name} recuperou vida com a grama do campo!`, 'text-green-500 italic text-[10px]');
            }

            if (weatherEnabled && effectiveWeather === 'sun' && p.ability === 'dry-skin' && !gasSuppressed) p.hp = Math.max(0, p.hp - (Math.floor(p.maxHP / 8) || 1));
            if (weatherEnabled) WeatherDamage.handleWeatherDamage(p, effectiveWeather, logs as any);
            
            const itemsSuppressed = Klutz.isItemSuppressed(p, state);
            if (p.heldItem === 'leftovers' && p.hp < p.maxHP && !itemsSuppressed) {
                p.hp = Math.min(p.maxHP, p.hp + (Math.floor(p.maxHP / 16) || 1));
            }
            
            // Aqua Ring (Anel d'Água)
            AquaRing.handleAquaRingTurnEnd(p, logs as any, state);

            const opponent = index === 0 ? p2 : p1;
            LeechSeed.handleLeechSeed(p, opponent, logs as any);

            if (p.ability !== 'magic-guard') {
                if (p.statusEffects.burn) {
                    let dmg = Math.floor(p.maxHP / 16) || 1;
                    if (p.ability === 'heatproof' && !gasSuppressed) {
                        dmg = Math.floor(dmg / 2) || 1;
                    }
                    p.hp = Math.max(0, p.hp - dmg);
                    log(logs, `${p.name} sofreu ${dmg} de dano devido a Queimadura!`, 'text-red-500 italic text-xs');
                }

                const isPoisoned = !!(p.statusEffects.poison || p.statusEffects.toxic);
                if (isPoisoned) {
                    if (p.ability === 'poison-heal' && !gasSuppressed) {
                        PoisonHeal.handlePoisonHeal(p, logs as any);
                    } else {
                        if (p.statusEffects.poison) {
                            const dmg = Math.floor(p.maxHP / 8) || 1;
                            p.hp = Math.max(0, p.hp - dmg);
                            log(logs, `${p.name} sofreu ${dmg} de dano devido a Veneno!`, 'text-red-500 italic text-xs');
                        }
                        if (p.statusEffects.toxic) {
                            p.statusEffects.toxic.turns++;
                            const dmg = Math.floor(p.maxHP * Math.min(15, p.statusEffects.toxic.turns) / 16) || 1;
                            p.hp = Math.max(0, p.hp - dmg);
                            log(logs, `${p.name} sofreu ${dmg} de dano devido a Veneno Tóxico!`, 'text-red-500 italic text-xs');
                        }
                    }
                }
            }
            
            // --- LIMPEZA DE PROTEÇÕES DE TURNO ---
            // Remove status que duram apenas um turno ao final do processamento
            const protectionStatuses = [
                'protect', 'detect', 'endure', 'spiky-shield', 'kings-shield', 
                'baneful-bunker', 'obstruct', 'silk-trap', 'burning-bulwark',
                'plasma-fists', 'electrify'
            ];
            
            protectionStatuses.forEach(s => {
                if (p.statusEffects[s]) delete p.statusEffects[s];
            });

            checkConsumableItems(p, logs, state);
            if (p.hp === 0) { p.isFainted = true; log(logs, `${p.name} desmaiou!`, "text-indigo-800 font-bold"); }
        }
    });
};
