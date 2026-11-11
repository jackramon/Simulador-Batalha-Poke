
import { Pokemon, Move, LogEntry } from '../../../../types';
import { log } from '../../utils';

const BANNED_MOVES = [
    'metronome', 'copycat', 'struggle', 'sleep-talk', 'assist', 'mimic', 
    'sketch', 'transform', 'focus-punch', 'beak-blast', 'shell-trap', 
    'destiny-bond', 'spite', 'thief', 'covet', 'trick', 'switcheroo', 
    'counter', 'mirror-coat', 'protect', 'detect', 'endure', 'follow-me', 
    'rage-powder', 'helping-hand', 'feint'
];

// Pool curado de movimentos para o Metrônomo (para garantir que funcionem no simulador sem fetch assíncrono)
const METRONOME_POOL: Partial<Move>[] = [
    { name: 'flamethrower', displayName: 'Lança-Chamas', type: 'fire', power: 90, accuracy: 100, damageClass: 'special', isStatus: false },
    { name: 'hydro-pump', displayName: 'Hidro Bomba', type: 'water', power: 110, accuracy: 80, damageClass: 'special', isStatus: false },
    { name: 'thunder', displayName: 'Trovão', type: 'electric', power: 110, accuracy: 70, damageClass: 'special', isStatus: false },
    { name: 'earthquake', displayName: 'Terremoto', type: 'ground', power: 100, accuracy: 100, damageClass: 'physical', isStatus: false },
    { name: 'psychic', displayName: 'Psíquico', type: 'psychic', power: 90, accuracy: 100, damageClass: 'special', isStatus: false },
    { name: 'shadow-ball', displayName: 'Bola Sombria', type: 'ghost', power: 80, accuracy: 100, damageClass: 'special', isStatus: false },
    { name: 'ice-beam', displayName: 'Raio de Gelo', type: 'ice', power: 90, accuracy: 100, damageClass: 'special', isStatus: false },
    { name: 'sludge-bomb', displayName: 'Bomba de Lodo', type: 'poison', power: 90, accuracy: 100, damageClass: 'special', isStatus: false },
    { name: 'close-combat', displayName: 'Corpo a Corpo', type: 'fighting', power: 120, accuracy: 100, damageClass: 'physical', isStatus: false },
    { name: 'moonblast', displayName: 'Explosão Lunar', type: 'fairy', power: 95, accuracy: 100, damageClass: 'special', isStatus: false },
    { name: 'stone-edge', displayName: 'Gume de Pedra', type: 'rock', power: 100, accuracy: 80, damageClass: 'physical', isStatus: false },
    { name: 'x-scissor', displayName: 'Tesoura X', type: 'bug', power: 80, accuracy: 100, damageClass: 'physical', isStatus: false },
    { name: 'crunch', displayName: 'Triturar', type: 'dark', power: 80, accuracy: 100, damageClass: 'physical', isStatus: false },
    { name: 'flash-cannon', displayName: 'Canhão de Luz', type: 'steel', power: 80, accuracy: 100, damageClass: 'special', isStatus: false },
    { name: 'dragon-pulse', displayName: 'Pulso do Dragão', type: 'dragon', power: 85, accuracy: 100, damageClass: 'special', isStatus: false },
    { name: 'brave-bird', displayName: 'Pássaro Bravo', type: 'flying', power: 120, accuracy: 100, damageClass: 'physical', isStatus: false },
    { name: 'giga-drain', displayName: 'Giga Dreno', type: 'grass', power: 75, accuracy: 100, damageClass: 'special', isStatus: false },
    { name: 'hyper-voice', displayName: 'Hiper Voz', type: 'normal', power: 90, accuracy: 100, damageClass: 'special', isStatus: false },
    { name: 'swords-dance', displayName: 'Dança das Espadas', type: 'normal', power: 0, accuracy: 100, damageClass: 'status', isStatus: true, effect: { status: 'attack-up', chance: 100 } },
    { name: 'will-o-wisp', displayName: 'Fogo Fátuo', type: 'fire', power: 0, accuracy: 85, damageClass: 'status', isStatus: true, effect: { status: 'burn', chance: 100 } },
    { name: 'toxic', displayName: 'Tóxico', type: 'poison', power: 0, accuracy: 90, damageClass: 'status', isStatus: true, effect: { status: 'toxic', chance: 100 } },
    { name: 'thunder-wave', displayName: 'Onda Trovão', type: 'electric', power: 0, accuracy: 90, damageClass: 'status', isStatus: true, effect: { status: 'paralysis', chance: 100 } },
    { name: 'splash', displayName: 'Esguicho', type: 'normal', power: 0, accuracy: 100, damageClass: 'status', isStatus: true },
    { name: 'explosion', displayName: 'Explosão', type: 'normal', power: 250, accuracy: 100, damageClass: 'physical', isStatus: false, effect: { status: 'self-faint', chance: 100 } },
];

export function getMetronomeMove(
    attacker: Pokemon, 
    logs: LogEntry[]
): Move | null {
    // Escolhe um movimento aleatório do pool
    const randomIndex = Math.floor(Math.random() * METRONOME_POOL.length);
    const selectedTemplate = METRONOME_POOL[randomIndex];

    log(logs, `${attacker.name} balançou um dedo!`, 'text-gray-700 italic');
    log(logs, `E usou ${selectedTemplate.displayName}!`, 'text-indigo-600 font-bold');

    // Retorna o objeto Move completo
    return {
        name: selectedTemplate.name!,
        displayName: selectedTemplate.displayName!,
        type: selectedTemplate.type!,
        power: selectedTemplate.power!,
        accuracy: selectedTemplate.accuracy!,
        damageClass: selectedTemplate.damageClass!,
        isStatus: selectedTemplate.isStatus!,
        description: 'Movimento invocado pelo Metrônomo.',
        uses: 1,
        maxUses: 1,
        effect: selectedTemplate.effect,
        priority: 0
    };
}
