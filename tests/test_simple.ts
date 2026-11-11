
import { Pokemon, Move, BattleState } from '../types';
import * as StatChanges from '../services/engine/handlers/moves/statChanges';

export function testSimpleAbility() {
    console.group('🧪 Teste Habilidade Simples (Simple)');
    
    const createDummySimplePokemon = (): Pokemon => ({
        id: 1, name: 'Bibarel', hp: 100, maxHP: 100, spriteUrl: '', 
        backSpriteUrl: '', // Initialized to satisfy Pokemon interface
        pixelSpriteUrl: '', // Initialized to satisfy Pokemon interface
        fallbackUrls: [],
        attackStat: 100, defenseStat: 100, spAttackStat: 100, spDefenseStat: 100, speedStat: 100,
        weight: 100, ability: 'simple', heldItem: null, hadItem: false, lockedMove: null,
        moves: [], movesUsed: [], types: ['normal'], gender: 'male', isFainted: false, isFlinched: false,
        turnsActive: 0, chargingMove: null, mustRecharge: false, statusEffects: {},
        statStages: { accuracy: 0, evasion: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 }
    });

    const bibarel = createDummySimplePokemon();
    const logs: any[] = [];

    // Testa Swords Dance (+2 Atk original -> deve virar +4)
    StatChanges.applyMoveStatChange(bibarel, 'attack-up', logs, false, false, 'swords-dance');
    
    if (bibarel.statStages.attack === 4) {
        console.log('%c✅ [PASS] Simple: Swords Dance aumentou o ataque em 4 estágios.', 'color: #10b981');
    } else {
        console.error(`%c❌ [FAIL] Simple: Esperado +4 Atk, obtido +${bibarel.statStages.attack}`, 'color: #ef4444');
    }

    // Testa Tail Whip (-1 Def original -> deve virar -2)
    StatChanges.applyMoveStatChange(bibarel, 'defense-down', logs, true, false, 'tail-whip');
    if (bibarel.statStages.defense === -2) {
        console.log('%c✅ [PASS] Simple: Tail Whip reduziu a defesa em 2 estágios.', 'color: #10b981');
    } else {
        console.error(`%c❌ [FAIL] Simple: Esperado -2 Def, obtido ${bibarel.statStages.defense}`, 'color: #ef4444');
    }

    console.groupEnd();
}
