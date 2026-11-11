
import { BattleState, Pokemon, Move, BattleConfig, Action, LogEntry } from '../../../types';
import { log } from '../utils';
import { BATTLE_MESSAGES } from '../../../data/battleMessages';
import { TWO_TURN_MOVES, RECHARGE_MOVES } from '../../../data/moves';
import { ITEMS_DATA } from '../../../data/items';
import { TYPE_NAMES_PT } from '../../../data/types';

import * as Restrictions from '../handlers/moves/restrictions';
import * as ThroatChop from '../handlers/moves/throatChop';
import * as FuryCutter from '../handlers/moves/furyCutter';
import * as EchoedVoice from '../handlers/moves/echoedVoice';
import * as Uproar from '../handlers/moves/uproar';
import * as AirLock from '../handlers/abilities/air_lock';
import * as NeutralizingGas from '../handlers/abilities/neutralizing_gas';
import * as UpperHand from '../handlers/moves/upperHand';
import * as SuckerPunch from '../handlers/moves/suckerPunch';
import * as FirstImpression from '../handlers/moves/firstImpression';
import * as FocusPunch from '../handlers/moves/focusPunch';
import * as Snore from '../handlers/moves/snore';
import * as LastResort from '../handlers/moves/lastResort';
import * as Belch from '../handlers/moves/belch';
import * as SteelRoller from '../handlers/moves/steelRoller';
import * as Fling from '../handlers/moves/fling';
import * as Damp from '../handlers/abilities/damp';
import * as Truant from '../handlers/abilities/truant';
import * as Terrain from '../handlers/terrain';
import * as Dazzling from '../handlers/abilities/dazzling';
import * as Telepathy from '../handlers/abilities/telepathy';
import * as Klutz from '../handlers/abilities/klutz';
import * as StatusCheck from '../handlers/statusCheck';
import * as Rollout from '../handlers/moves/rollout';
import * as Libero from '../handlers/abilities/libero';
import * as StanceChange from '../handlers/abilities/stance_change';
import * as PropellerTail from '../handlers/abilities/propeller_tail';
import * as Poltergeist from '../handlers/moves/poltergeist';
import * as Comatose from '../handlers/abilities/comatose';
import * as PPManager from '../handlers/ppManager';
import * as MeteorBeam from '../handlers/moves/meteorBeam';
import * as ElectroShot from '../handlers/moves/electroShot';
import * as GigatonHammer from '../handlers/moves/gigatonHammer';
import * as ShellTrap from '../handlers/moves/shellTrap';
import * as BurnUp from '../handlers/moves/burnUp';
import * as Thunderclap from '../handlers/moves/thunderclap';
import * as DoubleShock from '../handlers/moves/doubleShock';
import * as Synchronoise from '../handlers/moves/synchronoise';
import * as NaturalGift from '../handlers/moves/naturalGift';
import * as FakeOut from '../handlers/moves/fakeOut';
import * as SpitUp from '../handlers/moves/spitUp';
import * as SkyDrop from '../handlers/moves/skyDrop';
import * as DesolateLand from '../handlers/abilities/desolate_land';

export interface ValidationResult {
    canProceed: boolean;
    newState: BattleState;
    logs: LogEntry[];
    fainted: boolean;
}

