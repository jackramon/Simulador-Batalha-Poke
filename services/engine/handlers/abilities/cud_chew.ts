
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { ITEMS_DATA } from '../../../../data/items';
import * as NeutralizingGas from './neutralizing_gas';
import * as Klutz from './klutz';
import * as Ripen from './ripen';
import * as CheekPouch from './cheek_pouch';
import * as Unnerve from './unnerve';

/**
 * Registra uma fruta para ser ruminada no próximo turno.
 */
export function setupCudChew(pokemon: Pokemon, berryName: string, state?: BattleState) {
    if (pokemon.ability !== 'cud-chew' || !NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return;
    }

    // Define o timer para 2 turnos: 
    // Turno N (atual): decrementa para 1 no fim do turno.
    // Turno N+1: decrementa para 0 no fim do turno e ativa.
    pokemon.statusEffects['cud-chew-berry'] = { 
        turns: 2, 
        sourceMoveName: berryName // Usamos sourceMoveName para guardar o ID da fruta
    };
}

/**
 * Processa o contador de ruminação e aplica o efeito da fruta no momento certo.
 */
export function processCudChew(pokemon: Pokemon, logs: {message: string, color: string}[], state?: BattleState) {
    const effect = pokemon.statusEffects['cud-chew-berry'];
    if (!effect || pokemon.isFainted) return;

    // Se o Pokémon perdeu a habilidade ou está sob efeito de Klutz/Gás, cancela
    if (pokemon.ability !== 'cud-chew' || 
        !NeutralizingGas.canAbilityTrigger(pokemon, state) || 
        Klutz.isItemSuppressed(pokemon, state)) {
        delete pokemon.statusEffects['cud-chew-berry'];
        return;
    }

    // Tensão (Unnerve) impede o Pokémon de ruminar frutas
    if (Unnerve.isOpponentUnnerved(pokemon, state)) {
        return;
    }

    if (effect.turns > 1) {
        effect.turns--;
    } else {
        // Ativa o efeito da fruta
        const berryName = effect.sourceMoveName;
        if (berryName) {
            triggerBerryEffect(pokemon, berryName, logs, state);
        }
        delete pokemon.statusEffects['cud-chew-berry'];
    }
}

/**
 * Reaplica o efeito de uma fruta específica (lógica extraída de checkConsumableItems).
 */
function triggerBerryEffect(pokemon: Pokemon, berryName: string, logs: {message: string, color: string}[], state?: BattleState) {
    const itemName = ITEMS_DATA[berryName]?.name || berryName;
    let activated = false;

    if (berryName === 'lum-berry') {
        if (Object.keys(pokemon.statusEffects).length > 0) {
            pokemon.statusEffects = {};
            activated = true;
            log(logs, `${pokemon.name} ruminou sua ${itemName} e curou seus status!`, 'text-green-600 italic');
        }
    } else if (berryName === 'sitrus-berry' || berryName === 'figy-berry') {
        const healPercent = berryName === 'sitrus-berry' ? 0.25 : 0.33;
        const ripenMult = Ripen.getBerryMultiplier(pokemon, state);
        const finalHealPercent = healPercent * ripenMult;
        
        const healAmount = Math.floor(pokemon.maxHP * finalHealPercent) || 1;
        pokemon.hp = Math.min(pokemon.maxHP, pokemon.hp + healAmount);
        
        const ripenMsg = ripenMult > 1 ? " (Maturação!)" : "";
        log(logs, `${pokemon.name} ruminou sua ${itemName} e recuperou vida!${ripenMsg}`, 'text-green-600 font-bold italic');
        activated = true;
    }

    if (activated) {
        CheekPouch.handleCheekPouch(pokemon, logs as any);
    }
}
