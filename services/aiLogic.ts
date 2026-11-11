
import { Pokemon, Move, Action, PlayerInventory, BattleState, BattleConfig, LogEntry } from '../types';
import { calculateTypeEffectiveness, getRawStat, isTrapped, getEffectiveSpeed } from './battleUtils';
import { calculateHitChance } from './engine/mechanics/accuracy';
import { TWO_TURN_MOVES } from '../data/moves';
import { ITEMS_DATA, POKEMON_TO_MEGA_STONES } from '../data/items';
import * as Psyshock from './engine/handlers/moves/psyshock';
import * as TerrainPulse from './engine/handlers/moves/terrainPulse';
import * as Comatose from './engine/handlers/abilities/comatose';
import * as LastResort from './engine/handlers/moves/lastResort';

// --- IMPORTS DO MOTOR (Para Simulação) ---
import { executeMove } from './engine/moves';
import { performSwitch } from './engine/switching';
import { getSortedActions } from './engine/actions';
import { processTurnEnd } from './engine/turnEnd';

// --- CONFIGURAÇÃO DA IA ---
const SIMULATION_DEPTH = 1; // 1 Turno completo
const MAX_OPPONENT_ACTIONS = 3; // Considera apenas os 3 melhores movimentos do oponente para performance

// Configuração Mock para a simulação (assume regras padrão)
const SIMULATION_CONFIG: BattleConfig = {
    p1Mode: 'manual', p2Mode: 'manual', p1TeamSize: 6, p2TeamSize: 6, p1Input: '', p2Input: '', opponentMode: 'manual',
    weatherEnabled: true, terrainEnabled: true, itemsEnabled: true, terastallizationEnabled: true, megaEvolutionEnabled: true, moveLimitEnabled: true,
    p1AutoMode: false, randomIvs: true, randomLevels: false
};

function getPerceivedOpponent(actualOpponent: Pokemon): Pokemon {
    const perceived = structuredClone(actualOpponent);
    perceived.heldItem = null; 

    const knownMoveNames = actualOpponent.movesUsed || [];
    const knownMoves = actualOpponent.moves.filter(m => knownMoveNames.includes(m.name));
    
    if (knownMoves.length < 4) {
        for (const type of actualOpponent.types) {
            const hasStab = knownMoves.some(m => m.type === type && m.damageClass !== 'status');
            
            if (!hasStab) {
                const category = actualOpponent.attackStat > actualOpponent.spAttackStat ? 'physical' : 'special';
                const ghostMove: Move = {
                    name: `assumed-${type}-stab`,
                    displayName: `Possível ${type} (STAB)`,
                    type: type,
                    power: 80,
                    accuracy: 100,
                    damageClass: category,
                    isStatus: false,
                    description: 'Movimento deduzido pela IA (Fog of War).',
                    uses: 5,
                    maxUses: 5
                };
                knownMoves.push(ghostMove);
            }
        }
    }
    
    perceived.moves = knownMoves;
    return perceived;
}

// --- VALIDAÇÃO DE CONDIÇÕES DE USO (Regras Rígidas) ---

function checkMoveFailsCondition(move: Move, attacker: Pokemon, defender: Pokemon, state?: BattleState): boolean {
    // 1. Dream Eater / Nightmare / Wake-Up Slap: Alvo deve estar dormindo
    if (['dream-eater', 'nightmare', 'wake-up-slap'].includes(move.name)) {
        const isAsleep = !!defender.statusEffects.sleep || Comatose.isTreatedAsAsleep(defender);
        if (!isAsleep) return true;
    }

    // 2. Steel Roller: Deve haver terreno ativo
    if (move.name === 'steel-roller') {
        if (!state || state.terrain === 'none') return true;
    }

    // 3. Poltergeist / Knock Off / Thief: Alvo deve ter item
    if (['poltergeist', 'knock-off', 'thief'].includes(move.name)) {
        if (!defender.heldItem) return true;
    }

    // 4. Fake Out / First Impression: Apenas primeiro turno
    if (['fake-out', 'first-impression'].includes(move.name)) {
        if (attacker.turnsActive > 0) return true;
    }

    // 5. Last Resort: Deve ter usado todos outros moves
    if (move.name === 'last-resort') {
        if (!LastResort.canUseLastResort(attacker)) return true;
    }

    // 6. Snore / Sleep Talk: Usuário deve estar dormindo
    if (['snore', 'sleep-talk'].includes(move.name)) {
        const isAsleep = !!attacker.statusEffects.sleep || Comatose.isTreatedAsAsleep(attacker);
        if (!isAsleep) return true;
    }

    // 7. Belch: Deve ter consumido Berry
    if (move.name === 'belch') {
        if (!attacker.consumedItem || !attacker.consumedItem.endsWith('-berry')) return true;
    }

    // 8. Burn Up: Usuário deve ser tipo Fogo
    if (move.name === 'burn-up') {
         const hasFireType = attacker.isTerastallized
            ? attacker.teraType === 'fire'
            : attacker.types.includes('fire');
        if (!hasFireType) return true;
    }

    // 9. Double Shock: Usuário deve ser tipo Elétrico
    if (move.name === 'double-shock') {
         const hasElectricType = attacker.isTerastallized
            ? attacker.teraType === 'electric'
            : attacker.types.includes('electric');
        if (!hasElectricType) return true;
    }

    // 10. Sucker Punch / Thunderclap: Heurística de Falha
    if (['sucker-punch', 'thunderclap'].includes(move.name)) {
         // Risco alto se o oponente usou status no turno anterior (spam de status)
         if (defender.lastMoveUsed && defender.lastMoveUsed.damageClass === 'status') {
             return true; 
         }
         
         // Se o oponente for mais lento, Sucker Punch não é necessário para atacar primeiro e pode falhar
         if (state) {
             const speedMatchup = evaluateSpeedMatchup(attacker, defender, state);
             if (speedMatchup === 'faster') { // Usuário é mais rápido (Oponente mais lento)
                 return true; 
             }
         }
    }

    // 11. Imunidades de Tipo e Habilidade
    if (move.damageClass !== 'status') {
        const eff = calculateTypeEffectiveness(move.type, defender.types, defender.ability);
        if (eff.multiplier === 0) return true;

        // Habilidades de imunidade conhecidas
        const ability = defender.ability;
        if (ability === 'levitate' && move.type === 'ground') return true;
        if (ability === 'water-absorb' && move.type === 'water') return true;
        if (ability === 'volt-absorb' && move.type === 'electric') return true;
        if (ability === 'sap-sipper' && move.type === 'grass') return true;
        if (ability === 'flash-fire' && move.type === 'fire') return true;
        if (ability === 'earth-eater' && move.type === 'ground') return true;
        if (ability === 'dry-skin' && move.type === 'water') return true;
        if (ability === 'storm-drain' && move.type === 'water') return true;
        if (ability === 'motor-drive' && move.type === 'electric') return true;
        if (ability === 'lightning-rod' && move.type === 'electric') return true;
        if (ability === 'well-baked-body' && move.type === 'fire') return true;
    }

    return false;
}

