
import { Move } from '../../../../types';

// Define target moves hardcoded to ensure availability
const TARGET_MOVES: Record<string, Partial<Move>> = {
    'tri-attack': { name: 'tri-attack', displayName: 'Tri-Ataque', type: 'normal', power: 80, accuracy: 100, damageClass: 'special', effect: { status: 'tri-attack-effect', chance: 20 } },
    'thunderbolt': { name: 'thunderbolt', displayName: 'Relâmpago', type: 'electric', power: 90, accuracy: 100, damageClass: 'special', effect: { status: 'paralysis', chance: 10 } },
    'energy-ball': { name: 'energy-ball', displayName: 'Bola de Energia', type: 'grass', power: 90, accuracy: 100, damageClass: 'special', effect: { status: 'spDefense-down', chance: 10 } },
    'psychic': { name: 'psychic', displayName: 'Psíquico', type: 'psychic', power: 90, accuracy: 100, damageClass: 'special', effect: { status: 'spDefense-down', chance: 10 } },
    'moonblast': { name: 'moonblast', displayName: 'Explosão Lunar', type: 'fairy', power: 95, accuracy: 100, damageClass: 'special', effect: { status: 'spAttack-down', chance: 30 } }
};

export function getNaturePowerMove(terrain: string): Move {
    let targetKey = 'tri-attack';
    if (terrain === 'electric') targetKey = 'thunderbolt';
    else if (terrain === 'grassy') targetKey = 'energy-ball';
    else if (terrain === 'psychic') targetKey = 'psychic';
    else if (terrain === 'misty') targetKey = 'moonblast';

    const template = TARGET_MOVES[targetKey];
    
    // Return full move object (filling defaults)
    return {
        name: template.name!,
        displayName: template.displayName!,
        type: template.type!,
        power: template.power!,
        accuracy: template.accuracy!,
        damageClass: template.damageClass!,
        isStatus: false,
        uses: 0, maxUses: 0, description: '', // Dummy values
        effect: template.effect
    };
}
