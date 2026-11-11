
import { Pokemon, Move, StatStages, BattleState, LogEntry } from '../../../../types';
import { STAT_NAMES_PT } from '../../../../data/pokemon';
import { SOUND_MOVES } from '../../../../data/moves/categories';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Competitive from '../abilities/competitive';
import * as Defiant from '../abilities/defiant';
import * as WhiteSmoke from '../abilities/white_smoke';
import * as BigPecks from '../abilities/big_pecks';
import * as FullMetalBody from '../abilities/full_metal_body';
import * as ClearBody from '../abilities/clear_body';
import * as HyperCutter from '../abilities/hyper_cutter';
import * as Opportunist from '../abilities/opportunist';
import * as Simple from '../abilities/simple';
import * as NeutralizingGas from '../abilities/neutralizing_gas';
import * as FlowerVeil from '../abilities/flower_veil';
import * as Illuminate from '../abilities/illuminate';
import * as MirrorArmor from '../abilities/mirror_armor';
import * as Infiltrator from '../abilities/infiltrator';
import * as KeenEye from '../abilities/keen_eye';

export function applyMoveStatChange(
    target: Pokemon, 
    effectStatus: string, 
    logs: LogEntry[], 
    isOpponentSource: boolean = true,
    ignoresAbilities: boolean = false,
    moveName?: string,
    state?: BattleState,
    source?: Pokemon // Parâmetro opcional para suportar reflexão e Infiltrator
) {
    const statMap: any = { 
        'attack': 'attack', 'defense': 'defense', 'speed': 'speed', 
        'spDefense': 'spDefense', 'spAttack': 'spAttack',
        'accuracy': 'accuracy', 'evasion': 'evasion' 
    };
    const parts = effectStatus.split('-');
    const dir = parts.pop();
    const statName = parts.join('-');
    
    if (statMap[statName]) {
        // Bloqueios de redução (dir === 'down') vindos do oponente
        if (dir === 'down' && isOpponentSource) {
            
            // 0. Verificação de Substitute
            if (target.statusEffects['substitute']) {
                const isSoundMove = moveName && SOUND_MOVES.includes(moveName);
                if (!isSoundMove && (!source || !Infiltrator.canInfiltrate(source, state))) {
                    log(logs, `O Substitute protegeu ${target.name} da queda de status!`, 'text-gray-500 italic text-[10px]');
                    return;
                }
            }

            // 1. Verificação de Névoa (Mist)
            if (state) {
                const isP1 = state.currentPokemon1?.id === target.id;
                const hazards = isP1 ? state.p1Hazards : state.p2Hazards;
                
                if (hazards.mist > 0) {
                    // Verifica Infiltrator (se houver fonte conhecida)
                    let bypassMist = false;
                    if (source && Infiltrator.canInfiltrate(source, state)) {
                        bypassMist = true;
                    }

                    if (!bypassMist) {
                        log(logs, `A névoa protegeu ${target.name} da redução de atributos!`, 'text-blue-300 italic text-xs');
                        return;
                    }
                }
            }

            // Lógica de Mirror Armor (Reflexão)
            if (MirrorArmor.shouldReflect(target, ignoresAbilities, logs)) {
                if (source && !source.isFainted) {
                    // Aplica a redução na fonte (refletido)
                    // isOpponentSource = false para evitar loops infinitos e indicar que agora é "auto-induzido" ou "refletido"
                    applyMoveStatChange(
                        source, 
                        effectStatus, 
                        logs, 
                        false, 
                        false, 
                        moveName, 
                        state
                    );
                }
                return; // Impede que o alvo receba a redução
            }

            if (FullMetalBody.isImmuneToStatDrops(target)) {
                log(logs, `O Corpo Metálico de ${target.name} impediu a redução de seus atributos!`, 'text-gray-500 italic text-xs');
                return;
            }

            if (FlowerVeil.isImmuneToStatDrops(target, ignoresAbilities)) {
                log(logs, `O Véu de Flor protege os atributos de ${target.name}!`, 'text-gray-500 italic text-xs');
                return;
            }

            if (ClearBody.isImmuneToStatDrops(target, ignoresAbilities) || WhiteSmoke.isImmuneToStatDrops(target, ignoresAbilities)) {
                log(logs, `${target.name} impediu a redução de seus atributos com sua habilidade!`, 'text-gray-500 italic text-xs');
                return;
            }

            if (statName === 'attack' && HyperCutter.isImmuneToAttackDrop(target, ignoresAbilities)) {
                log(logs, `O Hiper Cortador de ${target.name} impediu a redução de seu Ataque!`, 'text-gray-500 italic text-xs');
                return;
            }

            if (statName === 'defense' && BigPecks.isImmuneToDefenseDrop(target, ignoresAbilities)) {
                log(logs, `Os Peitorais de ${target.name} impediram a redução de sua Defesa!`, 'text-gray-500 italic text-xs');
                return;
            }

            // Iluminação (Illuminate) Proteção de Precisão
            if (statName === 'accuracy' && Illuminate.isAccuracyDropImmune(target, ignoresAbilities)) {
                log(logs, `A Iluminação de ${target.name} impediu a redução de sua precisão!`, 'text-gray-500 italic text-xs');
                return;
            }

            // Olhar Aguçado (Keen Eye) / Olho da Mente (Mind's Eye) Proteção de Precisão
            if (statName === 'accuracy' && KeenEye.isImmuneToAccuracyDrop(target, ignoresAbilities)) {
                const abilityName = target.ability === 'minds-eye' ? 'Olho da Mente' : 'Olhar Aguçado';
                log(logs, `A habilidade ${abilityName} de ${target.name} impediu a redução de precisão!`, 'text-gray-500 italic text-xs');
                return;
            }
        }

        // Determina a magnitude oficial do movimento
        let magnitude = 1;
        const cleanName = (moveName || '').trim().toLowerCase();

        if (cleanName) {
            // Movimentos que alteram em 2 estágios (tanto para cima quanto para baixo)
            const magnitudeTwoMoves = [
                'swords-dance', 'nasty-plot', 'iron-defense', 'amnesia', 'agility', 
                'rock-polish', 'autotomize', 'barrier', 'acid-armor', 
                'victory-dance', 'shell-smash', 'shift-gear',
                'acid-spray', 'screech', 'minimize', 'swagger', 'charm', 'feather-dance',
                'overheat', 'draco-meteor', 'leaf-storm', 'fleur-cannon', 'psycho-boost',
                'captivate', 'sweet-scent', 'stuff-cheeks', 'eerie-impulse', 'acupressure',
                'seed-flare', 'spin-out'
            ];
            const plusThreeMoves = ['cotton-guard', 'tail-glow'];
            
            if (magnitudeTwoMoves.includes(cleanName)) {
                magnitude = 2;
            }
            if (plusThreeMoves.includes(cleanName)) {
                magnitude = 3;
            }
            if (cleanName === 'shell-smash') {
                magnitude = dir === 'up' ? 2 : 1;
            }
            if (cleanName === 'growth' && state?.weather === 'sun') {
                magnitude = 2;
            }
        }

        let change = dir === 'up' ? magnitude : -magnitude;
        
        // Aplica Do Contra (Contrary)
        if (target.ability === 'contrary') change *= -1;
        
        // Aplica Simples (Simple)
        const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;
        if (!ignoresAbilities) {
            change = Simple.getModifiedStatChange(target, change, isGasActive);
        }
        
        const currentStage = target.statStages[statMap[statName] as keyof StatStages];
        
        // Verifica se é possível aplicar a mudança (não exceder +6 ou -6)
        if ((change > 0 && currentStage < 6) || (change < 0 && currentStage > -6)) {
            const finalChange = change > 0 
                ? Math.min(6 - currentStage, change) 
                : Math.max(-6 - currentStage, change);

            target.statStages[statMap[statName] as keyof StatStages] += finalChange;
            
            // Lógica Paranóica de Intensidade de Texto
            let intensity = '';
            const absChange = Math.abs(finalChange);
            
            if (absChange >= 3) {
                // Magnitude extrema (>= 3)
                intensity = finalChange > 0 ? 'aumentou drasticamente' : 'diminuiu drasticamente';
            } else if (absChange >= 2) {
                // Magnitude alta (>= 2)
                intensity = finalChange > 0 ? 'aumentou muito' : 'diminuiu muito';
            } else {
                // Magnitude normal (1)
                intensity = finalChange > 0 ? 'aumentou' : 'diminuiu';
            }

            const color = finalChange > 0 ? 'text-green-600' : 'text-red-600';
            const statLabel = STAT_NAMES_PT[statName] || statName;
            
            log(logs, `${statLabel} de ${target.name} ${intensity}!`, color);
            
            // LOGICA ESPECIAL PARA MINIMIZE
            if (cleanName === 'minimize' && finalChange > 0) {
                target.statusEffects['minimize'] = { turns: -1 };
            }

            // Lógica para Lash Out (Descontar)
            if (finalChange < 0) {
                target.statusEffects['stat-dropped'] = { turns: 1 };
            }

            // Gatilho Oportunista
            if (finalChange > 0 && state) {
                Opportunist.handleOpportunist(target, statMap[statName], finalChange, state, logs);
            }

            // Gatilhos de Habilidades Reativas
            if (finalChange < 0 && isOpponentSource) {
                if (target.ability === 'competitive') {
                    Competitive.triggerCompetitive(target, logs);
                }
                if (target.ability === 'defiant') {
                    Defiant.triggerDefiant(target, logs);
                }
            }
        } else {
            const action = change > 0 ? 'aumentado' : 'reduzido';
            log(logs, `${target.name} não pode ter ${STAT_NAMES_PT[statName] || statName} ${action} mais!`, 'text-gray-500 italic text-xs');
        }
    }
}