// --- FUNÇÕES AUXILIARES DE CÁLCULO DE DANO (Legado/Heurística) ---

function estimateDamage(attacker: Pokemon, defender: Pokemon, move: Move, weather: string, state?: BattleState): number {
    if (move.damageClass === 'status') return 0;

    let power = move.power;
    let moveType = move.type;
    
    if (move.name === 'terrain-pulse' && state) {
        const res = TerrainPulse.getTerrainPulsePower(attacker, power, state.terrain);
        power = res.power;
        moveType = TerrainPulse.getEffectiveType(attacker, state.terrain);
    }

    if (move.name === 'low-kick' || move.name === 'grass-knot') power = 60; 
    if (move.name === 'heavy-slam' || move.name === 'heat-crash') power = 80;
    if (move.name === 'gyro-ball') power = 70;

    let attack = move.damageClass === 'physical' 
        ? getRawStat(attacker, 'attack', weather, state?.terrain) 
        : getRawStat(attacker, 'spAttack', weather, state?.terrain);

    let defense = move.damageClass === 'physical' 
        ? getRawStat(defender, 'defense', weather, state?.terrain) 
        : getRawStat(defender, 'spDefense', weather, state?.terrain);
    
    if (Psyshock.targetsPhysicalDefense(move.name)) {
        defense = getRawStat(defender, 'defense', weather, state?.terrain);
    }

    const level = 50;
    let damage = ((2 * level / 5 + 2) * power * attack / defense) / 50 + 2;

    if (attacker.types.includes(moveType)) {
        damage *= (attacker.ability === 'adaptability' ? 2 : 1.5);
    }

    const eff = calculateTypeEffectiveness(moveType, defender.types, defender.ability);
    damage *= eff.multiplier;

    // Ajustes simples de habilidades
    if (attacker.ability === 'technician' && power <= 60) damage *= 1.5;
    if (defender.ability === 'thick-fat' && (moveType === 'fire' || moveType === 'ice')) damage *= 0.5;
    if (defender.ability === 'levitate' && moveType === 'ground') damage = 0;
    if (defender.ability === 'flash-fire' && moveType === 'fire') damage = 0;
    if (defender.ability === 'water-absorb' && moveType === 'water') damage = 0;
    if (defender.ability === 'volt-absorb' && moveType === 'electric') damage = 0;
    if (defender.ability === 'sap-sipper' && moveType === 'grass') damage = 0;
    if (defender.ability === 'earth-eater' && moveType === 'ground') damage = 0;

    return damage;
}

// --- LÓGICA DE ITENS ---

interface ScoredItemAction {
    action: Action;
    score: number;
}

function getBestItemAction(
    inventory: PlayerInventory,
    user: Pokemon,
    team: Pokemon[],
    opponent: Pokemon,
    state?: BattleState
): ScoredItemAction | null {
    if (!inventory || !inventory.items || inventory.items.length === 0) return null;

    let bestAction: ScoredItemAction | null = null;
    let maxScore = -Infinity;

    // Definição de Player Num (Assumindo que user é da IA -> P2)
    const playerNum = 2; 

    inventory.items.forEach(bagItem => {
        const itemData = ITEMS_DATA[bagItem.id];
        if (!itemData) return;

        // Avalia uso em si mesmo
        const selfScore = evaluateItemUse(bagItem.id, user, opponent, state, user);
        if (selfScore > maxScore) {
            maxScore = selfScore;
            bestAction = {
                score: selfScore,
                action: {
                    type: 'item',
                    data: { itemId: bagItem.id, targetId: user.id, isGive: false },
                    user: user,
                    playerNum: playerNum,
                    tieBreaker: 0
                }
            };
        }

        // Avalia uso em aliados (ex: Revive, Potion em reserva, Equipar item em reserva)
        team.forEach(teammate => {
            // Itens de uso direto (Cura, Revive) em aliados
            if (teammate.id !== user.id) {
                const allyScore = evaluateItemUse(bagItem.id, teammate, opponent, state, user);
                if (allyScore > maxScore) {
                    maxScore = allyScore;
                    bestAction = {
                        score: allyScore,
                        action: {
                            type: 'item',
                            data: { itemId: bagItem.id, targetId: teammate.id, isGive: false },
                            user: user,
                            playerNum: playerNum,
                            tieBreaker: 0
                        }
                    };
                }
            }

            // Equipar item (Give) em aliados ou no próprio usuário
            // (Para o usuário, verifica aqui também)
            const canHold = !teammate.heldItem && !teammate.isFainted;
            if (canHold && ['held', 'berry', 'plate', 'memory'].includes(itemData.category)) {
                const giveScore = evaluateItemGive(bagItem.id, teammate, opponent);
                
                // Prioriza equipar o Pokémon ativo se o score for bom, mas equipar reserva também é válido
                // Aplica um pequeno desconto para equipar reservas para priorizar o ativo em caso de empate
                const finalGiveScore = teammate.id === user.id ? giveScore : giveScore - 5;

                if (finalGiveScore > maxScore) {
                    maxScore = finalGiveScore;
                    bestAction = {
                        score: finalGiveScore,
                        action: {
                            type: 'item',
                            data: { itemId: bagItem.id, targetId: teammate.id, isGive: true },
                            user: user,
                            playerNum: playerNum,
                            tieBreaker: 0
                        }
                    };
                }
            }
        });
    });

    return bestAction;
}

function calculatePokemonUtility(pokemon: Pokemon, currentOpponent: Pokemon): number {
    let utility = 0;
    // Vantagem de tipo
    for (const move of pokemon.moves) {
        if (move.damageClass !== 'status') {
            const eff = calculateTypeEffectiveness(move.type, currentOpponent.types, currentOpponent.ability);
            if (eff.multiplier >= 2) utility += 30;
        }
    }
    for (const oppType of currentOpponent.types) {
        const eff = calculateTypeEffectiveness(oppType, pokemon.types, pokemon.ability);
        if (eff.multiplier <= 0.5) utility += 20;
        if (eff.multiplier >= 2) utility -= 20;
    }
    // Condição de vitória (BST/Level)
    utility += (pokemon.attackStat + pokemon.spAttackStat + pokemon.speedStat) / 10;
    return utility;
}

