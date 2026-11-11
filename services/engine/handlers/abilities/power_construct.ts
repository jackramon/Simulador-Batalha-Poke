import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Agrupamento (Power Construct).
 * Transforma Zygarde em sua Forma Completa quando o HP cai para a metade ou menos.
 */
export function checkPowerConstruct(pokemon: Pokemon, state: any, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'power-construct' || pokemon.isFainted) return;
    
    // Verifica Gás Neutralizante
    if (state && !NeutralizingGas.canAbilityTrigger(pokemon, state)) return;

    // Verifica se já está na forma completa
    if (pokemon.name.includes('Complete') || pokemon.name.includes('Completa') || pokemon.spriteUrl.includes('10118')) return;

    // Verifica limiar de HP (50% ou menos)
    if (pokemon.hp > pokemon.maxHP / 2) return;

    // Identifica a forma atual para calcular o ganho de HP
    let baseHpDiff = 0;
    const level = pokemon.level || 100; // Assume nível 100 se não definido

    // Zygarde 10% (Base 54) -> Complete (Base 216)
    // Detecta 10% pelo nome ou pela velocidade base (115)
    if (pokemon.name.includes('10%') || pokemon.speedStat === 115) {
        baseHpDiff = 216 - 54;
    } 
    // Zygarde 50% (Base 108) -> Complete (Base 216)
    // Detecta 50% pelo nome ou pela velocidade base (95)
    else {
        baseHpDiff = 216 - 108;
    }

    // Calcula o aumento de HP
    // Fórmula simplificada: DeltaHP = 2 * DeltaBase * Level / 100
    // Ajuste fino para bater com a mecânica oficial (HP = (2*Base + IV + EV/4)*L/100 + L + 10)
    // A diferença é puramente 2 * DeltaBase * L / 100
    const hpIncrease = Math.floor(2 * baseHpDiff * level / 100);

    // Aplica a transformação
    const originalName = pokemon.name;
    pokemon.name = 'Zygarde (Forma Completa)';
    
    // Atualiza Stats Base (Zygarde Complete)
    // HP: 216, Atk: 100, Def: 121, SpA: 91, SpD: 95, Spe: 85
    pokemon.attackStat = 100;
    pokemon.defenseStat = 121;
    pokemon.spAttackStat = 91;
    pokemon.spDefenseStat = 95;
    pokemon.speedStat = 85;

    // Atualiza HP Atual e Máximo
    pokemon.maxHP += hpIncrease;
    pokemon.hp += hpIncrease;

    // Atualiza Sprites
    pokemon.spriteUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10118.png';
    pokemon.pixelSpriteUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10118.png';
    
    log(logs, `Você sente a presença de muitos! ${originalName} transformou-se na Forma Completa!`, 'text-green-600 font-bold');
}
