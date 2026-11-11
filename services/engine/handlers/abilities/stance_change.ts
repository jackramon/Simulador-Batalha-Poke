
import { Pokemon, Move, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Mudança de Forma (Stance Change).
 * Exclusiva de Aegislash.
 * 
 * Regras Oficiais:
 * 1. O Pokémon muda para a Forma de Lâmina (Blade Forme) antes de usar um movimento de dano.
 * 2. O Pokémon muda para a Forma de Escudo (Shield Forme) antes de usar o movimento Escudo Real (King's Shield).
 * 3. A mudança troca as estatísticas de Ataque/Atq. Especial com Defesa/Def. Especial.
 * 4. A aparência (Sprite) também muda.
 * 5. Movimentos de Status (exceto King's Shield) não causam mudança de forma.
 * 6. Esta habilidade não pode ser suprimida, copiada ou substituída (ex: Neutralizing Gas, Skill Swap).
 */

const SHIELD_SPRITE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/681.png";
const BLADE_SPRITE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10026.png";

// Base stats oficiais (Aegislash) para referência:
// Shield: 60 HP, 50 Atk, 140 Def, 50 SpA, 140 SpD, 60 Spe
// Blade: 60 HP, 140 Atk, 50 Def, 140 SpA, 50 SpD, 60 Spe

export function handleStanceChange(
    attacker: Pokemon, 
    move: Move, 
    logs: LogEntry[]
) {
    if (attacker.ability !== 'stance-change' || attacker.isFainted) return;

    // Detecta forma atual baseada no sprite ou stats (assumindo inicialização correta na factory)
    const isBladeForme = attacker.attackStat > attacker.defenseStat;

    // CASO 1: Mudar para Forma de Lâmina
    // Gatilho: Usar movimento de dano (Physical ou Special)
    if (move.damageClass !== 'status') {
        if (!isBladeForme) {
            log(logs, `${attacker.name} mudou para a Forma de Lâmina!`, 'text-red-600 font-bold italic');
            
            // Troca Stats para modo ofensivo
            // No simulador, trocamos os valores brutos para refletir a mudança
            const tempAtk = attacker.attackStat;
            const tempSpA = attacker.spAttackStat;
            
            attacker.attackStat = attacker.defenseStat;
            attacker.spAttackStat = attacker.spDefenseStat;
            
            attacker.defenseStat = tempAtk;
            attacker.spDefenseStat = tempSpA;

            // Atualiza Sprite
            attacker.spriteUrl = BLADE_SPRITE;
        }
    }

    // CASO 2: Mudar para Forma de Escudo
    // Gatilho: Usar Escudo Real (King's Shield)
    else if (move.name === 'kings-shield') {
        if (isBladeForme) {
            log(logs, `${attacker.name} mudou para a Forma de Escudo!`, 'text-blue-600 font-bold italic');
            
            // Troca Stats para modo defensivo
            const tempAtk = attacker.attackStat;
            const tempSpA = attacker.spAttackStat;
            
            attacker.attackStat = attacker.defenseStat;
            attacker.spAttackStat = attacker.spDefenseStat;
            
            attacker.defenseStat = tempAtk;
            attacker.spDefenseStat = tempSpA;

            // Atualiza Sprite
            attacker.spriteUrl = SHIELD_SPRITE;
        }
    }
}