function evaluateItemUse(itemId: string, target: Pokemon, opponent: Pokemon, state?: BattleState, activePokemon?: Pokemon): number {
    let score = 0;
    const hpPercent = target.hp / target.maxHP;
    const missingHP = target.maxHP - target.hp;

    // Estimativa de dano recebido
    let estimatedIncomingDamage = 0;
    if (state && activePokemon) {
        const dangerousMove = getMostDangerousMove(opponent, activePokemon, state.weather, state);
        if (dangerousMove) {
            estimatedIncomingDamage = estimateDamage(opponent, activePokemon, dangerousMove, state.weather, state);
        }
    }

    // Cura (Potions)
    if (['potion', 'super-potion', 'hyper-potion', 'max-potion', 'full-restore'].some(i => itemId.includes(i))) {
        if (target.isFainted) return -1;
        
        let healAmount = 0;
        if (itemId === 'potion') healAmount = 20;
        else if (itemId === 'super-potion') healAmount = 50;
        else if (itemId === 'hyper-potion') healAmount = 120;
        else if (itemId === 'max-potion' || itemId === 'full-restore') healAmount = target.maxHP;

        // Se o Pokémon ativo vai morrer de qualquer jeito mesmo curando, não cura
        if (activePokemon && target.id === activePokemon.id) {
            if (target.hp + healAmount <= estimatedIncomingDamage) {
                return -100; // Vai morrer de qualquer jeito, melhor atacar ou trocar
            }
        }

        // Eficiência de Cura
        if (missingHP === 0) return -1;
        
        // Penaliza desperdício
        const waste = healAmount - missingHP;
        if (waste > 50 && healAmount !== target.maxHP) {
            score -= 30; // Desperdício alto
        }
        if (healAmount >= target.maxHP && missingHP < target.maxHP * 0.5) {
            score -= 50; // Desperdício de Max Potion
        }

        if (hpPercent < 0.3) score += 90; // Prioridade Crítica
        else if (hpPercent < 0.5) score += 70; // Prioridade Alta
        else if (hpPercent < 0.8) score += 40; // Prioridade Média
        else return -1; // Não usar se HP alto
        
        // Full Restore bônus por status
        if (itemId === 'full-restore' && Object.keys(target.statusEffects).length > 0) score += 20;
    }

    // Reviver
    if (itemId.includes('revive')) {
        if (!target.isFainted) return -1;
        
        // Só revive se o Pokémon ativo atual puder sobreviver ao turno
        if (activePokemon && activePokemon.hp <= estimatedIncomingDamage) {
            return -100; // O ativo vai morrer neste turno, reviver agora é suicídio duplo
        }

        const utility = calculatePokemonUtility(target, opponent);
        if (utility > 50) {
            score += 85 + (utility / 2); 
        } else {
            score += 30; // Baixa prioridade para Pokémon inútil no matchup
        }
    }

    // Cura Status
    if (['full-heal', 'antidote', 'paralyze-heal', 'burn-heal', 'ice-heal', 'awakening', 'lum-berry'].includes(itemId)) {
        if (target.isFainted) return -1;
        const statuses = Object.keys(target.statusEffects);
        if (statuses.length === 0) return -1;
        
        // Prioriza status incapacitantes
        if (statuses.includes('freeze') || statuses.includes('sleep')) score += 80;
        if (statuses.includes('burn') && target.attackStat > target.spAttackStat) score += 75; // Burn em atacante físico
        if (statuses.includes('paralysis')) score += 70;
        if (statuses.includes('toxic')) score += 75;
    }

    // Battle Items (X-Attack, etc) - Apenas para o ativo
    if (ITEMS_DATA[itemId]?.category === 'battle-item' && !target.isFainted) {
        if (hpPercent > 0.8 && estimatedIncomingDamage < target.hp * 0.5) {
            // Só usa se estiver saudável e seguro
            if (itemId === 'x-attack' && target.attackStat >= target.spAttackStat) score += 55;
            if (itemId === 'x-sp-atk' && target.spAttackStat >= target.attackStat) score += 55;
            if (itemId === 'x-speed') score += 50;
            if (itemId === 'guard-spec') score += 45;
        } else {
            return 0; // Arriscado usar item de batalha com pouco HP ou sob pressão
        }
    }

    return score;
}

function evaluateItemGive(itemId: string, target: Pokemon, opponent: Pokemon): number {
    if (target.isFainted || target.heldItem) return -1;
    let score = 40; // Base score para equipar algo

    // --- PRIORIDADE MEGA EVOLUÇÃO ---
    // Normalização do nome para checar compatibilidade de Mega Pedra
    const lowerName = target.name.toLowerCase();
    
    // Tenta encontrar pedras compatíveis no mapa
    let validStones = POKEMON_TO_MEGA_STONES[lowerName];
    
    // Fallback: Se não encontrou pelo nome exato, tenta pela primeira palavra (ex: "Charizard" em "Charizard Shiny")
    if (!validStones) {
        const baseName = lowerName.split(' ')[0];
        validStones = POKEMON_TO_MEGA_STONES[baseName];
    }

    // Se a pedra sendo avaliada é compatível com este Pokémon, prioridade máxima
    if (validStones && validStones.includes(itemId)) {
        return 300; // Prioridade absoluta para habilitar Mega Evolução
    }

    const isPhysical = target.attackStat > target.spAttackStat;
    const isSpecial = target.spAttackStat > target.attackStat;

    // Itens Ofensivos
    if (itemId === 'life-orb') score += 80; // Item muito forte, alta prioridade
    if (itemId === 'choice-band' && isPhysical) score += 90;
    if (itemId === 'choice-specs' && isSpecial) score += 90;
    if (itemId === 'expert-belt') score += 70;
    if (itemId === 'muscle-band' && isPhysical) score += 60;
    if (itemId === 'wise-glasses' && isSpecial) score += 60;

    // Sinergias básicas
    if (itemId === 'leftovers') score += 65;
    if (itemId === 'sitrus-berry') score += 60;
    if (itemId === 'lum-berry') score += 55;
    if (itemId === 'rocky-helmet' && target.defenseStat > target.spDefenseStat) score += 65;
    if (itemId === 'assault-vest' && target.moves.every(m => m.damageClass !== 'status')) score += 70;

    return score;
}

// --- LÓGICA MINIMAX E SIMULAÇÃO ---

function cloneBattleState(state: BattleState): BattleState {
    return structuredClone(state);
}

