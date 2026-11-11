
import { BattleState, Pokemon, LogEntry } from '../../../types';
import { ITEMS_DATA } from '../../../data/items';
import { log } from '../utils';
import * as StatusEffect from '../../effectHandlers';
import * as Multitype from './abilities/multitype';
import * as RKSSystem from './abilities/rks_system';

export function executeItemAction(
    state: BattleState,
    user: Pokemon,
    target: Pokemon,
    itemId: string,
    actionType: 'use' | 'give',
    logs: LogEntry[],
    playerNum: 1 | 2,
    moveName?: string // Argumento opcional adicionado
): { newState: BattleState } {
    const itemData = ITEMS_DATA[itemId];
    if (!itemData) {
        log(logs, `Item ${itemId} inválido!`, 'text-red-500');
        return { newState: state };
    }

    // --- FIX CRÍTICO: Decremento de Inventário ---
    // Garante que o item seja removido do inventário do jogador correspondente
    const inventory = playerNum === 1 ? state.p1Inventory : state.p2Inventory;
    const itemIndex = inventory.items.findIndex(i => i.id === itemId);
    
    if (itemIndex > -1) {
        inventory.items[itemIndex].quantity--;
        if (inventory.items[itemIndex].quantity <= 0) {
            inventory.items.splice(itemIndex, 1);
        }
    } else {
        // Se a IA tentar usar um item que não existe (não deveria acontecer, mas por segurança)
        // podemos logar ou impedir. Como é um handler de execução, assumimos validação prévia,
        // mas o fluxo continua para não travar.
    }
    // ---------------------------------------------

    const itemName = itemData.name;
    const trainerName = playerNum === 1 ? 'Você' : 'Oponente';
    const trainerColor = playerNum === 1 ? 'text-green-600' : 'text-red-600';

    if (actionType === 'give') {
        // Lógica de "Dar" (Troca de item)
        // Se o Pokémon já tiver um item, ele é substituído (na mecânica simples, o antigo some)
        const oldItem = target.heldItem;
        
        // Se o item antigo era Choice, libera o travamento
        if (oldItem && oldItem.includes('choice')) {
            target.lockedMove = null;
        }

        target.heldItem = itemId;
        target.hadItem = true; // Marca que teve item para Unburden se perder depois

        if (oldItem) {
            const oldItemName = ITEMS_DATA[oldItem]?.name || oldItem;
            log(logs, `${trainerName} trocou ${oldItemName} de ${target.name} por ${itemName}.`, `${trainerColor} font-bold`);
        } else {
            log(logs, `${trainerName} deu ${itemName} para ${target.name} segurar.`, `${trainerColor} font-bold`);
        }
        
        // CORREÇÃO: Força a verificação de mudança de forma (Multitipo/RKS) imediatamente após equipar
        Multitype.handleMultitype(target, logs);
        RKSSystem.handleRKSSystem(target, logs);
        
        return { newState: state };
    } 
    
    // Lógica de "Usar" (Consumíveis)
    log(logs, `${trainerName} usou ${itemName} em ${target.name}!`, `${trainerColor} font-black`);

    if (itemData.category === 'medicine' || (itemData.category === 'berry' && (itemData as any).targetType === 'move')) {
        // --- CURA PV ---
        if (itemId.includes('potion') || itemId === 'full-restore' || itemId === 'berry-juice') {
            if (itemId === 'max-potion' || itemId === 'full-restore') {
                const heal = target.maxHP - target.hp;
                target.hp = target.maxHP;
                log(logs, `${target.name} teve sua vida totalmente restaurada! (+${heal})`, 'text-green-500');
            } else {
                const amount = itemData.effectValue || 20;
                target.hp = Math.min(target.maxHP, target.hp + amount);
                log(logs, `${target.name} recuperou ${amount} PV!`, 'text-green-500');
            }
        }

        // --- REVIVER ---
        if (itemId === 'revive' || itemId === 'max-revive') {
            if (target.isFainted) {
                target.isFainted = false;
                target.statusEffects = {}; // Remove status ao reviver (Regra Oficial)
                const healPercent = itemId === 'max-revive' ? 1.0 : 0.5;
                target.hp = Math.floor(target.maxHP * healPercent);
                log(logs, `${target.name} foi revivido!`, 'text-yellow-500 font-bold');
            }
        }

        // --- CURA STATUS ---
        if (['full-restore', 'full-heal', 'antidote', 'paralyze-heal', 'burn-heal', 'ice-heal', 'awakening'].includes(itemId)) {
            let cured = false;
            
            // Mapeia item específico para status
            const statusMap: Record<string, string[]> = {
                'antidote': ['poison', 'toxic'],
                'paralyze-heal': ['paralysis'],
                'burn-heal': ['burn'],
                'ice-heal': ['freeze'],
                'awakening': ['sleep'],
                'full-heal': ['poison', 'toxic', 'paralysis', 'burn', 'sleep', 'freeze', 'confusion'],
                'full-restore': ['poison', 'toxic', 'paralysis', 'burn', 'sleep', 'freeze', 'confusion']
            };

            const targetStatuses = statusMap[itemId] || [];
            
            Object.keys(target.statusEffects).forEach(s => {
                if (targetStatuses.includes(s)) {
                    delete target.statusEffects[s];
                    cured = true;
                }
            });

            if (cured) {
                log(logs, `${target.name} foi curado de seus problemas de status!`, 'text-blue-500');
            }
        }

        // --- RECUPERAÇÃO DE PP (Ether, Elixir, Leppa Berry) ---
        if (['ether', 'max-ether', 'elixir', 'max-elixir', 'leppa-berry'].includes(itemId)) {
            let ppRestored = false;

            if (itemId === 'elixir' || itemId === 'max-elixir') {
                // Recupera todos os golpes
                target.moves.forEach(m => {
                    const amount = itemId === 'max-elixir' ? m.maxUses : 10;
                    if (m.uses < m.maxUses) {
                        m.uses = Math.min(m.maxUses, m.uses + amount);
                        ppRestored = true;
                    }
                });
                
                if (ppRestored) {
                    log(logs, `${target.name} recuperou PP de todos os golpes!`, 'text-indigo-600 font-bold');
                }
            } else {
                // Recupera um golpe específico (Ether, Max Ether, Leppa)
                if (moveName) {
                    const move = target.moves.find(m => m.name === moveName);
                    if (move) {
                        const amount = itemId === 'max-ether' ? move.maxUses : 10;
                        if (move.uses < move.maxUses) {
                            move.uses = Math.min(move.maxUses, move.uses + amount);
                            log(logs, `Recuperou os PP de ${move.displayName}!`, 'text-indigo-600 font-bold');
                        } else {
                            log(logs, `Os PP de ${move.displayName} já estão cheios!`, 'text-gray-500 italic');
                        }
                    }
                } else {
                    // Fallback se não vier moveName (ex: IA mal configurada) - Recupera o primeiro com falta de PP
                    const move = target.moves.find(m => m.uses < m.maxUses);
                    if (move) {
                        const amount = itemId === 'max-ether' ? move.maxUses : 10;
                        move.uses = Math.min(move.maxUses, move.uses + amount);
                        log(logs, `Recuperou os PP de ${move.displayName}!`, 'text-indigo-600 font-bold');
                    } else {
                        log(logs, `Não houve efeito no PP.`, 'text-gray-500 italic');
                    }
                }
            }
        }
    } 
    
    // --- X-ITEMS (Battle Items) ---
    else if (itemData.category === 'battle-item') {
        const statMap: Record<string, string> = {
            'x-attack': 'attack', 'x-defense': 'defense', 
            'x-sp-atk': 'spAttack', 'x-sp-def': 'spDefense',
            'x-speed': 'speed', 'x-accuracy': 'accuracy'
        };
        
        if (statMap[itemId]) {
            const statKey = statMap[itemId];
            const currentStage = (target.statStages as any)[statKey];
            if (currentStage < 6) {
                (target.statStages as any)[statKey] = Math.min(6, currentStage + (itemData.effectValue || 1));
                log(logs, `${target.name} teve seu atributo aumentado drasticamente!`, 'text-orange-600 font-bold');
            } else {
                log(logs, `Mas não teve efeito...`, 'text-gray-500');
            }
        } else if (itemId === 'guard-spec') {
            const isP1 = state.currentPokemon1?.id === target.id;
            const hazards = isP1 ? state.p1Hazards : state.p2Hazards;
            if (hazards.safeguard === 0) {
                hazards.safeguard = 5;
                log(logs, `O time foi protegido contra status especiais!`, 'text-blue-500 font-bold');
            }
        }
    }

    return { newState: state };
}