export function handleAllStatsUp(
    attacker: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Ancient Power, Silver Wind, Ominous Wind
    // Aumenta Attack, Defense, SpAttack, SpDefense, Speed em 1 estágio.
    const stats = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'];
    
    stats.forEach(stat => {
        applyMoveStatChange(
            attacker, 
            `${stat}-up`, 
            logs, 
            false, // isOpponentSource: False (Self-buff)
            false, // ignoresAbilities
            undefined, // moveName undefined -> magnitude 1
            state
        );
    });
}

export function handleSecondaryStatChanges(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    logs: LogEntry[],
    state?: BattleState
) {
    if (!move.effect) return;
    const status = move.effect.status;
    
    // Heurística para efeitos secundários:
    // Aumentos (up) afetam o usuário (ex: Flame Charge).
    // Reduções (down) afetam o alvo (ex: Crunch).
    let target = defender;
    let isOpponentSource = true;
    
    if (status.includes('-up')) {
        target = attacker;
        isOpponentSource = false;
    }

    if (target.isFainted) return;

    const ignoresAbilities = ['mold-breaker', 'teravolt', 'turboblaze'].includes(attacker.ability);

    applyMoveStatChange(
        target,
        status,
        logs,
        isOpponentSource,
        ignoresAbilities,
        move.name,
        state,
        attacker // source
    );
}