function evaluateGameState(state: BattleState): number {
    let score = 0;

    const evaluateTeam = (team: Pokemon[], active: Pokemon | null, isBot: boolean) => {
        let teamScore = 0;
        
        team.forEach(p => {
            if (!p.isFainted) {
                teamScore += (p.hp / p.maxHP) * 100; 
                teamScore += 50; 
                
                if (p.statusEffects.burn || p.statusEffects.poison || p.statusEffects.paralysis || p.statusEffects.toxic || p.statusEffects.freeze || p.statusEffects.sleep) {
                    teamScore -= 20;
                }
            }
        });

        if (active && !active.isFainted) {
            const stages = active.statStages;
            teamScore += (stages.attack + stages.defense + stages.spAttack + stages.spDefense + stages.speed) * 10;
            if (active.statusEffects.confusion) teamScore -= 15;
        } else {
            teamScore -= 100;
        }

        return teamScore;
    };

    const botScore = evaluateTeam(state.team2, state.currentPokemon2, true);
    const oppScore = evaluateTeam(state.team1, state.currentPokemon1, false);

    return botScore - oppScore;
}

function getLegalActions(
    pokemon: Pokemon | null,
    team: Pokemon[],
    playerNum: 1 | 2,
    opponent: Pokemon | null,
    state: BattleState,
    moveLimitEnabled: boolean
): Action[] {
    const actions: Action[] = [];
    
    if (!pokemon || pokemon.isFainted) return [];

    const trapped = isTrapped(pokemon, opponent, state);

    // Movimentos
    if (pokemon.mustRecharge) {
        actions.push({ type: 'move', data: { name: 'recharge', displayName: 'Recarregar', priority: 0 }, user: pokemon, playerNum, tieBreaker: 0 });
    } else if (pokemon.chargingMove) {
        const move = pokemon.moves.find(m => m.name === pokemon.chargingMove);
        if (move) actions.push({ type: 'move', data: move, user: pokemon, playerNum, priority: move.priority, tieBreaker: 0 });
    } else if (pokemon.lockedMove) {
        const move = pokemon.moves.find(m => m.name === pokemon.lockedMove);
        if (move) actions.push({ type: 'move', data: move, user: pokemon, playerNum, priority: move.priority, tieBreaker: 0 });
        else actions.push({ type: 'move', data: { name: 'struggle', displayName: 'Debater-se', power: 50, type: 'normal' }, user: pokemon, playerNum, tieBreaker: 0 });
    } else {
        const validMoves = pokemon.moves.filter(m => {
            const isDisabled = pokemon.disabledMoves && pokemon.disabledMoves[m.name] && pokemon.disabledMoves[m.name] > 0;
            const hasPP = !moveLimitEnabled || m.uses > 0;
            return !isDisabled && hasPP;
        });

        if (validMoves.length === 0) {
            actions.push({ type: 'move', data: { name: 'struggle', displayName: 'Debater-se', power: 50, type: 'normal' }, user: pokemon, playerNum, tieBreaker: 0 });
        } else {
            validMoves.forEach(m => actions.push({ type: 'move', data: m, user: pokemon, playerNum, priority: m.priority, tieBreaker: 0 }));
        }
    }

    // Trocas
    if (!trapped) {
        const switchCandidates = team.filter(p => !p.isFainted && p.id !== pokemon.id);
        switchCandidates.forEach(p => {
            actions.push({ type: 'switch', data: p, user: pokemon, playerNum, priority: 6, tieBreaker: 0 });
        });
    }

    return actions;
}

function rehydrateActionForSimulation(originalAction: Action, simulationState: BattleState): Action | null {
    const playerNum = originalAction.playerNum;
    
    const simUser = playerNum === 1 ? simulationState.currentPokemon1 : simulationState.currentPokemon2;
    if (!simUser) return null;

    if (originalAction.type === 'move') {
        const moveName = originalAction.data.name;
        const simMove = simUser.moves.find(m => m.name === moveName) || originalAction.data;
        return { ...originalAction, user: simUser, data: simMove };
    } else if (originalAction.type === 'switch') {
        const targetId = originalAction.data.id;
        const team = playerNum === 1 ? simulationState.team1 : simulationState.team2;
        const simTarget = team.find(p => p.id === targetId);
        if (!simTarget) return null; 
        return { ...originalAction, user: simUser, data: simTarget };
    } else {
        return { ...originalAction, user: simUser };
    }
}

function simulateTurn(initialState: BattleState, botAction: Action, oppAction: Action, botConfigOverride?: Partial<BattleConfig>): BattleState {
    const state = cloneBattleState(initialState);
    const logs: LogEntry[] = []; 

    const simBotAction = rehydrateActionForSimulation(botAction, state);
    const simOppAction = rehydrateActionForSimulation(oppAction, state);

    if (!simBotAction || !simOppAction) return state;

    const actions = getSortedActions([simBotAction, simOppAction], state);

    for (const action of actions) {
        const userRef = action.user; 
        const targetRef = action.playerNum === 1 ? state.currentPokemon2 : state.currentPokemon1;

        if (!userRef || userRef.isFainted) continue;

        let currentConfig = SIMULATION_CONFIG;
        if (action === simBotAction && botConfigOverride) {
            currentConfig = { ...SIMULATION_CONFIG, ...botConfigOverride };
        }

        if (action.type === 'switch') {
            performSwitch(state, action.data, action.playerNum, currentConfig.weatherEnabled);
        } else if (action.type === 'move' && targetRef) {
            executeMove(
                state, 
                userRef, 
                targetRef, 
                action.data, 
                currentConfig, 
                undefined, 
                false, 
                action.shouldTerastallize,
                false,
                action.shouldMegaEvolve
            );
        }
    }

    processTurnEnd(state, SIMULATION_CONFIG);
    return state;
}

// --- LOGICA DE DEFENSIVE PIVOT (SWITCH PREDICTION) ---

function getMostDangerousMove(attacker: Pokemon, defender: Pokemon, weather: string, state: BattleState): Move | null {
    let maxDmg = -1;
    let bestMove: Move | null = null;

    for (const move of attacker.moves) {
        if (move.damageClass === 'status') continue;
        const dmg = estimateDamage(attacker, defender, move, weather, state);
        if (dmg > maxDmg) {
            maxDmg = dmg;
            bestMove = move;
        }
    }
    return bestMove;
}

function findDefensivePivot(
    team: Pokemon[], 
    incomingMove: Move, 
    attacker: Pokemon, 
    activePokemonId: number
): Pokemon | null {
    let bestPivot: Pokemon | null = null;
    let bestMultiplier = 1.0; // Procuramos resistências (< 1.0)

    for (const candidate of team) {
        if (candidate.isFainted || candidate.id === activePokemonId) continue;

        const eff = calculateTypeEffectiveness(
            incomingMove.type, 
            candidate.types, 
            candidate.ability, 
            attacker.ability,
            incomingMove.name
        );

        // Prioriza imunidades (0) > resistência dupla (0.25) > resistência simples (0.5)
        if (eff.multiplier < bestMultiplier) {
            bestMultiplier = eff.multiplier;
            bestPivot = candidate;
        }
    }
    
    return bestPivot;
}

