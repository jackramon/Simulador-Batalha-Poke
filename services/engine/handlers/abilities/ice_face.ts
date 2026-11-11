import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Cara de Gelo (Ice Face).
 * Regra Oficial: Protege contra UM movimento físico. Ao ser atingido, muda para a forma Noice.
 * No granizo, a forma Ice Face é restaurada.
 */

export function handleIceFaceDamage(defender: Pokemon, move: Move, damage: number, logs: {message: string, color: string}[]): number {
    if (defender.ability !== 'ice-face' || move.damageClass !== 'physical' || defender.statusEffects['ice-face-broken'] || defender.isFainted) {
        return damage;
    }

    log(logs, `A Cara de Gelo de ${defender.name} bloqueou o ataque físico!`, 'text-blue-400 font-bold italic');
    
    // Ativa o estado de "Quebrado" (Noice Face)
    defender.statusEffects['ice-face-broken'] = { turns: -1 };
    
    // Atualiza Stats (Valores base oficiais adaptados)
    // Ice Face: Def 110, SpD 90, Spe 50 | Noice: Def 70, SpD 50, Spe 130
    defender.defenseStat = 70;
    defender.spDefenseStat = 50;
    defender.speedStat = 130;
    
    // Noice Face Artwork
    defender.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10185.png`;
    
    log(logs, `${defender.name} mudou para a Forma Degelada!`, 'text-blue-500 italic');

    return 0; // Dano anulado
}

export function checkIceFaceRestoration(pokemon: Pokemon, weather: string, logs: {message: string, color: string}[]): boolean {
    if (pokemon.ability !== 'ice-face' || !pokemon.statusEffects['ice-face-broken'] || weather !== 'hail' || pokemon.isFainted) {
        return false;
    }

    // Restaura forma Ice Face
    delete pokemon.statusEffects['ice-face-broken'];
    
    // Restaura Stats
    defenderStatsRestore(pokemon);

    log(logs, `A Cara de Gelo de ${pokemon.name} se regenerou no granizo!`, 'text-blue-300 font-bold italic');
    return true;
}

export function defenderStatsRestore(pokemon: Pokemon) {
    pokemon.defenseStat = 110;
    pokemon.spDefenseStat = 90;
    pokemon.speedStat = 50;
    pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/875.png`;
}
