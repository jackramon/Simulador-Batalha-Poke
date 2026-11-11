import { Pokemon, Move, LogEntry } from '../../../types';
import { log } from '../utils';

const REFLECTABLE_MOVES = new Set([
    // Hazards
    'stealth-rock', 'spikes', 'toxic-spikes', 'sticky-web', 'sharp-steel',
    
    // Status Conditions
    'will-o-wisp', 'toxic', 'thunder-wave', 'glare', 'stun-spore', 
    'poison-powder', 'sleep-powder', 'hypnosis', 'sing', 'grass-whistle', 
    'dark-void', 'spore', 'confuse-ray', 'swagger', 'flatter', 'supersonic', 
    'sweet-kiss', 'teeter-dance', 'yawn', 'lovely-kiss', 'poison-gas',
    
    // Stat Lowering
    'growl', 'leer', 'tail-whip', 'screech', 'metal-sound', 'fake-tears', 
    'scary-face', 'string-shot', 'cotton-spore', 'feather-dance', 'charm', 
    'eerie-impulse', 'noble-roar', 'parting-shot', 'tickle', 'venom-drench', 
    'defog', 'baby-doll-eyes', 'sand-attack', 'smokescreen', 'kinesis', 
    'flash', 'play-nice', 'confide', 'tearful-look', 'strength-sap', 
    'captivate',
    
    // Blocking / Disabling
    'taunt', 'torment', 'encore', 'disable', 'gastro-acid', 'worry-seed', 
    'entrainment', 'simple-beam', 'skill-swap', 'heal-block', 'embargo',
    
    // Phazing / Trapping
    'whirlwind', 'roar', 'block', 'mean-look', 'spider-web',
    
    // Type Changing
    'soak', 'forests-curse', 'trick-or-treat', 'magic-powder',
    
    // Other
    'leech-seed', 'attract', 'miracle-eye', 'odor-sleuth', 'foresight', 
    'mind-reader', 'lock-on', 'powder', 'quash', 'spotlight', 'telekinesis',
    'psycho-shift'
]);

export function canBeReflected(move: Move): boolean {
    if (move.damageClass !== 'status') return false;
    // Target checks would be ideal here, but we rely on the list for safety
    // and "Zero Regression" to avoid reflecting self-moves accidentally.
    return REFLECTABLE_MOVES.has(move.name);
}

export function handleMagicReflection(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    logs: LogEntry[],
    ignoresAbilities: boolean = false
): boolean {
    // Cannot reflect if the move is not reflectable
    if (!canBeReflected(move)) return false;

    let reflected = false;
    let source = '';

    // Check Magic Coat (Volatile Status) - Takes priority over Ability?
    // Actually, Magic Coat reflects regardless of Mold Breaker because it's a move effect.
    if (defender.statusEffects['magic-coat']) {
        reflected = true;
        source = 'Magic Coat';
        // Magic Coat reflects ALL moves in the turn, so it is NOT consumed.
    }
    // Check Magic Bounce (Ability)
    else if (defender.ability === 'magic-bounce' && !ignoresAbilities) {
        reflected = true;
        source = 'Magic Bounce';
    }

    if (reflected) {
        log(logs, `${defender.name} refletiu o golpe com ${source}!`, 'text-pink-600 font-bold');
        return true;
    }

    return false;
}