// --- SELEÇÃO INTELIGENTE DE TROCA ---
export function chooseBestSwitch(candidates: Pokemon[], opponent: Pokemon): Pokemon | null {
    if (candidates.length === 0) return null;
    let bestCandidate = candidates[0];
    let bestScore = -Infinity;

    for (const candidate of candidates) {
        if (candidate.isFainted) continue;
        
        // Reutiliza a função de avaliação de matchup para consistência
        const score = evaluateSwitchMatchup(candidate, opponent);

        if (score > bestScore) {
            bestScore = score;
            bestCandidate = candidate;
        }
    }
    
    return bestCandidate;
}

// --- FUNÇÃO PRINCIPAL EXPORTADA ---

export function decideAIAction(
    aiPokemon: Pokemon, 
    opponentPokemon: Pokemon, 
    aiTeam: Pokemon[], 
    opponentTeam: Pokemon[], 
    weather: string, 
    moveLimitEnabled: boolean,
    inventory?: PlayerInventory,
    terastallizationEnabled: boolean = false, 
    teraUsed: boolean = false, 
    state?: BattleState,
    megaEvolutionEnabled: boolean = false,
    megaUsed: boolean = false
): Action {
    if (!state) {
        return getLegacyBestMove(aiPokemon, opponentPokemon, weather, state);
    }

    // Se o Pokémon estiver carregando um movimento, ele DEVE usar esse movimento.
    if (aiPokemon.chargingMove) {
        const move = aiPokemon.moves.find(m => m.name === aiPokemon.chargingMove);
        if (move) {
            return { type: 'move', data: move, user: aiPokemon, playerNum: 2, priority: move.priority };
        }
    }

    // Se o Pokémon estiver preso em um movimento (Outrage, etc.), ele DEVE usar esse movimento.
    if (aiPokemon.lockedMove) {
        const move = aiPokemon.moves.find(m => m.name === aiPokemon.lockedMove);
        if (move) {
            return { type: 'move', data: move, user: aiPokemon, playerNum: 2, priority: move.priority };
        } else {
            return { type: 'move', data: { name: 'struggle', displayName: 'Debater-se', power: 50, type: 'normal' }, user: aiPokemon, playerNum: 2, priority: 0 };
        }
    }

    // Se o Pokémon precisa recarregar (Hyper Beam, etc.), ele DEVE recarregar.
    if (aiPokemon.mustRecharge) {
        return { type: 'move', data: { name: 'recharge', displayName: 'Recarregar', priority: 0 }, user: aiPokemon, playerNum: 2, priority: 0 };
    }

    try {
        const perceivedOpponent = getPerceivedOpponent(opponentPokemon);
        const perceptionState = cloneBattleState(state);
        
        if (perceptionState.currentPokemon1?.id === opponentPokemon.id) {
            perceptionState.currentPokemon1 = perceivedOpponent;
        } else if (perceptionState.currentPokemon2?.id === opponentPokemon.id) {
            perceptionState.currentPokemon2 = perceivedOpponent;
        }

        let simulatedAiPokemon: Pokemon | null = null;
        let simulatedAiTeam: Pokemon[] = [];

        if (perceptionState.currentPokemon1?.id === aiPokemon.id) {
            simulatedAiPokemon = perceptionState.currentPokemon1;
            simulatedAiTeam = perceptionState.team1;
        } else if (perceptionState.currentPokemon2?.id === aiPokemon.id) {
            simulatedAiPokemon = perceptionState.currentPokemon2;
            simulatedAiTeam = perceptionState.team2;
        } else {
            simulatedAiPokemon = perceptionState.team1.find(p => p.id === aiPokemon.id) || 
                                 perceptionState.team2.find(p => p.id === aiPokemon.id) || 
                                 aiPokemon; 
            simulatedAiTeam = perceptionState.team1.some(p => p.id === simulatedAiPokemon?.id) ? perceptionState.team1 : perceptionState.team2;
        }

        // 0. DEFENSIVE PIVOT (New Layer - Switch Prediction)
        // Verifica se estamos em perigo de OHKO e se somos mais lentos
        if (simulatedAiPokemon && !isTrapped(simulatedAiPokemon, perceivedOpponent, perceptionState)) {
             const speedMatchup = evaluateSpeedMatchup(simulatedAiPokemon, perceivedOpponent, perceptionState);
             
             // Se formos mais lentos, vamos tomar o golpe primeiro.
             if (speedMatchup === 'slower') {
                 const dangerousMove = getMostDangerousMove(perceivedOpponent, simulatedAiPokemon, weather, perceptionState);
                 
                 if (dangerousMove) {
                     const estimatedDmg = estimateDamage(perceivedOpponent, simulatedAiPokemon, dangerousMove, weather, perceptionState);
                     
                     // Se o dano estimado for letal (>= HP atual)
                     if (estimatedDmg >= simulatedAiPokemon.hp) {
                         const pivot = findDefensivePivot(simulatedAiTeam, dangerousMove, perceivedOpponent, simulatedAiPokemon.id);
                         
                         if (pivot) {
                             // Encontra o Pokémon real na equipe original para retornar a ação correta
                             const realPivot = aiTeam.find(p => p.id === pivot.id);
                             if (realPivot) {
                                return {
                                    type: 'switch',
                                    data: realPivot,
                                    user: aiPokemon,
                                    playerNum: 2,
                                    priority: 6
                                };
                             }
                         }
                     }
                 }
             }
        }

        // 1. ANÁLISE DE TROCA PROATIVA (Turno 1+ e Matchups Ruins)
        // Antes de considerar itens ou movimentos, verifica se o matchup atual é terrível.
        if (!isTrapped(simulatedAiPokemon, perceivedOpponent, perceptionState)) {
            const currentMatchupScore = evaluateSwitchMatchup(simulatedAiPokemon, perceivedOpponent);
            // Limiar negativo (-40) indica desvantagem clara (ex: tipo fraco, lento, sem golpes efetivos)
            if (currentMatchupScore < -40) {
                const candidates = simulatedAiTeam.filter(p => !p.isFainted && p.id !== simulatedAiPokemon?.id);
                const bestSwitch = chooseBestSwitch(candidates, perceivedOpponent);
                
                if (bestSwitch) {
                    const switchScore = evaluateSwitchMatchup(bestSwitch, perceivedOpponent);
                    // Se a troca for significativamente melhor (+50 de diferença), força a troca.
                    // Isso evita trocas para opções apenas marginalmente melhores que poderiam causar loops.
                    if (switchScore > currentMatchupScore + 50) {
                        return mapActionBackToReal({
                            type: 'switch',
                            data: bestSwitch,
                            user: simulatedAiPokemon,
                            playerNum: 2,
                            priority: 6
                        }, aiPokemon, aiTeam);
                    }
                }
            }
        }

        // 2. ANÁLISE DE USO DE ITENS (Alta Prioridade)
        if (inventory) {
            const bestItemAction = getBestItemAction(inventory, simulatedAiPokemon!, simulatedAiTeam, perceivedOpponent, perceptionState);
            // Se a pontuação do item for alta (> 80), usa imediatamente
            // Isso cobre curas críticas e revives
            if (bestItemAction && bestItemAction.score > 80) {
                return mapActionBackToReal(bestItemAction.action, aiPokemon, aiTeam);
            }
        }

        // 3. SELEÇÃO DE MOVIMENTO (Minimax)
        let aiActions = getLegalActions(simulatedAiPokemon, simulatedAiTeam, 2, perceivedOpponent, perceptionState, moveLimitEnabled);
        
        if (aiActions.length === 1) {
            return mapActionBackToReal(aiActions[0], aiPokemon, aiTeam);
        }

        aiActions = filterIntelligentSwitches(aiActions, perceivedOpponent);

        const oppPlayerNum = simulatedAiPokemon === perceptionState.currentPokemon1 ? 2 : 1;
        let oppActions = getLegalActions(perceivedOpponent, opponentTeam, oppPlayerNum as 1|2, simulatedAiPokemon, perceptionState, moveLimitEnabled);
        
        oppActions.sort((a, b) => {
            const scoreA = getActionHeuristicScore(a, perceivedOpponent, simulatedAiPokemon!, weather, perceptionState);
            const scoreB = getActionHeuristicScore(b, perceivedOpponent, simulatedAiPokemon!, weather, perceptionState);
            return scoreB - scoreA;
        });
        
        const prunedOppActions = oppActions.slice(0, MAX_OPPONENT_ACTIONS);

        let bestAction: Action | null = null;
        let bestScore = -Infinity;

        for (const myAction of aiActions) {
            let minScoreForThisAction = Infinity; 

            for (const theirAction of prunedOppActions) {
                let score = 0;

                // EXPECTIMAX LOGIC
                if (myAction.type === 'move') {
                    const move = myAction.data as Move;
                    const hitChance = calculateHitChance(move, simulatedAiPokemon, perceivedOpponent, weather, perceptionState.gravity);
                    
                    let probHit = 1.0;
                    if (hitChance !== '∞') {
                        probHit = (hitChance as number) / 100;
                    }

                    // Optimization: If hit chance is 100%, skip miss simulation
                    if (probHit >= 1.0) {
                        const simulatedState = simulateTurn(perceptionState, myAction, theirAction, { forceAccuracyOutcome: 'hit', fixedRoll: 0.925 });
                        score = evaluateGameState(simulatedState);
                    } else {
                        // Node Chance: Hit
                        const stateHit = simulateTurn(perceptionState, myAction, theirAction, { forceAccuracyOutcome: 'hit', fixedRoll: 0.925 });
                        const scoreHit = evaluateGameState(stateHit);

                        // Node Chance: Miss
                        const stateMiss = simulateTurn(perceptionState, myAction, theirAction, { forceAccuracyOutcome: 'miss' });
                        const scoreMiss = evaluateGameState(stateMiss);

                        score = (scoreHit * probHit) + (scoreMiss * (1 - probHit));
                        
                        // Debug Log (Optional)
                        // console.log(`[AI] Expectimax for ${move.name}: Hit(${probHit.toFixed(2)})=${scoreHit.toFixed(0)}, Miss=${scoreMiss.toFixed(0)} => EV=${score.toFixed(0)}`);
                    }

                } else {
                    // Switch is deterministic
                    const simulatedState = simulateTurn(perceptionState, myAction, theirAction);
                    score = evaluateGameState(simulatedState);
                }

                if (score < minScoreForThisAction) {
                    minScoreForThisAction = score;
                }
            }

            // Redundância Check no Score
            if (myAction.type === 'move') {
                const move = myAction.data as Move;
                
                // Penaliza movimentos imunes severamente na heurística
                if (move.damageClass !== 'status') {
                    const eff = calculateTypeEffectiveness(move.type, perceivedOpponent.types, perceivedOpponent.ability);
                    if (eff.multiplier === 0) {
                        minScoreForThisAction -= 1000;
                    }
                }

                if (move.damageClass === 'status') {
                    // Penaliza redundância de status
                    if (move.effect && ['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'].includes(move.effect.status)) {
                        if (Object.keys(perceivedOpponent.statusEffects).length > 0) {
                            minScoreForThisAction -= 500;
                        }
                    }
                    // Penaliza buffs em stats maximizados
                    if (move.effect && move.effect.status.includes('-up')) {
                        const stat = move.effect.status.replace('-up', '');
                        // @ts-ignore
                        if (simulatedAiPokemon.statStages[stat] >= 6) minScoreForThisAction -= 500;
                    }
                    // Penaliza debuffs em stats minimizados
                    if (move.effect && move.effect.status.includes('-down')) {
                        const stat = move.effect.status.replace('-down', '');
                        // @ts-ignore
                        if (perceivedOpponent.statStages[stat] <= -6) minScoreForThisAction -= 500;
                    }
                }
            }

            if (minScoreForThisAction > bestScore) {
                bestScore = minScoreForThisAction;
                bestAction = myAction;
            }
        }

        const chosenAction = bestAction || aiActions[0];

        // --- MEGA EVOLUTION LOGIC ---
        // Se a Mega Evolução estiver habilitada e disponível, a IA sempre opta por usá-la imediatamente
        // A verificação !isTerastallized impede o uso simultâneo.
        if (chosenAction && chosenAction.type === 'move' && megaEvolutionEnabled && !megaUsed && aiPokemon.megaProfile && !aiPokemon.isMega && !aiPokemon.isTerastallized) {
            chosenAction.shouldMegaEvolve = true;
        }

        // --- TERASTALLIZATION LOGIC ---
        // A IA considera Terastalização se não estiver Mega Evoluindo e não for Mega.
        if (chosenAction && terastallizationEnabled && !teraUsed && !aiPokemon.isTerastallized && chosenAction.type === 'move' && aiPokemon.teraType && !aiPokemon.isMega) {
            // Não usa Tera se for Mega Evoluir (Mecânicas geralmente excludentes)
            if (!chosenAction.shouldMegaEvolve) {
                const move = chosenAction.data as Move;
                if (move.type === aiPokemon.teraType || aiPokemon.hp < aiPokemon.maxHP * 0.3) {
                    if (Math.random() < 0.4 || aiPokemon.hp < aiPokemon.maxHP * 0.25) {
                        chosenAction.shouldTerastallize = true;
                    }
                }
            }
        }

        return mapActionBackToReal(chosenAction, aiPokemon, aiTeam);

    } catch (e) {
        console.error("Erro Crítico na IA Minimax (Usando Fallback):", e);
        return getLegacyBestMove(aiPokemon, opponentPokemon, weather, state);
    }
}