export function validateMoveExecution(
    currentState: BattleState,
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    config: BattleConfig,
    defenderAction?: Action,
    isDancerTriggered: boolean = false,
    shouldTerastallize: boolean = false,
    isSleepTalkTriggered: boolean = false
): ValidationResult {
    
    let logs: LogEntry[] = [];
    let state = { ...currentState };
    let fainted = false;

    // --- CHECK ITEM SUPPRESSION (Klutz, Magic Room, Embargo) ---
    const attackerItemsSuppressed = Klutz.isItemSuppressed(attacker, state);

    // --- ASSAULT VEST CHECK ---
    if (attacker.heldItem === 'assault-vest' && !attackerItemsSuppressed) {
        if (move.damageClass === 'status') {
             log(logs, `${attacker.name} não pode usar golpes de status devido ao seu Colete Assalto (Assault Vest)!`, 'text-red-600 font-bold');
             attacker.lastMoveFailed = true;
             return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // --- LIMPEZA DE DESTINY BOND ---
    // Se o Pokémon vai executar um movimento, o efeito anterior de Destiny Bond se dissipa.
    // Exceção: Se o movimento atual for Destiny Bond, a lógica interna do move (destinyBond.ts)
    // lidará com a falha por uso consecutivo, mas ainda limpamos aqui para garantir o ciclo correto.
    if (attacker.statusEffects['destiny-bond']) {
        delete attacker.statusEffects['destiny-bond'];
    }

    // --- LÓGICA DE TERASTALIZAÇÃO ---
    if (shouldTerastallize && config.terastallizationEnabled && !attacker.isTerastallized) {
        const isP1 = attacker.id === state.currentPokemon1?.id;
        const canTera = isP1 ? !state.p1TeraUsed : !state.p2TeraUsed;

        if (canTera) {
            attacker.isTerastallized = true;
            if (isP1) state.p1TeraUsed = true;
            else state.p2TeraUsed = true;

            const typeName = TYPE_NAMES_PT[attacker.teraType || 'normal'] || attacker.teraType;
            log(logs, `${attacker.name} protegeu-se na energia Terastal e assumiu o tipo ${typeName}!`, 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 font-black text-lg animate-pulse');
        }
    }

    // --- RESTRIÇÕES DE MOVIMENTO (Encore, Taunt, Torment, Imprison) ---
    // Sleep Talk ignora Disable, Encore e Torment no movimento chamado
    // Passamos o defender para verificar Imprison
    if (!isSleepTalkTriggered && !Restrictions.checkRestriction(attacker, move, logs, defender)) {
        attacker.lastMoveFailed = true;
        return { canProceed: false, newState: state, logs, fainted: false };
    }

    // --- LÓGICA DE RESET DE PROTECT ---
    const protectMoves = ['protect', 'detect', 'endure', 'spiky-shield', 'kings-shield', 'baneful-bunker', 'obstruct', 'silk-trap', 'burning-bulwark', 'crafty-shield'];
    if (!protectMoves.includes(move.name)) {
        attacker.protectCounter = 0;
    }

    // Verifica bloqueio por Throat Chop (Golpe na Garganta)
    if (ThroatChop.isBlockedByThroatChop(attacker, move, logs)) {
        attacker.lastMoveFailed = true;
        return { canProceed: false, newState: state, logs, fainted: false };
    }

    // Se o movimento escolhido NÃO for Cortador de Fúria, o contador deve ser resetado.
    if (move.name !== 'fury-cutter') {
        FuryCutter.resetStreak(attacker);
    }

    // Se o movimento escolhido NÃO for Voz Ecoante, o contador deve ser resetado.
    if (move.name !== 'echoed-voice') {
        EchoedVoice.resetStreak(attacker);
    }

    // Lógica de Algazarra (Uproar): Trava e Acorda
    if (move.name === 'uproar') {
        Uproar.wakeUpEveryone(state, logs);
        Uproar.processUproarLock(attacker, logs);
    }

    const isWeatherSuppressed = AirLock.isWeatherSuppressed(state);
    const effectiveWeather = isWeatherSuppressed ? 'none' : state.weather;
    // isGasActive não é usado diretamente aqui, mas os handlers importam sua lógica quando necessário

    // Check para Terra Desolada (Desolate Land)
    if (move.type === 'water' && move.damageClass !== 'status' && DesolateLand.isDesolateLandActive(state)) {
        log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
        log(logs, 'O ataque de Água evaporou no calor extremo!', 'text-orange-600 italic font-bold');
        attacker.lastMoveFailed = true;
        return { canProceed: false, newState: state, logs, fainted: false };
    }

    // Check para Mão Superior (Upper Hand)
    if (move.name === 'upper-hand') {
        if (!UpperHand.canExecuteUpperHand(attacker, defender, defenderAction)) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            log(logs, BATTLE_MESSAGES.UPPER_HAND_FAIL(attacker.name), 'text-gray-500 italic');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Golpe Baixo (Sucker Punch)
    if (move.name === 'sucker-punch') {
        if (SuckerPunch.checkFailure(attacker, defender, defenderAction, logs)) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Estrondo (Thunderclap)
    if (move.name === 'thunderclap') {
        if (Thunderclap.checkFailure(attacker, defender, defenderAction, logs)) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Primeira Impressão (First Impression)
    if (move.name === 'first-impression') {
        if (FirstImpression.checkFailure(attacker, logs)) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Fingimento (Fake Out)
    if (move.name === 'fake-out') {
        if (FakeOut.checkFailure(attacker, logs)) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Martelo Gigaton (Gigaton Hammer)
    if (move.name === 'gigaton-hammer') {
        if (GigatonHammer.checkFailure(attacker, logs)) {
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Combustão (Burn Up)
    if (move.name === 'burn-up') {
        if (BurnUp.checkFailure(attacker, logs)) {
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Choque Duplo (Double Shock)
    if (move.name === 'double-shock') {
        if (DoubleShock.checkFailure(attacker, logs)) {
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Soco Focalizado (Focus Punch)
    if (move.name === 'focus-punch') {
        log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
        if (FocusPunch.checkFocusPunchFailure(attacker, logs)) {
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Armadilha de Concha (Shell Trap)
    if (move.name === 'shell-trap') {
        log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
        if (ShellTrap.checkShellTrapFailure(attacker, logs)) {
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Queda Livre (Sky Drop)
    if (move.name === 'sky-drop') {
        if (SkyDrop.checkFailure(attacker, defender, state, logs)) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Ronco (Snore)
    if (move.name === 'snore') {
        if (Snore.checkSnoreFailure(attacker, logs)) {
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Último Recurso (Last Resort)
    if (move.name === 'last-resort') {
        if (!LastResort.canUseLastResort(attacker)) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            log(logs, BATTLE_MESSAGES.LAST_RESORT_FAIL(), 'text-gray-500 italic');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Arroto (Belch)
    if (move.name === 'belch') {
        if (Belch.checkFailure(attacker, logs)) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Rolo de Aço (Steel Roller)
    if (move.name === 'steel-roller') {
        if (SteelRoller.checkFailure(attacker, state, logs)) {
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Check para Cuspir (Spit Up) e Engolir (Swallow)
    if (move.name === 'spit-up' || move.name === 'swallow') {
        if (SpitUp.checkFailure(attacker, logs)) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }
    
    // Check para Sincrorruído (Synchronoise)
    if (move.name === 'synchronoise') {
        if (Synchronoise.checkFailure(attacker, defender, logs)) {
            attacker.lastMoveFailed = true;
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }
    
    // const attackerItemsSuppressed = Klutz.isItemSuppressed(attacker, state); // REMOVIDO: Já declarado no início

    // Check para Dom Natural (Natural Gift)
    if (move.name === 'natural-gift') {
        const item = attacker.heldItem;
        const config = item ? NaturalGift.getNaturalGiftConfig(item) : null;

        if (!item || !config || attackerItemsSuppressed) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            log(logs, "Mas falhou! Requer uma fruta válida.", 'text-gray-500 italic');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }

        // Configura o poder do movimento e consome a fruta
        move.power = config.power;
        
        // Consome a fruta
        attacker.consumedItem = item;
        attacker.heldItem = null;
        attacker.hadItem = true;

        log(logs, `${attacker.name} usou a energia da fruta!`, 'text-indigo-600 italic');
    }

    // Check para Arremesso (Fling)
    if (move.name === 'fling') {
        if (!attacker.heldItem || attackerItemsSuppressed) {
            log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
            log(logs, "Mas falhou! Não tem item para arremessar.", 'text-gray-500 italic');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
        
        // Armazena o item e consome (apenas lógica de preparação, o efeito ocorre depois)
        // Nota: Precisamos calcular o poder aqui para passar adiante, e consumir o item.
        const flingItem = attacker.heldItem;
        const itemName = ITEMS_DATA[flingItem]?.name || flingItem;
        
        move.power = Fling.getFlingPower(flingItem);

        // Se o item arremessado for Choice, remove o bloqueio
        if (flingItem.includes('choice')) {
            attacker.lockedMove = null;
        }

        // Armazena o item em 'consumedItem' para uso no handler de efeito
        attacker.consumedItem = flingItem;
        attacker.heldItem = null;
        attacker.hadItem = true;
        
        log(logs, `${attacker.name} arremessou seu ${itemName}!`, 'text-indigo-600 italic');
    }

    if (Damp.isExplosiveMove(move.name) && Damp.isDampActive(state)) {
        log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
        log(logs, BATTLE_MESSAGES.DAMP_PREVENTS(), 'text-blue-600 italic font-bold');
        attacker.lastMoveFailed = true;
        return { canProceed: false, newState: state, logs, fainted: false };
    }

    const activeChargingMove = attacker.chargingMove;
    if (activeChargingMove) {
        attacker.chargingMove = null;
        const statusToRemove = TWO_TURN_MOVES[activeChargingMove]?.status;
        if (statusToRemove) delete attacker.statusEffects[statusToRemove];
    }

    if (move.name === 'recharge') {
        attacker.mustRecharge = false;
        log(logs, BATTLE_MESSAGES.RECHARGE_REQUIRED(attacker.name), 'text-gray-500');
        Truant.consumeLoafingOnRecharge(attacker);
        // Recarregar não conta como falha, é parte do movimento anterior bem-sucedido
        // Retornamos canProceed: false para não calcular dano, mas sem erro.
        return { canProceed: false, newState: state, logs, fainted };
    }

    if (attacker.isFlinched) {
        log(logs, `${attacker.name} recuou e não atacou!`, 'text-yellow-600');
        attacker.isFlinched = false;
        return { canProceed: false, newState: state, logs, fainted };
    }
  
    if (attacker.statusEffects.freeze) {
        if (Math.random() < 0.2 || (move.type === 'fire' || move.name === 'scald' || move.name === 'steam-eruption' || move.name === 'scorching-sands') || move.name === 'burn-up' || move.name === 'double-shock') {
            delete attacker.statusEffects.freeze;
            log(logs, BATTLE_MESSAGES.THAWED(attacker.name), 'text-blue-500');
        } else {
            log(logs, BATTLE_MESSAGES.FROZEN_SOLID(attacker.name), 'text-blue-500');
            return { canProceed: false, newState: state, logs, fainted };
        }
    }

    if (state.terrain === 'psychic' && Terrain.shouldBlockPriority(move, attacker, defender, state.terrain)) {
        log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
        log(logs, BATTLE_MESSAGES.PSYCHIC_TERRAIN_PROTECT(defender.name), 'text-purple-600 italic font-bold');
        attacker.lastMoveFailed = true;
        return { canProceed: false, newState: state, logs, fainted: false };
    }

    if (Dazzling.blocksPriorityMove(attacker, defender, move, state)) {
        log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
        Dazzling.logPriorityBlocked(defender, logs);
        attacker.lastMoveFailed = true;
        return { canProceed: false, newState: state, logs, fainted: false };
    }

    if (Telepathy.isImmuneToAllyMove(attacker, defender, state)) {
        log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName), attacker === state.currentPokemon1 ? 'text-green-800' : 'text-red-800');
        Telepathy.logTelepathyProtection(defender, logs);
        attacker.lastMoveFailed = true;
        return { canProceed: false, newState: state, logs, fainted: false };
    }

    if (!attackerItemsSuppressed && ['choice-band', 'choice-specs', 'choice-scarf'].includes(attacker.heldItem || '') && !attacker.lockedMove && move.name !== 'struggle') {
        attacker.lockedMove = move.name;
    }
  
    if (attacker.disabledMoves && attacker.disabledMoves[move.name]) {
        // Sleep Talk ignora Desativação (Disable) no movimento chamado
        if (!isSleepTalkTriggered) {
            log(logs, BATTLE_MESSAGES.MOVE_DISABLED(move.displayName), 'text-gray-500 italic');
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    // Verifica condições de status que impedem movimento (Paralisia, Sono, Flinch, etc)
    if (!StatusCheck.checkStatusBlocking(attacker, move, logs, state, isSleepTalkTriggered)) {
        attacker.lastMoveFailed = true;
        // Se a Rolagem for interrompida por status, reseta
        if (move.name === 'rollout') Rollout.resetRollout(attacker);
        return { canProceed: false, newState: state, logs, fainted: attacker.hp === 0 };
    }

    Libero.applyLibero(attacker, move, logs);
    StanceChange.handleStanceChange(attacker, move, logs); // Gatilho de Mudança de Forma
    Truant.setLoafingNextTurn(attacker);

    if (PropellerTail.ignoresRedirection(attacker) && PropellerTail.isRedirectionAbility(defender.ability, move.type)) {
        PropellerTail.logRedirectionIgnored(attacker, logs);
    }

    const usePrefix = isDancerTriggered ? `[Dançarino] ` : "";
  
    // Evita log duplicado para movimentos que já logaram (como Focus Punch e Fling/Natural Gift que tem log custom)
    // Sleep Talk (chamado) deve logar
    if (move.name !== 'focus-punch' && move.name !== 'shell-trap' && !isSleepTalkTriggered) {
        log(logs, BATTLE_MESSAGES.USED_MOVE(attacker.name, move.displayName, usePrefix), attacker === state.currentPokemon1 ? 'text-green-800 font-bold' : 'text-red-800 font-bold');
    }

    // Checagem de Poltergeist antes do cálculo de acerto/dano
    if (move.name === 'poltergeist') {
        if (Poltergeist.checkFailure(defender, logs)) {
            attacker.lastMoveFailed = true;
            return { canProceed: false, newState: state, logs, fainted: false };
        }
    }

    if (move.name === 'dream-eater' && !defender.statusEffects.sleep && !Comatose.isTreatedAsAsleep(defender)) {
        log(logs, BATTLE_MESSAGES.DREAM_EATER_FAIL(defender.name), 'text-gray-500 italic');
        attacker.lastMoveFailed = true;
        return { canProceed: false, newState: state, logs, fainted: false };
    }

    // Consome PP apenas se NÃO for o segundo turno de um movimento carregado E NÃO for chamado por Sleep Talk
    if (!activeChargingMove && !isSleepTalkTriggered) {
        PPManager.deductPP(attacker, defender, move, config);
    }

    // --- LÓGICA DE MOVIMENTOS DE DOIS TURNOS (CARREGAMENTO) ---
    if (TWO_TURN_MOVES[move.name]) {
        // Verifica se deve pular o carregamento (Solar Beam no Sol, Electro Shot na Chuva)
        let skipCharge = false;
        if (move.name === 'solar-beam' || move.name === 'solar-blade') {
            if (effectiveWeather === 'sun') skipCharge = true;
        }
        if (move.name === 'electro-shot' && effectiveWeather === 'rain') {
            skipCharge = true;
        }

        // Sleep Talk executa movimentos de 2 turnos imediatamente?
        // Oficial: Movimentos de 2 turnos falham se chamados por Sleep Talk, EXCETO se Solar Beam no Sol.
        if (isSleepTalkTriggered && !skipCharge) {
            log(logs, `Mas falhou! ${move.displayName} não pode ser usado via Sonâmbulo.`, 'text-gray-500 italic');
            return { canProceed: false, newState: state, logs, fainted };
        }

        if (!activeChargingMove && !skipCharge) {
            // Aplica boost de Meteor Beam / Electro Shot no turno de carga
            if (move.name === 'meteor-beam') {
                MeteorBeam.handleChargeBoost(attacker, logs, state);
            }
            if (move.name === 'electro-shot') {
                ElectroShot.handleChargeBoost(attacker, logs, state);
            }

            // Lógica Especial para Sky Drop (Prende o alvo no ar durante a carga)
            if (move.name === 'sky-drop') {
                if (!SkyDrop.handleChargeTurn(attacker, defender, logs, state, move)) {
                    attacker.lastMoveFailed = true;
                    return { canProceed: false, newState: state, logs, fainted };
                }
            }

            attacker.chargingMove = move.name;
            log(logs, `${attacker.name} ${TWO_TURN_MOVES[move.name].msg}`, 'text-blue-600');
      
            if (TWO_TURN_MOVES[move.name].status) attacker.statusEffects[TWO_TURN_MOVES[move.name].status!] = { turns: 1 };
            // O turno de carga é considerado sucesso
            attacker.lastMoveFailed = false;
            // Retorna false para parar a execução (não causa dano neste turno)
            return { canProceed: false, newState: state, logs, fainted };
        }

        // Se pulou a carga (ex: Electro Shot na chuva), o boost deve ocorrer agora
        if (skipCharge && move.name === 'electro-shot') {
            ElectroShot.handleChargeBoost(attacker, logs, state);
        }
    }

    return { canProceed: true, newState: state, logs, fainted: false };
}
