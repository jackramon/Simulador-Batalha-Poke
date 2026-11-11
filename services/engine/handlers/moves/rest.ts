
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as Insomnia from '../abilities/insomnia';
import * as VitalSpirit from '../abilities/vital_spirit';
import * as Uproar from './uproar';
import * as NeutralizingGas from '../abilities/neutralizing_gas';
import * as Terrain from '../terrain';
import * as PurifyingSalt from '../abilities/purifying_salt';
import * as LeafGuard from '../abilities/leaf_guard';
import { checkConsumableItems } from '../../../handlers/items';

export function handleRest(attacker: Pokemon, logs: LogEntry[], state?: BattleState) {
    if (attacker.isFainted) return;

    // 1. Verifica HP Cheio
    if (attacker.hp === attacker.maxHP) {
        log(logs, `Mas falhou! O HP de ${attacker.name} já está cheio.`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica Habilidades que impedem o sono
    const isGasActive = state ? NeutralizingGas.isGasActive(state) : false;
    
    if (!NeutralizingGas.isAbilitySuppressed(attacker.ability, isGasActive)) {
        if (Insomnia.isImmuneToSleep(attacker) || VitalSpirit.isImmuneToSleep(attacker)) {
            log(logs, `Mas falhou! ${attacker.name} não consegue dormir devido à sua habilidade!`, 'text-gray-500 italic');
            return;
        }
        if (PurifyingSalt.isImmuneToStatus(attacker, state)) {
            log(logs, `Mas falhou! O Sal Purificador protege ${attacker.name} de condições de status!`, 'text-gray-500 italic');
            return;
        }
        if (LeafGuard.isImmuneToStatus(attacker, state?.weather || 'none', state)) {
            log(logs, `Mas falhou! A Guarda Folha protege ${attacker.name} sob o sol!`, 'text-gray-500 italic');
            return;
        }
    }

    // 3. Verifica Algazarra (Uproar)
    if (state && Uproar.isUproarActive(state)) {
        log(logs, `Mas falhou! A algazarra impede o sono.`, 'text-gray-500 italic');
        return;
    }

    // 4. Verifica Terrenos
    if (state && Terrain.isGrounded(attacker, state)) {
        if (state.terrain === 'electric') {
            log(logs, `Mas falhou! O Campo Elétrico impede o sono.`, 'text-yellow-600 italic');
            return;
        }
        if (state.terrain === 'misty') {
            log(logs, `Mas falhou! O Campo de Névoa impede condições de status.`, 'text-pink-600 italic');
            return;
        }
    }

    // EXECUÇÃO DO DESCANSO

    // Cura Status Não-Voláteis
    const statusKeys = ['burn', 'paralysis', 'poison', 'toxic', 'freeze', 'sleep'];
    statusKeys.forEach(s => delete attacker.statusEffects[s]);

    // Aplica Sono (Duração fixa de 2 turnos)
    // maxTurns 3 significa: T1 (usa, vira 0), T2 (dorme, vira 1), T3 (dorme, vira 2), T4 (acorda, vira 3 e 3>=3)
    attacker.statusEffects['sleep'] = { turns: 0, damageAccumulated: 0, sourceMoveName: 'rest' };
    
    // Adicionamos uma propriedade customizada 'maxTurns' via cast para ser lida pelo statusCheck
    (attacker.statusEffects['sleep'] as any).maxTurns = 3;

    // Recupera HP Total
    const healAmount = attacker.maxHP - attacker.hp;
    attacker.hp = attacker.maxHP;

    log(logs, `${attacker.name} dormiu e recuperou sua saúde!`, 'text-blue-500 font-bold');

    // Verifica se há itens para consumir (ex: Chesto Berry / Lum Berry) para acordar imediatamente
    checkConsumableItems(attacker, logs, state);
}