function mapActionBackToReal(simAction: Action, realUser: Pokemon, realTeam: Pokemon[]): Action {
    let mappedAction: Action;
    if (simAction.type === 'move') {
        const moveName = simAction.data.name;
        const realMove = realUser.moves.find(m => m.name === moveName) || simAction.data;
        mappedAction = { ...simAction, user: realUser, data: realMove };
    } else if (simAction.type === 'switch') {
        const targetId = simAction.data.id;
        const realTarget = realTeam.find(p => p.id === targetId);
        mappedAction = { ...simAction, user: realUser, data: realTarget || simAction.data };
    } else if (simAction.type === 'item') {
        // Mapeia item de volta. O targetId já é um ID numérico, então deve bater.
        mappedAction = { ...simAction, user: realUser };
    } else {
        mappedAction = { ...simAction, user: realUser };
    }
    
    // Remove tieBreaker so it gets generated properly in coordinator.ts for the actual battle
    delete mappedAction.tieBreaker;
    delete mappedAction.calculatedPriority;
    
    return mappedAction;
}

// --- HELPERS E HEURÍSTICAS ---

function getLegacyBestMove(attacker: Pokemon, defender: Pokemon, weather: string, state?: BattleState): Action {
    const moves = attacker.moves;
    if (!moves || moves.length === 0) return { type: 'move', data: {name: 'struggle', displayName: 'Struggle', power: 50, type: 'normal'}, user: attacker, playerNum: 2 };
    
    let bestMove = moves[0];
    let maxScore = -Infinity;

    for (const move of moves) {
        const score = getMoveScore(move, attacker, defender, weather, state);
        if (score > maxScore) {
            maxScore = score;
            bestMove = move;
        }
    }
    return { type: 'move', data: bestMove, user: attacker, playerNum: 2, priority: bestMove.priority || 0 };
}

