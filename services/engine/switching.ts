
import { BattleState, Pokemon, LogEntry } from '../../types';
import * as Effects from '../effectHandlers';
import { log } from './utils';
import * as NaturalCure from './handlers/abilities/natural_cure';
import * as ZeroToHero from './handlers/abilities/zero_to_hero';
import * as Hazards from './handlers/hazards';

export function performSwitch(
  currentState: BattleState, 
  newPokemon: Pokemon, 
  playerNum: 1 | 2, 
  weatherEnabled: boolean,
  isBatonPass: boolean = false // Novo parâmetro
): { newState: BattleState, logs: LogEntry[] } {
  
  const logs: LogEntry[] = [];
  const state = { ...currentState };
  
  const oldPokemon = playerNum === 1 ? state.currentPokemon1 : state.currentPokemon2;
  let lastPokemonSnapshot: Pokemon | null = null;
  
  if (oldPokemon) {
    // Captura um instantâneo do Pokémon antes de resetar os status temporários
    lastPokemonSnapshot = { 
        ...oldPokemon, 
        statStages: { ...oldPokemon.statStages } 
    };

    // Gatilho Do Zero ao Herói ao sair
    ZeroToHero.handleSwitchOut(oldPokemon, logs);

    // LÓGICA DE TRANSFERÊNCIA DE EFEITOS DE CAMPO (SLOT-BASED)
    // Efeitos que ficam na posição (slot), passando para o substituto
    // independentemente de ser Baton Pass ou troca normal.
    const slotStatuses = ['wish', 'future-sight', 'doom-desire'];
    
    slotStatuses.forEach(status => {
        if (oldPokemon.statusEffects[status]) {
            newPokemon.statusEffects[status] = { ...oldPokemon.statusEffects[status] };
            // Remove do antigo para evitar duplicação ou bugs se ele voltar
            delete oldPokemon.statusEffects[status];
        }
    });

    // LÓGICA DE BATON PASS vs TROCA NORMAL
    if (isBatonPass) {
        // Herda Stat Stages
        newPokemon.statStages = { ...oldPokemon.statStages };
        
        // Herda Status Voláteis Específicos
        const inheritableStatus = [
            'substitute', 'confusion', 'leech-seed', 'focus-energy', 
            'curse', 'ingrain', 'aqua-ring', 'magnet-rise', 
            'gastro-acid', 'power-trick', 'heal-block', 'embargo',
            'perish-song'
        ];

        Object.keys(oldPokemon.statusEffects).forEach(status => {
            const effect = oldPokemon.statusEffects[status];
            if (effect.batonPassable || inheritableStatus.includes(status)) {
                newPokemon.statusEffects[status] = { ...effect };
            }
        });

        log(logs, `${oldPokemon.name} passou seus atributos para ${newPokemon.name}!`, 'text-blue-600 font-bold');

    } else {
        // Reset padrão (Troca normal)
        oldPokemon.statStages = { accuracy: 0, evasion: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    }
    
    // Reseta estados temporários de combate (Baton Pass não passa tudo, ex: infatuation, protect counter)
    oldPokemon.isFlinched = false;
    oldPokemon.turnsActive = 0;
    oldPokemon.chargingMove = null;
    oldPokemon.mustRecharge = false;
    oldPokemon.lockedMove = null;
    oldPokemon.protectCounter = 0; // Reset ao sair
    oldPokemon.movesUsed = []; 
    oldPokemon.lastMoveUsed = null;
    
    // Limpeza de Status (Mesmo com Baton Pass, os que não foram copiados devem ser limpos do antigo)
    // No caso do Baton Pass, copiamos PARA o novo. O antigo pode ser limpo normalmente pois vai pra reserva.
    
    // Reset de Toxic Counter do antigo
    if (oldPokemon.statusEffects.toxic) {
        oldPokemon.statusEffects.toxic.turns = 0;
    }

    // Limpeza de Voláteis do ANTIGO
    const persistentEffects = [
        'burn', 'poison', 'toxic', 'paralysis', 'sleep', 'freeze', 
        'disguise-busted', 'zero-to-hero-activated', 'zero-to-hero-transformed'
    ];
    Object.keys(oldPokemon.statusEffects).forEach(status => {
        const effect = oldPokemon.statusEffects[status];
        if (effect.isVolatile || !persistentEffects.includes(status)) {
            delete oldPokemon.statusEffects[status];
        }
    });

    // Gatilho modular de habilidades ao sair (Switch Out)
    NaturalCure.handleNaturalCure(oldPokemon, logs);

    if (oldPokemon.ability === 'regenerator' && !oldPokemon.isFainted) {
       const heal = Math.floor(oldPokemon.maxHP / 3);
       oldPokemon.hp = Math.min(oldPokemon.maxHP, oldPokemon.hp + heal);
       log(logs, `${oldPokemon.name} recuperou vida ao sair (Regenerador)!`, 'text-green-500');
    }
  }

  if (playerNum === 1) state.currentPokemon1 = newPokemon;
  else state.currentPokemon2 = newPokemon;

  log(logs, `${playerNum === 1 ? 'Jogador' : 'Oponente'} trocou para ${newPokemon.name}!`, playerNum === 1 ? 'text-green-700' : 'text-red-700');

  // HAZARDS CHECK
  const sideHazards = playerNum === 1 ? state.p1Hazards : state.p2Hazards;
  Hazards.checkEntryHazards(newPokemon, sideHazards, logs, state);

  if (!newPokemon.isFainted) {
      const opponent = playerNum === 1 ? state.currentPokemon2 : state.currentPokemon1;
      
      const effectRes = Effects.handleEntryAbilities(newPokemon, opponent, weatherEnabled, logs, state, lastPokemonSnapshot);
      
      if (effectRes.weather && weatherEnabled) {
        state.weather = effectRes.weather;
        state.weatherTurns = 5;
        if (newPokemon.heldItem === 'heat-rock' && state.weather === 'sun') state.weatherTurns = 8;
        if (newPokemon.heldItem === 'damp-rock' && state.weather === 'rain') state.weatherTurns = 8;
        if (newPokemon.heldItem === 'smooth-rock' && state.weather === 'sand') state.weatherTurns = 8;
        if (newPokemon.heldItem === 'icy-rock' && state.weather === 'hail') state.weatherTurns = 8;
      }
  }

  return { newState: state, logs };
}
