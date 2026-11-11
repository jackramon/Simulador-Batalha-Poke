
import { BattleState, Pokemon, Move, BattleConfig, Action, LogEntry } from '../../types';
import { log } from './utils';
import { BATTLE_MESSAGES } from '../../data/battleMessages';
import * as MoveEffects from './handlers/moveEffects';
import { validateMoveExecution } from './steps/preMoveValidation';
import * as Effects from '../effectHandlers'; // For handleEntryAbilities

import * as AirLock from './handlers/abilities/air_lock';
import * as Klutz from './handlers/abilities/klutz';
import * as Dazzling from './handlers/abilities/dazzling';
import * as Dancer from './handlers/abilities/dancer';

import * as Snatch from './handlers/moves/snatch';
import * as SleepTalk from './handlers/moves/sleepTalk';
import * as Copycat from './handlers/moves/copycat';
import * as Metronome from './handlers/moves/metronome';
import * as MirrorMove from './handlers/moves/mirrorMove';
import * as MeFirst from './handlers/moves/meFirst';
import * as NaturePower from './handlers/moves/naturePower';
import * as Pipeline from './movePipeline';
import * as SkyDrop from './handlers/moves/skyDrop';

// --- MAPA ESTÁTICO DE SPRITES MEGA (Fallback para JIT) ---
// Fonte da Verdade para IDs de arte oficial da PokeAPI (Formas Mega)
const STATIC_MEGA_SPRITES: Record<string, number> = {
    'venusaur': 10033,
    'charizard': 10034, // Default X (Y tratado via item check)
    'blastoise': 10036,
    'alakazam': 10037,
    'gengar': 10038,
    'kangaskhan': 10039,
    'pinsir': 10040,
    'gyarados': 10041,
    'aerodactyl': 10042,
    'mewtwo': 10043, // Default X
    'ampharos': 10045,
    'scizor': 10046,
    'heracross': 10047,
    'houndoom': 10048,
    'tyranitar': 10049,
    'blaziken': 10050,
    'gardevoir': 10051,
    'mawile': 10052,
    'aggron': 10053,
    'medicham': 10054,
    'manectric': 10055,
    'banette': 10056,
    'absol': 10057,
    'garchomp': 10058,
    'lucario': 10059,
    'abomasnow': 10060,
    'beedrill': 10090,
    'pidgeot': 10073,
    'slowbro': 10071,
    'steelix': 10072,
    'sceptile': 10065,
    'swampert': 10064, // ID Correto PokeAPI (estava invertido com Altaria)
    'sableye': 10066,
    'sharpedo': 10070,
    'camerupt': 10087,
    'altaria': 10067, // ID Correto PokeAPI
    'glalie': 10074,
    'salamence': 10089,
    'metagross': 10076,
    'latias': 10062,
    'latios': 10063,
    'rayquaza': 10079,
    'lopunny': 10088,
    'gallade': 10068,
    'audino': 10069,
    'diancie': 10075
};