function getActionHeuristicScore(action: Action, user: Pokemon, target: Pokemon, weather: string, state?: BattleState): number {
    if (action.type === 'move') {
        return getMoveScore(action.data, user, target, weather, state);
    } else if (action.type === 'switch') {
        return evaluateSwitchMatchup(action.data, target);
    }
    return 0;
}

function filterIntelligentSwitches(actions: Action[], opponent: Pokemon): Action[] {
    const moves = actions.filter(a => a.type === 'move');
    const switches = actions.filter(a => a.type === 'switch');

    if (moves.length > 0) {
        const smartSwitches = switches.filter(s => {
            const score = evaluateSwitchMatchup(s.data, opponent);
            return score > 50; 
        });
        return [...moves, ...smartSwitches];
    }
    return actions;
}

// Nova Função de Stall Heuristics
function evaluateStallPotential(
    move: Move, 
    attacker: Pokemon, 
    defender: Pokemon, 
    state: BattleState | undefined, 
    weather: string
): number {
    let bonus = 0;

    // 1. Lógica para PROTECT/DETECT e variantes
    const protectMoves = ['protect', 'detect', 'spiky-shield', 'kings-shield', 'baneful-bunker', 'obstruct', 'silk-trap', 'burning-bulwark'];
    if (protectMoves.includes(move.name)) {
        // Penalidade massiva se já usou (chance de falha)
        if ((attacker.protectCounter || 0) > 0) {
            return -1000;
        }

        // Bônus base por scouting (descobrir o que o oponente vai fazer)
        bonus += 20;

        // Se oponente tem status que causa dano (Burn/Toxic/Poison), proteger é ótimo para acumular dano neles
        if (defender.statusEffects.burn || defender.statusEffects.toxic || defender.statusEffects.poison || defender.statusEffects['leech-seed']) {
            bonus += 150;
        }

        // Habilidade Pressure: Wasta PP do oponente
        if (attacker.ability === 'pressure') {
            bonus += 50;
        }
        
        // Wish: Se usou Wish no turno anterior, proteger garante a cura
        if (attacker.statusEffects['wish']) {
            bonus += 200;
        }

        if (state) {
            // Previsão de Dano para saber se vale a pena proteger agora
            const dangerousMove = getMostDangerousMove(defender, attacker, weather, state);
            if (dangerousMove) {
                const dmg = estimateDamage(defender, attacker, dangerousMove, weather, state);
                const damagePercent = (dmg / attacker.maxHP) * 100;

                // Se o dano for alto (>40%), proteger pode ser útil para Leftovers recovery ou mind games
                if (damagePercent > 40) {
                    bonus += 80;
                }

                // Se o movimento perigoso tem pouco PP (<= 5) e temos Pressure, prioridade sobe
                if (dangerousMove.uses <= 5) {
                    bonus += 100;
                }
            }
        }
    }

    // 2. Lógica para HEALING
    const healingMoves = ['recover', 'roost', 'slack-off', 'soft-boiled', 'milk-drink', 'moonlight', 'morning-sun', 'synthesis', 'shore-up', 'heal-order'];
    if (healingMoves.includes(move.name)) {
        const hpPercent = attacker.hp / attacker.maxHP;
        
        // Anti-Loop: Não curar se estiver quase cheio
        if (hpPercent >= 0.9) return -500;

        if (state) {
            const dangerousMove = getMostDangerousMove(defender, attacker, weather, state);
            const estimatedDmg = dangerousMove ? estimateDamage(defender, attacker, dangerousMove, weather, state) : 0;
            
            // Cura média de 50%
            const healAmount = attacker.maxHP * 0.5;

            // Speed check
            const speedMatchup = evaluateSpeedMatchup(attacker, defender, state);
            
            if (speedMatchup === 'faster') {
                // Atacamos primeiro (curamos). Depois levamos dano.
                // HP Final = Atual + Cura - Dano.
                // Se HP Final > Atual, estamos ganhando o stall war (loop de cura).
                if (attacker.hp + healAmount - estimatedDmg > attacker.hp) {
                     bonus += 150;
                }
                // Se o HP está crítico (<30%), prioriza cura para sobreviver
                if (hpPercent < 0.3 && attacker.hp + healAmount > estimatedDmg) {
                    bonus += 200;
                }
            } else {
                // Somos mais lentos. Levamos dano primeiro.
                // Se Dano >= Atual, morremos antes de curar.
                if (estimatedDmg >= attacker.hp) {
                    return -1000; // Waste turn
                }
                // Sobrevivemos. HP Final = Atual - Dano + Cura.
                // Se HP Final > Atual, bom.
                if ((attacker.hp - estimatedDmg + healAmount) > attacker.hp) {
                    bonus += 150;
                }
                 // Se o HP está crítico mas sobrevivemos ao hit, cura é essencial
                if (hpPercent < 0.3) {
                    bonus += 200;
                }
            }
        }
    }

    return bonus;
}

