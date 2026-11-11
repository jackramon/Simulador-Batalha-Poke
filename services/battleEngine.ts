
import { BattleState, Pokemon, Action, Move, BattleConfig, StatStages, LogEntry } from '../types';
import { getRawStat, calculateTypeEffectiveness, calculateHitChance, getEffectiveSpeed } from './battleUtils';
import { TWO_TURN_MOVES, RECHARGE_MOVES, DRAIN_MOVES } from '../data/moves';
import { WEATHER_DATA } from '../data/general';
import { STAT_NAMES_PT } from '../data/pokemon';
import * as Effects from './effectHandlers';

function log(logs: LogEntry[], message: string, color: string = 'text-gray-700') {
  logs.push({ message, color });
}

export function performSwitch(
  currentState: BattleState, 
  newPokemon: Pokemon, 
  playerNum: 1 | 2, 
  weatherEnabled: boolean
): { newState: BattleState, logs: LogEntry[] } {
  
  const logs: LogEntry[] = [];
  const state = { ...currentState };
  
  const oldPokemon = playerNum === 1 ? state.currentPokemon1 : state.currentPokemon2;
  
  if (oldPokemon) {
    oldPokemon.statStages = { accuracy: 0, evasion: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    oldPokemon.isFlinched = false;
    oldPokemon.turnsActive = 0;
    oldPokemon.chargingMove = null;
    oldPokemon.mustRecharge = false;
    oldPokemon.lockedMove = null;
    
    if (oldPokemon.ability === 'natural-cure' && Object.keys(oldPokemon.statusEffects).length > 0) {
      oldPokemon.statusEffects = {};
      log(logs, `${oldPokemon.name} curou seus status ao sair!`, 'text-blue-500');
    }
    if (oldPokemon.ability === 'regenerator' && !oldPokemon.isFainted) {
       const heal = Math.floor(oldPokemon.maxHP / 3);
       oldPokemon.hp = Math.min(oldPokemon.maxHP, oldPokemon.hp + heal);
       log(logs, `${oldPokemon.name} recuperou vida ao sair (Regenerador)!`, 'text-green-500');
    }
  }

  if (playerNum === 1) state.currentPokemon1 = newPokemon;
  else state.currentPokemon2 = newPokemon;

  log(logs, `${playerNum === 1 ? 'Jogador' : 'Oponente'} trocou para ${newPokemon.name}!`, playerNum === 1 ? 'text-green-700' : 'text-red-700');

  const opponent = playerNum === 1 ? state.currentPokemon2 : state.currentPokemon1;
  const effectRes = Effects.handleEntryAbilities(newPokemon, opponent, weatherEnabled, logs, state);
  
  if (effectRes.weather && weatherEnabled) {
    state.weather = effectRes.weather;
    state.weatherTurns = 5;
    if (newPokemon.heldItem === 'heat-rock' && state.weather === 'sun') state.weatherTurns = 8;
    if (newPokemon.heldItem === 'damp-rock' && state.weather === 'rain') state.weatherTurns = 8;
    if (newPokemon.heldItem === 'smooth-rock' && state.weather === 'sand') state.weatherTurns = 8;
    if (newPokemon.heldItem === 'icy-rock' && state.weather === 'hail') state.weatherTurns = 8;
  }

  return { newState: state, logs };
}

export function executeMove(
  currentState: BattleState, 
  attacker: Pokemon, 
  defender: Pokemon, 
  move: Move, 
  config: BattleConfig
): { newState: BattleState, logs: LogEntry[], fainted: boolean } {
  
  const logs: LogEntry[] = [];
  const state = { ...currentState };
  let fainted = false;

  if (move.name === 'recharge') {
      attacker.mustRecharge = false;
      log(logs, `${attacker.name} precisa recarregar!`, 'text-gray-500');
      return { newState: state, logs, fainted };
  }

  if (attacker.isFlinched) {
    log(logs, `${attacker.name} recuou e não atacou!`, 'text-yellow-600');
    attacker.isFlinched = false;
    return { newState: state, logs, fainted };
  }
  
  if (attacker.statusEffects.freeze) {
    if (Math.random() < 0.2 || (move.type === 'fire' || move.name === 'scald' || move.name === 'steam-eruption')) {
      delete attacker.statusEffects.freeze;
      log(logs, `${attacker.name} descongelou!`, 'text-blue-500');
    } else {
      log(logs, `${attacker.name} está congelado!`, 'text-blue-500');
      return { newState: state, logs, fainted };
    }
  }

  if (attacker.statusEffects.sleep) {
    attacker.statusEffects.sleep.turns = (attacker.statusEffects.sleep.turns || 0) + 1;
    if (attacker.statusEffects.sleep.turns >= (Math.floor(Math.random() * 3) + 1)) {
      delete attacker.statusEffects.sleep;
      log(logs, `${attacker.name} acordou!`, 'text-blue-500');
    } else {
       if (move.name !== 'snore' && move.name !== 'sleep-talk') {
        log(logs, `${attacker.name} está dormindo!`, 'text-blue-500');
        return { newState: state, logs, fainted };
       }
    }
  }

  if (attacker.statusEffects.confusion) {
    if (Math.random() < 0.25) {
       delete attacker.statusEffects.confusion;
       log(logs, `${attacker.name} não está mais confuso!`, 'text-yellow-600');
    } else {
      log(logs, `${attacker.name} está confuso!`, 'text-yellow-600');
      if (Math.random() < 0.33) {
         const confusionDmg = Math.floor(attacker.maxHP / 8) || 1;
         attacker.hp = Math.max(0, attacker.hp - confusionDmg);
         log(logs, `Ele se feriu na confusão! (-${confusionDmg})`, 'text-red-500');
         if (attacker.hp === 0) {
           attacker.isFainted = true;
           log(logs, `${attacker.name} desmaiou!`, 'text-red-900 font-bold');
           return { newState: state, logs, fainted: true };
         }
         return { newState: state, logs, fainted };
      }
    }
  }

  if (attacker.statusEffects.paralysis && Math.random() < 0.25) {
    log(logs, `${attacker.name} está paralisado e não pode se mover!`, 'text-yellow-500');
    return { newState: state, logs, fainted };
  }

  log(logs, `${attacker.name} usou ${move.displayName}!`, attacker === state.currentPokemon1 ? 'text-green-800 font-bold' : 'text-red-800 font-bold');

  const hitChance = calculateHitChance(move, attacker, defender, state.weather, state.gravity);
  if (hitChance !== '∞') {
    if (Math.random() * 100 > (hitChance as number)) {
      log(logs, `O ataque falhou!`, 'text-gray-500 italic');
      if (move.name === 'high-jump-kick' || move.name === 'jump-kick') {
        const crashDmg = Math.floor(attacker.maxHP / 2);
        attacker.hp = Math.max(0, attacker.hp - crashDmg);
        log(logs, `${attacker.name} continuou e se machucou! (-${crashDmg})`, 'text-red-600');
        if (attacker.hp === 0) attacker.isFainted = true;
      }
      return { newState: state, logs, fainted: attacker.isFainted };
    }
  }

  if (config.moveLimitEnabled) {
    move.uses = Math.max(0, move.uses - 1);
  }

  if (TWO_TURN_MOVES[move.name]) {
    if (!attacker.chargingMove) {
      attacker.chargingMove = move.name;
      const msg = TWO_TURN_MOVES[move.name].msg;
      log(logs, `${attacker.name} ${msg}`, 'text-blue-600');
      if (TWO_TURN_MOVES[move.name].status) {
         attacker.statusEffects[TWO_TURN_MOVES[move.name].status!] = { turns: 1 };
      }
      return { newState: state, logs, fainted };
    } else {
      attacker.chargingMove = null;
      if (TWO_TURN_MOVES[move.name].status) {
        delete attacker.statusEffects[TWO_TURN_MOVES[move.name].status!];
      }
    }
  }

  if (RECHARGE_MOVES.includes(move.name)) {
    attacker.mustRecharge = true;
  }

  if (move.damageClass === 'status') {
    if (move.effect) {
       const isSelfTarget = ['defense-up', 'spDefense-up', 'speed-up', 'evasion-up', 'accuracy-up', 'attack-up', 'heal'].some(k => move.effect?.status.includes(k)) || 
                          ['recover', 'roost', 'slack-off', 'soft-boiled', 'milk-drink', 'moonlight', 'morning-sun', 'synthesis', 'shore-up', 'heal-order'].includes(move.name) ||
                          ['swords-dance', 'dragon-dance', 'calm-mind', 'bulk-up', 'growth', 'hone-claws', 'nasty-plot', 'shell-smash', 'shift-gear', 'work-up', 'coil', 'cosmic-power', 'defend-order', 'iron-defense', 'acid-armor', 'amnesia', 'barrier', 'cotton-guard', 'agility', 'autotomize', 'rock-polish', 'double-team', 'minimize'].includes(move.name);
       
       const targetToApply = isSelfTarget ? attacker : defender;
       
       let immune = false;
       if (!isSelfTarget) {
         if (move.type === 'electric' && calculateTypeEffectiveness(move.type, defender.types, defender.ability).multiplier === 0) immune = true;
         if (move.type === 'ground' && calculateTypeEffectiveness(move.type, defender.types, defender.ability).multiplier === 0) immune = true;
         if (move.type === 'poison' && calculateTypeEffectiveness(move.type, defender.types, defender.ability).multiplier === 0) immune = true;
         if (defender.ability === 'good-as-gold') immune = true;
         if (defender.ability === 'magic-bounce') {
            log(logs, `O Espelho Mágico de ${defender.name} refletiu o movimento!`, 'text-purple-600');
            immune = true; 
         }
       }

       if (immune) {
          log(logs, `Não afetou ${targetToApply.name}...`, 'text-gray-500');
       } else {
         if (move.effect.status === 'weather') {
            if (move.name === 'sunny-day') { state.weather = 'sun'; log(logs, 'O sol ficou forte!', 'text-orange-500'); }
            if (move.name === 'rain-dance') { state.weather = 'rain'; log(logs, 'Começou a chover!', 'text-blue-500'); }
            if (move.name === 'sandstorm') { state.weather = 'sand'; log(logs, 'Uma tempestade de areia se formou!', 'text-yellow-600'); }
            if (move.name === 'hail') { state.weather = 'hail'; log(logs, 'Começou a cair granizo!', 'text-cyan-500'); }
            state.weatherTurns = 5;
         } else if (move.name === 'trick-room') {
            state.trickRoomActive = !state.trickRoomActive;
            state.trickRoomTurns = 5;
            log(logs, state.trickRoomActive ? 'O espaço distorceu!' : 'O espaço voltou ao normal!', 'text-purple-600');
         } else if (move.effect.status === 'leech-seed') {
           if (targetToApply.types.includes('grass')) {
             log(logs, `Não afeta tipos Grama!`, 'text-gray-500');
           } else {
             Effects.applyStatus(targetToApply, 'leech-seed', logs);
           }
         } else {
           if (move.effect.status.endsWith('-up') || move.effect.status.endsWith('-down')) {
             const statMap: any = { 
               'attack': 'attack', 'defense': 'defense', 'speed': 'speed', 
               'spDefense': 'spDefense', 'spAttack': 'spAttack',
               'accuracy': 'accuracy', 'evasion': 'evasion'
             };
             const parts = move.effect.status.split('-');
             const dir = parts.pop();
             const statName = parts.join('-');
             const ptStatName = STAT_NAMES_PT[statName] || statName;

             if (statMap[statName]) {
               const change = dir === 'up' ? (move.name === 'swords-dance' || move.name === 'nasty-plot' ? 2 : 1) : -1;
               const currentStage = targetToApply.statStages[statMap[statName] as keyof StatStages];
               if ((dir === 'up' && currentStage < 6) || (dir === 'down' && currentStage > -6)) {
                 targetToApply.statStages[statMap[statName] as keyof StatStages] += change;
                 log(logs, `${targetToApply.name} teve ${ptStatName} ${dir === 'up' ? 'aumentado' : 'reduzido'}!`, dir === 'up' ? 'text-green-600' : 'text-red-600');
               } else {
                 log(logs, `${targetToApply.name} não pode ter ${ptStatName} alterado mais!`, 'text-gray-500');
               }
             }
           } else {
             Effects.applyStatus(targetToApply, move.effect.status, logs);
           }
         }
         
         if (['recover', 'roost', 'slack-off', 'soft-boiled', 'milk-drink', 'moonlight', 'morning-sun', 'synthesis', 'shore-up', 'heal-order'].includes(move.name)) {
            let healAmount = Math.floor(attacker.maxHP / 2);
            if ((state.weather === 'sun' && ['moonlight', 'morning-sun', 'synthesis'].includes(move.name))) healAmount = Math.floor(attacker.maxHP * 0.66);
            else if ((state.weather !== 'none' && ['moonlight', 'morning-sun', 'synthesis'].includes(move.name))) healAmount = Math.floor(attacker.maxHP * 0.25);
            
            attacker.hp = Math.min(attacker.maxHP, attacker.hp + healAmount);
            log(logs, `${attacker.name} recuperou vida!`, 'text-green-600');
         }
       }
    }
    return { newState: state, logs, fainted };
  }

  let hits = 1;
  if (move.minHits && move.maxHits) {
    hits = Math.floor(Math.random() * (move.maxHits - move.minHits + 1)) + move.minHits;
    if (attacker.ability === 'skill-link') hits = move.maxHits;
  }

  let hitsLanded = 0;
  let totalDamage = 0;

  for (let i = 0; i < hits; i++) {
    const isCrit = Math.random() < 0.0417 && defender.ability !== 'battle-armor' && defender.ability !== 'shell-armor';
    
    let attackStat = move.damageClass === 'physical' ? getRawStat(attacker, 'attack', state.weather, state.terrain, false, defender.ability) : getRawStat(attacker, 'spAttack', state.weather, state.terrain, false, defender.ability);
    let defenseStat = move.damageClass === 'physical' ? getRawStat(defender, 'defense', state.weather, state.terrain, false, attacker.ability) : getRawStat(defender, 'spDefense', state.weather, state.terrain, false, attacker.ability);

    if (move.name === 'psyshock' || move.name === 'psystrike' || move.name === 'secret-sword') {
      defenseStat = getRawStat(defender, 'defense', state.weather, state.terrain, false, attacker.ability);
    }

    const level = 50;
    let damage = Math.floor(((2 * level / 5 + 2) * move.power * attackStat / defenseStat) / 50 + 2);

    if (attacker.types.includes(move.type)) {
      damage = Math.floor(damage * (attacker.ability === 'adaptability' ? 2 : 1.5));
      if (i === 0) log(logs, "Recebeu bônus de STAB!", "text-indigo-500 text-xs italic");
    }

    const eff = calculateTypeEffectiveness(move.type, defender.types, defender.ability);
    if (eff.immunityType) {
       if (i === 0) log(logs, eff.message, eff.color);
       hitsLanded = i;
       break;
    }

    if (attacker.statusEffects.burn && move.damageClass === 'physical' && attacker.ability !== 'guts' && move.name !== 'facade') {
      damage = Math.floor(damage * 0.5);
    }

    if (attacker.heldItem === 'life-orb') {
      damage = Math.floor(damage * 1.3);
      if (i === 0) log(logs, "Dano aumentado em 30% pela Esfera da Vida!", "text-pink-600 italic text-xs");
    }
    if (attacker.heldItem === 'expert-belt' && eff.multiplier >= 2) {
       damage = Math.floor(damage * 1.2);
    }

    if (defender.ability === 'thick-fat' && (move.type === 'fire' || move.type === 'ice')) {
      damage = Math.floor(damage * 0.5);
      if (i === 0) log(logs, `O Sebo de ${defender.name} reduziu o dano do ataque!`, 'text-blue-600 italic');
    }

    damage = Math.floor(damage * eff.multiplier);
    damage = Math.floor(damage * ((Math.random() * 0.15) + 0.85));

    if (damage < 1) damage = 1;
    
    if (isCrit) {
      damage = Math.floor(damage * 1.5);
    }

    defender.hp = Math.max(0, defender.hp - damage);
    hitsLanded++;
    totalDamage += damage;

    if (i === 0) {
       log(logs, eff.message, eff.color);
    }

    // New logging logic for Multi-Hit vs Single Hit
    if (hits > 1) {
        let msg = `Acerto ${i+1}: causou ${damage} de dano!`;
        if (isCrit) msg += " (Crítico!)";
        log(logs, msg, isCrit ? 'text-red-600 font-bold' : 'text-gray-700 font-medium');
    } else {
        if (isCrit) log(logs, "Um acerto crítico!", "text-red-600 font-bold");
        log(logs, `Causou ${damage} de dano!`, 'text-red-700 font-black text-lg');
    }

    if (move.recoilType === 'damage' && move.recoilValue) {
       const recoil = Math.floor(damage * move.recoilValue);
       attacker.hp = Math.max(0, attacker.hp - recoil);
       if (i === 0) log(logs, `${attacker.name} sofreu recuo! (-${recoil})`, 'text-red-500');
    }
    
    if (DRAIN_MOVES[move.name]) {
      const heal = Math.floor(damage * DRAIN_MOVES[move.name]);
      attacker.hp = Math.min(attacker.maxHP, attacker.hp + heal);
      if (i === 0) log(logs, `${attacker.name} drenou vida! (+${heal})`, 'text-green-500');
    }

    if (attacker.heldItem === 'life-orb' && i === hits - 1) {
       const loDmg = Math.floor(attacker.maxHP * 0.1);
       attacker.hp = Math.max(0, attacker.hp - loDmg);
       log(logs, `${attacker.name} perdeu vida pela Esfera da Vida!`, 'text-red-500');
    }

    if (defender.hp === 0 || attacker.hp === 0) break;
  }

  if (hits > 1) {
    log(logs, `Atingiu ${hitsLanded} vezes e causou ${totalDamage} de dano total!`, 'text-gray-800 font-black text-lg');
  }

  // Handle Secondary Effects
  if (move.effect && move.damageClass !== 'status' && defender.hp > 0 && attacker.hp > 0) {
    const chance = (move.effect.chance || 0) * (attacker.ability === 'serene-grace' ? 2 : 1);
    if (Math.random() * 100 < chance) {
       if (move.effect.status === 'flinch') {
         if (defender.ability !== 'inner-focus') {
          defender.isFlinched = true;
         }
       } else if (move.effect.status.endsWith('-up') || move.effect.status.endsWith('-down')) {
          // Handle Stat Changes for Damaging Moves (Stat secondary effects)
          const parts = move.effect.status.split('-');
          const dir = parts.pop();
          const statName = parts.join('-');
          const ptStatName = STAT_NAMES_PT[statName] || statName;
          
          const statMap: any = { 
            'attack': 'attack', 'defense': 'defense', 'speed': 'speed', 
            'spDefense': 'spDefense', 'spAttack': 'spAttack',
            'accuracy': 'accuracy', 'evasion': 'evasion'
          };
          
          // Heuristic: 'Up' usually targets user (e.g. Flame Charge), 'Down' usually targets enemy (e.g. Mud Slap)
          const target = dir === 'up' ? attacker : defender;

          if (statMap[statName]) {
             const change = dir === 'up' ? 1 : -1;
             
             let canChange = true;
             // Basic Immunity Logic
             if (target === defender && dir === 'down') {
                 if (['clear-body', 'white-smoke', 'full-metal-body'].includes(defender.ability)) {
                     log(logs, `${defender.name} previne redução de status!`, 'text-gray-500');
                     canChange = false;
                 }
                 if (statName === 'accuracy' && ['keen-eye', 'minds-eye'].includes(defender.ability)) {
                     log(logs, `${defender.name} tem visão aguçada!`, 'text-gray-500');
                     canChange = false;
                 }
                 if (statName === 'attack' && ['hyper-cutter'].includes(defender.ability)) {
                     log(logs, `${defender.name} previne redução de ataque!`, 'text-gray-500');
                     canChange = false;
                 }
                 if (defender.ability === 'big-pecks' && statName === 'defense') {
                     log(logs, `${defender.name} previne redução de defesa!`, 'text-gray-500');
                     canChange = false;
                 }
             }

             if (canChange) {
                 const currentStage = target.statStages[statMap[statName] as keyof StatStages];
                 if ((dir === 'up' && currentStage < 6) || (dir === 'down' && currentStage > -6)) {
                     target.statStages[statMap[statName] as keyof StatStages] += change;
                     log(logs, `${target.name} teve ${ptStatName} ${dir === 'up' ? 'aumentado' : 'reduzido'}!`, dir === 'up' ? 'text-green-600' : 'text-red-600');
                 } else {
                     log(logs, `${target.name} não pode ter ${ptStatName} alterado mais!`, 'text-gray-500');
                 }
             }
          }

       } else {
         // Handle Status Conditions (Burn, Poison, etc)
         // FIX: Previne que efeitos exclusivos do atacante sejam aplicados ao defensor
         const selfEffects = ['recoil', 'recoil-half', 'crash-damage', 'self-faint', 'heal', 'charge'];
         if (!selfEffects.includes(move.effect.status)) {
            Effects.applyStatus(defender, move.effect.status, logs);
         }
       }
    }
  }

  if (move.effect?.status === 'self-faint') {
    attacker.hp = 0;
    log(logs, `${attacker.name} se autodestruiu!`, 'text-red-900 font-bold');
  }

  const isContact = move.damageClass === 'physical' && !['earthquake', 'rock-slide', 'stone-edge', 'sludge-wave'].includes(move.name);
  Effects.checkContactEffects(attacker, defender, hitsLanded, isContact, logs);

  if (attacker.hp === 0) {
    attacker.isFainted = true;
    log(logs, `${attacker.name} desmaiou!`, 'text-red-900 font-bold');
    fainted = true;
  }
  if (defender.hp === 0) {
    defender.isFainted = true;
    log(logs, `${defender.name} desmaiou!`, 'text-red-900 font-bold');
  }

  return { newState: state, logs, fainted };
}

export function processTurnEnd(currentState: BattleState, config: BattleConfig): { newState: BattleState, logs: LogEntry[] } {
  const logs: LogEntry[] = [];
  const state = { ...currentState };

  if (state.weather !== 'none' && config.weatherEnabled) {
    state.weatherTurns--;
    if (state.weatherTurns <= 0) {
      // Dynamic Weather Logic: 
      // Instead of just clearing, there is a chance to clear or switch/renew weather
      // 30% chance to clear, 70% chance to pick a weather (including the current one)
      
      const teamSize = Math.max(state.team1.length, state.team2.length);
      let nextDuration = 3;
      if (teamSize >= 6) nextDuration = 10;
      else if (teamSize >= 3) nextDuration = 5;

      const randomCheck = Math.random();
      if (randomCheck < 0.3) {
           log(logs, `O clima ${WEATHER_DATA[state.weather].name} acabou!`, 'text-gray-500');
           state.weather = 'none';
      } else {
           const weathers = ['sun', 'rain', 'sand', 'hail'];
           const nextWeather = weathers[Math.floor(Math.random() * weathers.length)];
           
           state.weatherTurns = nextDuration;

           if (nextWeather !== state.weather) {
               state.weather = nextWeather as any;
               log(logs, `Os ventos mudaram! O clima agora é ${WEATHER_DATA[nextWeather].name}!`, 'text-blue-600 font-bold');
           } else {
               log(logs, `O clima ${WEATHER_DATA[state.weather].name} se intensificou novamente!`, 'text-blue-600 font-bold');
           }
      }
    } 
  }

  if (state.trickRoomActive) {
    state.trickRoomTurns--;
    if (state.trickRoomTurns <= 0) {
      state.trickRoomActive = false;
      log(logs, 'O espaço voltou ao normal!', 'text-purple-600');
    }
  }

  const allActive = [state.currentPokemon1, state.currentPokemon2];
  
  allActive.forEach(p => {
    if (p && !p.isFainted) p.turnsActive++;
  });

  Effects.processTurnEndEffects(allActive, state.weather, config.weatherEnabled, logs);

  state.turn++;

  return { newState: state, logs };
}