export function executeMove(
  currentState: BattleState, 
  attacker: Pokemon, 
  defender: Pokemon, 
  move: Move, 
  config: BattleConfig,
  defenderAction?: Action,
  isDancerTriggered: boolean = false,
  shouldTerastallize: boolean = false,
  isSleepTalkTriggered: boolean = false,
  shouldMegaEvolve: boolean = false // Novo parâmetro para Mega Evolução
): { newState: BattleState, logs: LogEntry[], fainted: boolean, switchRequested?: boolean, defenderSwitchRequested?: boolean, isBatonPass?: boolean, damageDealt: boolean } {
  
  const logs: LogEntry[] = [];
  let state = { ...currentState };

  // --- MEGA EVOLUTION LOGIC (JIT Fallback) ---
  if (shouldMegaEvolve && config.megaEvolutionEnabled && !attacker.isMega && !attacker.isTerastallized) {
      const isP1 = attacker.id === state.currentPokemon1?.id;
      const canMega = isP1 ? !state.p1MegaUsed : !state.p2MegaUsed;

      if (canMega) {
          const originalName = attacker.name;
          
          // Tenta usar o perfil carregado, senão cria um fallback JIT
          let profile = attacker.megaProfile;

          if (!profile) {
             // Fallback Síncrono para garantir que não trave e mostre o sprite correto
             const lowerName = attacker.name.toLowerCase().trim();
             let fallbackSprite = attacker.spriteUrl;
             
             // 1. Tenta pegar do mapa estático
             if (STATIC_MEGA_SPRITES[lowerName]) {
                 const id = STATIC_MEGA_SPRITES[lowerName];
                 fallbackSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
             }

             // 2. Ajuste manual para formas Y (Charizard/Mewtwo) se o item indicar
             if (lowerName === 'charizard' && attacker.heldItem?.includes('y')) {
                 fallbackSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10035.png`; // Charizard Mega Y
             } else if (lowerName === 'mewtwo' && attacker.heldItem?.includes('y')) {
                 fallbackSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10044.png`; // Mewtwo Mega Y
             }

             profile = {
                 name: `Mega ${attacker.name}`,
                 spriteUrl: fallbackSprite,
                 // CRUCIAL: Usamos o sprite frontal (fallbackSprite) também para o backSprite.
                 // A BattleScene inverte (espelha) automaticamente se não detectar "/back/" na URL.
                 backSpriteUrl: fallbackSprite, 
                 pixelSpriteUrl: attacker.pixelSpriteUrl,
                 types: attacker.types, // Mantém tipos (fallback seguro)
                 ability: attacker.ability, // Mantém habilidade (fallback seguro)
                 weight: attacker.weight,
                 // Estimativa de stats (+20 em tudo = +100 total, média das Megas)
                 stats: {
                     hp: attacker.maxHP,
                     attack: attacker.attackStat + 20,
                     defense: attacker.defenseStat + 20,
                     spAttack: attacker.spAttackStat + 20,
                     spDefense: attacker.spDefenseStat + 20,
                     speed: attacker.speedStat + 20
                 }
             };
             log(logs, "(Sprite Mega JIT aplicado)", "text-gray-400 text-[10px] italic");
          }

          // Perform Transformation
          attacker.isMega = true;
          attacker.megaProfile = profile; // Force update profile on object
          attacker.name = profile.name;
          attacker.spriteUrl = profile.spriteUrl;
          attacker.backSpriteUrl = profile.backSpriteUrl; // Atualiza Back Sprite (agora correto com JIT)
          attacker.pixelSpriteUrl = profile.pixelSpriteUrl; // Update Front Pixel Sprite
          
          // Update Base Stats (Raw values used by statCalculator)
          attacker.attackStat = profile.stats.attack;
          attacker.defenseStat = profile.stats.defense;
          attacker.spAttackStat = profile.stats.spAttack;
          attacker.spDefenseStat = profile.stats.spDefense;
          attacker.speedStat = profile.stats.speed;
          // Note: HP is typically unchanged in Mega Evolutions, but we don't update current/max HP to avoid healing bugs.

          attacker.types = [...profile.types];
          attacker.weight = profile.weight;
          
          // Update Ability
          const oldAbility = attacker.ability;
          attacker.ability = profile.ability;

          // Mark as Used
          if (isP1) state.p1MegaUsed = true;
          else state.p2MegaUsed = true;

          log(logs, `${originalName} Mega Evoluiu!`, 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 font-black text-lg animate-pulse');

          // Trigger Entry Abilities for the NEW Ability
          if (attacker.ability !== oldAbility) {
              const opponent = isP1 ? state.currentPokemon2 : state.currentPokemon1;
              Effects.handleEntryAbilities(attacker, opponent, config.weatherEnabled, logs, state);
          }
      }
  }

  // 1. Executa Validações Pré-Movimento
  const validation = validateMoveExecution(
      state, attacker, defender, move, config, defenderAction, isDancerTriggered, shouldTerastallize, isSleepTalkTriggered
  );

  // CRITICAL FIX: Propagate state changes (Tera usage, PP deduction, Protect counters)
  state = validation.newState; 

  let fainted = validation.fainted;
  let switchRequested = false;
  let defenderSwitchRequested = false;
  let isBatonPass = false;
  let damageDealt = false;
  
  // Atualiza logs vindos da validação
  logs.push(...validation.logs);

  // Se a validação indicou que o movimento não deve prosseguir (falha, recarga, carga), retorna o estado atualizado.
  if (!validation.canProceed) {
      return { newState: state, logs, fainted, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt: false };
  }

  // --- CHECK DE ROUBO (SNATCH) ---
  if (Snatch.checkSnatchInterception(state, attacker, defender, move, logs, config)) {
      return { newState: state, logs, fainted: attacker.isFainted, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt: false };
  }

  // --- PREPARAÇÃO DE VARIÁVEIS COMUNS PARA EXECUÇÃO ---
  // Verifica descongelamento
  if (attacker.statusEffects.freeze) {
    if (Math.random() < 0.2 || (move.type === 'fire' || move.name === 'scald' || move.name === 'steam-eruption' || move.name === 'scorching-sands') || move.name === 'burn-up' || move.name === 'double-shock') {
      delete attacker.statusEffects.freeze;
      log(logs, BATTLE_MESSAGES.THAWED(attacker.name), 'text-blue-500');
    } else {
      log(logs, BATTLE_MESSAGES.FROZEN_SOLID(attacker.name), 'text-blue-500');
      return { newState: state, logs, fainted: attacker.isFainted, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt: false };
    }
  }

  // --- LÓGICA RECURSIVA (METRONOME, ETC) ---
  // Estas lógicas permanecem aqui pois alteram o próprio movimento sendo executado, reiniciando o fluxo.

  if (move.name === 'metronome') {
      const randomMove = Metronome.getMetronomeMove(attacker, logs);
      if (randomMove) {
          const recursiveResult = executeMove(state, attacker, defender, randomMove, config, defenderAction, false, false, true);
          return { ...recursiveResult, logs: [...logs, ...recursiveResult.logs] };
      } else {
          log(logs, 'Mas falhou!', 'text-gray-500 italic');
          return { newState: state, logs, fainted: attacker.isFainted, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt: false };
      }
  }

  if (move.name === 'me-first') {
      if (config.moveLimitEnabled && !isSleepTalkTriggered) move.uses = Math.max(0, move.uses - 1);
      const copiedMove = MeFirst.handleMeFirst(attacker, defender, defenderAction, logs);
      if (copiedMove) {
          const recursiveResult = executeMove(state, attacker, defender, copiedMove, config, defenderAction, false, false, true);
          return { ...recursiveResult, logs: [...logs, ...recursiveResult.logs] };
      } else {
          return { newState: state, logs, fainted: attacker.isFainted, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt: false };
      }
  }

  if (move.name === 'nature-power') {
      const newMove = NaturePower.getNaturePowerMove(state.terrain);
      log(logs, `Poder Natural transformou-se em ${newMove.displayName}!`, 'text-blue-600 font-bold italic');
      if (config.moveLimitEnabled && !isSleepTalkTriggered) move.uses = Math.max(0, move.uses - 1);
      const recursiveResult = executeMove(state, attacker, defender, newMove, config, defenderAction, false, false, isSleepTalkTriggered);
      return { ...recursiveResult, logs: [...logs, ...recursiveResult.logs] };
  }

  if (move.name === 'copycat') {
      if (config.moveLimitEnabled && !isSleepTalkTriggered) move.uses = Math.max(0, move.uses - 1);
      const copiedMove = Copycat.handleCopycat(attacker, defender, logs);
      if (copiedMove) {
          const recursiveResult = executeMove(state, attacker, defender, copiedMove, config, defenderAction, false, false, true);
          return { ...recursiveResult, logs: [...logs, ...recursiveResult.logs] };
      } else {
          return { newState: state, logs, fainted: attacker.isFainted, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt: false };
      }
  }

  if (move.name === 'mirror-move') {
      if (config.moveLimitEnabled && !isSleepTalkTriggered) move.uses = Math.max(0, move.uses - 1);
      const copiedMove = MirrorMove.handleMirrorMove(attacker, defender, logs);
      if (copiedMove) {
          const recursiveResult = executeMove(state, attacker, defender, copiedMove, config, defenderAction, false, false, true);
          return { ...recursiveResult, logs: [...logs, ...recursiveResult.logs] };
      } else {
          return { newState: state, logs, fainted: attacker.isFainted, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt: false };
      }
  }

  if (move.name === 'sleep-talk') {
      const calledMove = SleepTalk.handleSleepTalk(attacker, logs);
      if (calledMove) {
          const recursiveResult = executeMove(state, attacker, defender, calledMove, config, defenderAction, false, false, true);
          return { ...recursiveResult, logs: [...logs, ...recursiveResult.logs] };
      } else {
          return { newState: state, logs, fainted: attacker.isFainted, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt: false };
      }
  }

  // --- LIMPEZA DE ESTADO DE CARREGAMENTO NO SEGUNDO TURNO ---
  // Se o movimento estava carregando (ex: Fly, Dig, Sky Drop), limpa o estado agora que vai executar
  if (attacker.chargingMove === move.name) {
      if (move.name === 'sky-drop') {
          // Limpa o estado de Sky Drop do defensor
          SkyDrop.handleDrop(defender);
      }
  }

  // =========================================================================================
  // MOVE PIPELINE START
  // =========================================================================================

  // 1. Inicializa Contexto
  let ctx = Pipeline.initializeContext(state, attacker, defender, move, config, logs, defenderAction);

  // 2. Resolve Tipos e Efeitos Ambientais
  ctx = Pipeline.resolveEffectiveType(ctx);

  // 3. Checa Precisão (Accuracy)
  // Retorna true se o golpe falhar (Miss, Crash Damage, etc)
  if (Pipeline.checkAccuracyStep(ctx)) {
      return { newState: state, logs, fainted: attacker.isFainted, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt: false };
  }

  // 4. Future Sight Check (Exceção de Fluxo - Ocorre após Accuracy mas antes de execução normal)
  if (move.name === 'future-sight') {
      MoveEffects.handleSecondaryEffects(attacker, defender, move, logs, state);
      attacker.lastMoveFailed = false; 
      return { newState: state, logs, fainted: false, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt: false };
  }

  // 5. Preparação (Recharge, Screen Break)
  Pipeline.preExecutionStep(ctx);

  // 6. Execução (Status vs Dano)
  if (move.damageClass === 'status') {
      Pipeline.executeStatusMoveStep(ctx);
  } else {
      Pipeline.executeDamageMoveStep(ctx);
  }

  // =========================================================================================
  // MOVE PIPELINE END
  // =========================================================================================
  
  // Extração de resultados do Contexto
  fainted = ctx.fainted;
  switchRequested = ctx.switchRequested;
  defenderSwitchRequested = ctx.defenderSwitchRequested;
  isBatonPass = ctx.isBatonPass;
  damageDealt = ctx.damageDealt;

  // --- PÓS-PROCESSAMENTO (DANCER, HISTÓRICO) ---

  if (!isDancerTriggered && Dancer.isDanceMove(move) && !defender.isFainted) {
      if (Dazzling.blocksPriorityMove(attacker, defender, move, state)) { /* skip */ } else if (Dancer.canTrigger(defender, state)) {
          log(logs, BATTLE_MESSAGES.DANCER_ACTIVATED(defender.name), 'text-purple-600 font-bold italic');
          const dancerResult = executeMove(state, defender, attacker, move, config, undefined, true);
          state = dancerResult.newState;
          logs.push(...dancerResult.logs);
          if (dancerResult.switchRequested) defenderSwitchRequested = true; 
          if (dancerResult.defenderSwitchRequested) switchRequested = true;
      }
  }

  if (config.moveLimitEnabled && move.uses === 0 && (attacker.lockedMove === move.name || attacker.statusEffects['outrage-lock'] || attacker.statusEffects['petal-dance-lock'] || attacker.statusEffects['thrash-lock'])) {
      attacker.lockedMove = null;
      if (attacker.statusEffects['outrage-lock']) delete attacker.statusEffects['outrage-lock'];
      if (attacker.statusEffects['petal-dance-lock']) delete attacker.statusEffects['petal-dance-lock'];
      if (attacker.statusEffects['thrash-lock']) delete attacker.statusEffects['thrash-lock'];
      
      log(logs, `${attacker.name} exauriu todo o poder de ${move.displayName} e parou de atacar!`, 'text-gray-500 italic');
  }

  if (!attacker.movesUsed.includes(move.name)) {
      attacker.movesUsed.push(move.name);
  }
  
  if (!attacker.lastMoveFailed && !fainted) {
      attacker.lastMoveUsed = move;
  }

  return { newState: state, logs, fainted, switchRequested, defenderSwitchRequested, isBatonPass, damageDealt };
}