function getMoveScore(
    move: Move, 
    attacker: Pokemon, 
    defender: Pokemon, 
    weather: string,
    state?: BattleState
): number {
    let score = 0;
    
    // --- VERIFICAÇÃO DE CONDIÇÕES DE FALHA (CRÍTICO) ---
    if (checkMoveFailsCondition(move, attacker, defender, state)) {
        return -2000;
    }

    // Verificação de Imunidade (Bloqueio Rígido)
    const eff = calculateTypeEffectiveness(move.type, defender.types, defender.ability);
    if (move.damageClass !== 'status' && eff.multiplier === 0) {
        return -1000;
    }

    // Verificação de Redundância
    if (move.damageClass === 'status' && move.effect) {
        // Status Condition Check
        if (['burn', 'paralysis', 'poison', 'toxic', 'sleep', 'freeze'].includes(move.effect.status)) {
            // Se o alvo já tem QUALQUER status principal, não use outro golpe de status
            if (Object.keys(defender.statusEffects).length > 0) {
                return -500;
            }
            // Verifica Substitute e Magic Bounce
            if (defender.statusEffects['substitute']) {
                return -500;
            }
            if (defender.ability === 'magic-bounce') {
                return -500;
            }
        }
        // Stat Buff Check
        if (move.effect.status.includes('-up')) {
            const parts = move.effect.status.split('-');
            const stat = parts[0];
            // @ts-ignore
            if (attacker.statStages[stat] >= 6) return -500;
        }
        // Stat Debuff Check
        if (move.effect.status.includes('-down')) {
            const parts = move.effect.status.split('-');
            const stat = parts[0];
            // @ts-ignore
            if (defender.statStages[stat] <= -6) return -500;
            if (defender.statusEffects['substitute'] || defender.ability === 'magic-bounce' || defender.ability === 'clear-body' || defender.ability === 'white-smoke') return -500;
        }
        // Healing Check
        if (move.effect.status === 'heal' && attacker.hp > attacker.maxHP * 0.9) return -500;
    }

    // NOVO: Stall Potential (Recurso e Sobrevivência)
    score += evaluateStallPotential(move, attacker, defender, state, weather);

    // Clima e Terreno
    if (weather === 'sun' || weather === 'harsh-sun') {
        if (move.type === 'fire') score += 30;
        if (move.name === 'solar-beam' || move.name === 'solar-blade') score += 50;
    } else {
        if (move.name === 'solar-beam' || move.name === 'solar-blade') score -= 100;
    }
    if (weather === 'rain' || weather === 'heavy-rain') {
        if (move.type === 'water') score += 30;
        if (move.name === 'hurricane' || move.name === 'thunder') score += 30;
    }

    // Facade
    if (move.name === 'facade' && (attacker.statusEffects.burn || attacker.statusEffects.poison || attacker.statusEffects.toxic || attacker.statusEffects.paralysis)) {
        score += 50;
    }

    // Proteção do oponente
    if (defender.protectCounter && defender.protectCounter > 0) {
        if (move.damageClass !== 'status') {
            score -= 100; // Alta chance de falhar se ele usar de novo, ou ele não vai usar, mas é arriscado
        } else if (move.effect && move.effect.status.includes('-up')) {
            score += 50; // Prioriza setup
        }
    }

    if (move.damageClass !== 'status') {
        let estimatedDmg = estimateDamage(attacker, defender, move, weather, state);
        
        if (move.name === 'dream-eater' && !defender.statusEffects.sleep) {
            estimatedDmg = 0;
        }

        const hpPercent = (estimatedDmg / defender.maxHP) * 100;
        score += hpPercent; 

        if (estimatedDmg >= defender.hp) {
            score += 200; // Prioriza nocaute
        }
    } else {
        if (move.effect?.status) {
            const status = move.effect.status;
            if (['paralysis', 'burn', 'sleep', 'poison', 'toxic'].includes(status)) {
                if (Object.keys(defender.statusEffects).length === 0) score += 60;
            }
            if (status === 'heal' && attacker.hp < attacker.maxHP * 0.5) score += 100;
            if (status.includes('-up')) score += 40;
        }
    }

    if (state) {
        const speedMatchup = evaluateSpeedMatchup(attacker, defender, state);
        if (speedMatchup === 'slower' && attacker.hp < attacker.maxHP * 0.25 && (move.priority || 0) > 0) {
            score += 500; // Prioridade desesperada
        }
    }

    return score;
}

function evaluateSwitchMatchup(candidate: Pokemon, opponent: Pokemon): number {
    if (candidate.isFainted) return -9999;
    let score = 0;

    for (const oppType of opponent.types) {
        const eff = calculateTypeEffectiveness(oppType, candidate.types, candidate.ability);
        if (eff.multiplier <= 0.5) score += 50;
        else if (eff.multiplier >= 2.0) score -= 100;
    }

    let bestMult = 0;
    for (const move of candidate.moves) {
        if (move.damageClass === 'status') continue;
        const eff = calculateTypeEffectiveness(move.type, opponent.types, opponent.ability);
        if (eff.multiplier > bestMult) bestMult = eff.multiplier;
    }
    if (bestMult >= 2) score += 50;
    else if (bestMult <= 0.5) score -= 50;

    if (candidate.speedStat > opponent.speedStat) score += 20;
    
    // Bônus de HP (Prefere Pokémon saudáveis)
    score += (candidate.hp / candidate.maxHP) * 20;

    return score;
}

function evaluateSpeedMatchup(aiMon: Pokemon, opponent: Pokemon, state: BattleState): 'faster' | 'slower' | 'tie' {
    const weather = state.weather;
    
    // Identifica se Tailwind está ativo para a IA e para o oponente
    const aiIsP1 = state.team1.some(p => p.id === aiMon.id);
    const aiTailwind = aiIsP1 ? state.p1Hazards.tailwind > 0 : state.p2Hazards.tailwind > 0;
    const oppTailwind = aiIsP1 ? state.p2Hazards.tailwind > 0 : state.p1Hazards.tailwind > 0;

    const aiSpeed = getEffectiveSpeed(aiMon, weather, aiTailwind);
    const oppSpeed = getEffectiveSpeed(opponent, weather, oppTailwind);

    if (state.trickRoomActive) {
        if (aiSpeed < oppSpeed) return 'faster';
        if (aiSpeed > oppSpeed) return 'slower';
        return 'tie';
    }

    if (aiSpeed > oppSpeed) return 'faster';
    if (aiSpeed < oppSpeed) return 'slower';
    return 'tie';
}
