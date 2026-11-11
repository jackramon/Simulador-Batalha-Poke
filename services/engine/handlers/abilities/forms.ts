
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

export function checkSchooling(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'schooling' || pokemon.isFainted) return;
    const threshold = pokemon.maxHP * 0.25;
    const isSchooled = pokemon.attackStat > 50; 
    if (!isSchooled && pokemon.hp > threshold) {
        pokemon.attackStat = 140; pokemon.defenseStat = 130; pokemon.spAttackStat = 140; pokemon.spDefenseStat = 135; pokemon.speedStat = 30;
        pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10127.png`;
        log(logs, `${pokemon.name} formou um cardume! (Forma Escola)`, 'text-blue-600 font-bold');
    } else if (isSchooled && pokemon.hp <= threshold) {
        pokemon.attackStat = 20; pokemon.defenseStat = 20; pokemon.spAttackStat = 25; pokemon.spDefenseStat = 25; pokemon.speedStat = 40;
        pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/746.png`;
        log(logs, `O cardume de ${pokemon.name} se dispersou... (Forma Solo)`, 'text-gray-500 italic');
    }
}

export function checkShieldsDown(pokemon: Pokemon, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'shields-down' || pokemon.isFainted) return;
    const threshold = pokemon.maxHP * 0.5;
    const isMeteor = pokemon.defenseStat > 80;
    if (isMeteor && pokemon.hp <= threshold) {
        pokemon.attackStat = 100; pokemon.defenseStat = 60; pokemon.spAttackStat = 100; pokemon.spDefenseStat = 60; pokemon.speedStat = 120;
        pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/774.png`;
        log(logs, `${pokemon.name} teve seu escudo quebrado! (Forma Núcleo)`, 'text-red-600 font-bold');
    } else if (!isMeteor && pokemon.hp > threshold) {
        pokemon.attackStat = 60; pokemon.defenseStat = 100; pokemon.spAttackStat = 60; pokemon.spDefenseStat = 100; pokemon.speedStat = 60;
        pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/774.png`;
        log(logs, `${pokemon.name} recuperou seu escudo! (Forma Meteoro)`, 'text-blue-600 italic');
    }
}
