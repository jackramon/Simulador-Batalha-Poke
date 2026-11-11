import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Disfarce (Disguise).
 * Regra Oficial (Gen 8+): Protege contra o dano de um movimento de ataque.
 * Ao quebrar, o Pokémon perde 1/8 do seu HP máximo e muda de forma.
 * Habilidades como Mold Breaker ou movimentos como Moongeist Beam ignoram o Disfarce.
 */
export function handleDisguiseDamage(
    defender: Pokemon, 
    move: Move, 
    damage: number, 
    ignoresAbilities: boolean, 
    logs: {message: string, color: string}[]
): number {
    // Requisitos: Ter a habilidade, não estar quebrado, o atacante não ignorar habilidades e ser um golpe de dano
    if (defender.ability !== 'disguise' || 
        ignoresAbilities || 
        defender.statusEffects['disguise-busted'] || 
        move.damageClass === 'status' || 
        defender.isFainted) {
        return damage;
    }

    log(logs, `O Disfarce de ${defender.name} serviu de isca!`, 'text-purple-600 font-bold italic');
    
    // Marca como quebrado (Volátil que persiste via ajuste no switching.ts)
    defender.statusEffects['disguise-busted'] = { turns: -1 };
    
    // Dano residual obrigatório (1/8 do HP máximo)
    const bustedDamage = Math.floor(defender.maxHP / 8) || 1;
    defender.hp = Math.max(0, defender.hp - bustedDamage);
    
    // Mudança Visual para Mimikyu-Busted (ID 10143 no PokeAPI)
    defender.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10143.png`;
    
    log(logs, `${defender.name} teve seu disfarce revelado e sofreu um pouco de dano!`, 'text-red-500');

    if (defender.hp === 0) {
        defender.isFainted = true;
    }

    return 0; // O dano do movimento original é anulado
}
