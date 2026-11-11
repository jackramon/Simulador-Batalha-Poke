import { Move, LogEntry } from '../types';
import { createDummy, createBattleState } from './factories';
import { handleSeedFlareEffect } from '../services/engine/handlers/moves/seedFlare';
import { handlePlasmaFistsEffect } from '../services/engine/handlers/moves/plasmaFists';
import { handleFleurCannonEffect } from '../services/engine/handlers/moves/fleurCannon';
import { resolveEffectiveType } from '../services/engine/movePipeline';
import { calculateDamage } from '../services/engine/handlers/damageUtils';
import { calculateHitChance } from '../services/engine/mechanics/accuracy';
import { getRevengePower } from '../services/engine/handlers/moves/revenge';
import { handleMagneticFlux } from '../services/engine/handlers/moves/magneticFlux';
import { handleSpinOutEffect } from '../services/engine/handlers/moves/spinOut';
import { getMagnitudePower } from '../services/engine/handlers/moves/magnitude';
import { getPunishmentPower } from '../services/engine/handlers/moves/punishment';
import { getPsybladePower } from '../services/engine/handlers/moves/psyblade';
import { triggerDesolateLand } from '../services/engine/handlers/abilities/desolate_land';
import { validateMoveExecution } from '../services/engine/steps/preMoveValidation';
import { getDamageMultiplier } from '../services/engine/handlers/abilities/tera_shell';
import { handleSandsearStormEffect } from '../services/engine/handlers/moves/sandsearStorm';
import { handleCoaching } from '../services/engine/handlers/moves/coaching';
import { handlePerishSongStart, handlePerishCount } from '../services/engine/handlers/moves/perish_song';
import { handleStrengthSap } from '../services/engine/handlers/moves/strengthSap';
import { handleIonDeluge, getEffectiveMoveType } from '../services/engine/handlers/moves/ionDeluge';
import { handleHowl } from '../services/engine/handlers/moves/howl';

export function runTests() {
  console.clear();
  console.group('%c🧪 Testes Visuais (Browser Playground)', 'color: #16a34a; font-size: 14px; font-weight: bold;');

  // --- TESTE: SEED FLARE ---
  console.group('%c🌱 Teste: SEED FLARE', 'color: #22c55e;');
  const sfAttacker = createDummy({ name: 'Shaymin-Sky' });
  const sfDefender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100, statStages: { accuracy: 0, evasion: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 } });
  const sfLogs: LogEntry[] = [];
  const sfState = createBattleState([sfAttacker], [sfDefender]);

  handleSeedFlareEffect(sfAttacker, sfDefender, sfLogs, sfState);

  console.log(sfDefender.statStages.spDefense === -2 ? '✅ Sp. Def reduzida em 2 estágios' : `❌ Falha na redução (${sfDefender.statStages.spDefense})`);
  console.groupEnd();

  // --- TESTE: PLASMA FISTS ---
  console.group('%c⚡ Teste: PLASMA FISTS', 'color: #eab308;');
  const pfAttacker = createDummy({ name: 'Zeraora' });
  const pfDefender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100 });
  const pfLogs: LogEntry[] = [];
  const pfState = createBattleState([pfAttacker], [pfDefender]);

  handlePlasmaFistsEffect(pfAttacker, pfDefender, pfLogs, pfState);

  const statusApplied = pfAttacker.statusEffects['plasma-fists'] && pfDefender.statusEffects['plasma-fists'];
  console.log(statusApplied ? '✅ Status aplicado em ambos' : '❌ Falha ao aplicar status');

  const normalMove: Move = { name: 'tackle', type: 'normal' } as Move;
  const ctx = {
      attacker: pfDefender, // Defensor ataca com golpe Normal
      move: normalMove,
      state: pfState,
      effectiveWeather: 'none',
      isGasActive: false,
      ignoresAbilities: false,
      logs: []
  } as any;

  const resolvedCtx = resolveEffectiveType(ctx);
  console.log(resolvedCtx.effectiveType === 'electric' ? '✅ Golpe Normal virou Elétrico' : `❌ Falha na conversão (${resolvedCtx.effectiveType})`);
  console.groupEnd();

  // --- TESTE: BALANÇO BRUTAL ---
  console.group('%c🌪️ Teste: BALANÇO BRUTAL', 'color: #3b82f6;');
  const bbAttacker = createDummy({ name: 'Atacante', attackStat: 100 });
  const bbDefender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100, defenseStat: 100 });
  const bbState = createBattleState([bbAttacker], [bbDefender]);

  const bbMove: Move = {
    name: 'brutal-swing',
    type: 'dark',
    category: 'physical',
    power: 60,
    accuracy: 100,
    pp: 20,
    priority: 0,
    target: 'allAdjacent'
  } as unknown as Move;

  const bbDamage = calculateDamage(bbAttacker, bbDefender, bbMove as unknown as Move, 'none', false, 1, 0, [], bbState);

  console.log(bbDamage > 0 ? `✅ Dano calculado com sucesso: ${bbDamage}` : '❌ Falha no cálculo de dano');
  console.groupEnd();

  // --- TESTE: CANHÃO DE FLOR ---
  console.group('%c🌸 Teste: CANHÃO DE FLOR', 'color: #ec4899;');
  const fcAttacker = createDummy({ name: 'Magearna', spAttackStat: 100 });
  const fcLogs: LogEntry[] = [];
  const fcState = createBattleState([fcAttacker], []);

  handleFleurCannonEffect(fcAttacker, fcLogs, fcState);

  console.log(fcAttacker.statStages.spAttack === -2 ? '✅ Sp. Atk reduzido em 2 estágios' : `❌ Falha na redução (${fcAttacker.statStages.spAttack})`);
  console.groupEnd();

  // --- TESTE: ESFERA DE AURA ---
  console.group('%c🔵 Teste: ESFERA DE AURA', 'color: #3b82f6;');
  const asAttacker = createDummy({ name: 'Lucario' });
  const asDefender = createDummy({ name: 'Defensor', statStages: { accuracy: 0, evasion: 6, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 } });
  const asMove = { name: 'aura-sphere', accuracy: 100 } as any;

  const chance = calculateHitChance(asMove, asAttacker, asDefender, 'none');
  console.log(chance === '∞' ? '✅ Precisão Infinita confirmada' : `❌ Falha (${chance})`);
  console.groupEnd();

  // --- TESTE: REVENGE ---
  console.group('%c👊 Teste: Revenge (Vingança)', 'color: #b91c1c;');
  const revAttacker = createDummy({ name: 'Machamp' });
  const revDefender = createDummy({ name: 'Alakazam' });
  
  // Caso 1: Sem dano
  const revRes1 = getRevengePower(revAttacker, revDefender, 60);
  console.log(revRes1.power === 60 ? '✅ Base Power (60)' : `❌ Falha: ${revRes1.power}`);

  // Caso 2: Com dano do alvo
  revAttacker.statusEffects['avalanche-tracker'] = { turns: 1, sourceMoveName: revDefender.id.toString() };
  const revRes2 = getRevengePower(revAttacker, revDefender, 60);
  console.log(revRes2.power === 120 ? '✅ Boosted Power (120)' : `❌ Falha: ${revRes2.power}`);
  
  console.groupEnd();

  // --- TESTE: MAGNETIC FLUX ---
  console.group('%c🧲 Teste: Magnetic Flux (Fluxo Magnético)', 'color: #facc15;');
  const mfAttacker = createDummy({ name: 'Plusle', ability: 'plus' });
  const mfLogs: LogEntry[] = [];
  const mfState = createBattleState([mfAttacker], []);

  handleMagneticFlux(mfAttacker, mfLogs, mfState);

  console.log(mfAttacker.statStages.defense === 1 ? '✅ Defesa aumentada' : `❌ Falha Defesa (${mfAttacker.statStages.defense})`);
  console.log(mfAttacker.statStages.spDefense === 1 ? '✅ Def. Esp. aumentada' : `❌ Falha Def. Esp. (${mfAttacker.statStages.spDefense})`);

  const mfFailAttacker = createDummy({ name: 'Pikachu', ability: 'static' });
  const mfFailLogs: LogEntry[] = [];
  handleMagneticFlux(mfFailAttacker, mfFailLogs, mfState);
  console.log(mfFailLogs.some(l => l.message.includes('falhou')) ? '✅ Falhou corretamente sem habilidade' : '❌ Não falhou');

  console.groupEnd();

  // --- TESTE: SPIN OUT ---
  console.group('%c⚙️ Teste: Spin Out (Giro Desgovernado)', 'color: #94a3b8;');
  const soAttacker = createDummy({ name: 'Varoom', speedStat: 100 });
  const soLogs: LogEntry[] = [];
  const soState = createBattleState([soAttacker], []);

  handleSpinOutEffect(soAttacker, soLogs, soState);

  console.log(soAttacker.statStages.speed === -2 ? '✅ Velocidade reduzida em 2 estágios' : `❌ Falha na redução (${soAttacker.statStages.speed})`);
  console.groupEnd();

  // --- TESTE: MAGNITUDE ---
  console.group('%c🌋 Teste: Magnitude', 'color: #b45309;');
  const magAttacker = createDummy({ name: 'Golem' });
  const magLogs: LogEntry[] = [];
  
  const magPower = getMagnitudePower(magAttacker, magLogs);
  console.log(`✅ Poder Gerado: ${magPower}`);
  console.log(magLogs.some(l => l.message.includes('Magnitude')) ? '✅ Log de Magnitude presente' : '❌ Log ausente');

  console.groupEnd();

  // --- TESTE: PUNISHMENT ---
  console.group('%c⚖️ Teste: Punishment (Punição)', 'color: #7e22ce;');
  const punDefender = createDummy({ name: 'Defensor', statStages: { accuracy: 0, evasion: 0, attack: 2, defense: 0, spAttack: 0, spDefense: 0, speed: 1 } });
  const punLogs: LogEntry[] = [];
  
  const punPower = getPunishmentPower(punDefender, 60, punLogs);
  console.log(punPower === 120 ? `✅ Poder Aumentado: ${punPower} (Base 60 + 3 boosts * 20)` : `❌ Falha: ${punPower}`);
  
  const punDefenderMax = createDummy({ name: 'Defensor Max', statStages: { accuracy: 0, evasion: 0, attack: 6, defense: 6, spAttack: 0, spDefense: 0, speed: 0 } });
  const punPowerMax = getPunishmentPower(punDefenderMax, 60, []);
  console.log(punPowerMax === 200 ? '✅ Cap de 200 respeitado' : `❌ Falha no Cap: ${punPowerMax}`);

  console.groupEnd();

  // --- TESTE: PSYBLADE ---
  console.group('%c⚔️ Teste: Psyblade (Psicolâmina)', 'color: #ec4899;');
  const psyAttacker = createDummy({ name: 'Iron Leaves' });
  const psyLogs: LogEntry[] = [];
  const psyState = createBattleState([psyAttacker], []);
  
  const psyPowerNormal = getPsybladePower(psyAttacker, 80, psyState, []);
  console.log(psyPowerNormal === 80 ? '✅ Poder Normal: 80' : `❌ Falha Normal: ${psyPowerNormal}`);
  
  psyState.terrain = 'electric';
  const psyPowerBoost = getPsybladePower(psyAttacker, 80, psyState, psyLogs);
  console.log(psyPowerBoost === 120 ? '✅ Poder Boostado: 120' : `❌ Falha Boost: ${psyPowerBoost}`);
  console.log(psyLogs.some(l => l.message.includes('Terreno Elétrico')) ? '✅ Log de Terreno presente' : '❌ Log ausente');

  console.groupEnd();

  // --- TESTE: DESOLATE LAND ---
  console.group('%c☀️ Teste: Terra Desolada (Desolate Land)', 'color: #f59e0b;');
  const desAttacker = createDummy({ name: 'Kyogre' });
  const desDefender = createDummy({ name: 'Groudon', ability: 'desolate-land' });
  const desLogs: LogEntry[] = [];
  const desState = createBattleState([desAttacker], [desDefender]);

  const desWeather = triggerDesolateLand(desDefender, desState, desLogs);
  console.log(desWeather === 'sun' ? '✅ Clima alterado para Sol Forte' : `❌ Falha ao alterar clima: ${desWeather}`);
  
  desState.weather = 'sun'; // Simula estado atualizado
  const desMove = { name: 'surf', displayName: 'Surf', type: 'water', damageClass: 'special', power: 90, accuracy: 100, isStatus: false, description: '', uses: 0, maxUses: 10 };
  const desResult = validateMoveExecution(desState, desAttacker, desDefender, desMove, { p1Mode: 'manual', p1TeamSize: 1, p1Input: '', p2Mode: 'manual', p2TeamSize: 1, p2Input: '', opponentMode: 'manual', weatherEnabled: true, terrainEnabled: true, itemsEnabled: true, terastallizationEnabled: false, megaEvolutionEnabled: false, moveLimitEnabled: false, p1AutoMode: false, randomIvs: false, randomLevels: false }, undefined, false, false, false);
  
  console.log(!desResult.canProceed && desResult.logs.some(l => l.message.includes('evaporou no calor extremo')) ? '✅ Ataque de Água evaporado' : '❌ Falha ao evaporar ataque de Água');

  console.groupEnd();

  // --- TESTE: TERA SHELL ---
  console.group('%c🐢 Teste: Carapaça Tera (Tera Shell)', 'color: #6366f1;');
  const teraDefender = createDummy({ name: 'Terapagos', ability: 'tera-shell', hp: 100, maxHP: 100 });
  const teraLogs: LogEntry[] = [];
  
  // Teste 1: Ataque Super Efetivo (2.0) -> Deve virar 0.5 (Mult = 0.25)
  const multSuper = getDamageMultiplier(teraDefender, 2.0, teraLogs);
  console.log(multSuper === 0.25 ? '✅ Resistiu ataque Super Efetivo (2.0 -> 0.5)' : `❌ Falha Super Efetivo: ${multSuper}`);

  // Teste 2: Ataque Neutro (1.0) -> Deve virar 0.5 (Mult = 0.5)
  const multNeutral = getDamageMultiplier(teraDefender, 1.0, teraLogs);
  console.log(multNeutral === 0.5 ? '✅ Resistiu ataque Neutro (1.0 -> 0.5)' : `❌ Falha Neutro: ${multNeutral}`);

  // Teste 3: HP Baixo -> Não deve ativar
  teraDefender.hp = 50;
  const multLowHP = getDamageMultiplier(teraDefender, 2.0, teraLogs);
  console.log(multLowHP === 1.0 ? '✅ Inativo com HP baixo' : `❌ Ativou incorretamente com HP baixo: ${multLowHP}`);

  console.groupEnd();

  // --- TESTE: SANDSEAR STORM ---
  console.group('%c🏜️ Teste: Tempestade de Areia Escaldante (Sandsear Storm)', 'color: #d97706;');
  const sandAttacker = createDummy({ name: 'Landorus' });
  const sandDefender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100 });
  const sandLogs: LogEntry[] = [];
  const sandState = createBattleState([sandAttacker], [sandDefender]);

  handleSandsearStormEffect(sandAttacker, sandDefender, sandLogs, sandState);

  console.log(sandDefender.statusEffects['burn'] ? '✅ Queimadura aplicada' : '❌ Falha ao aplicar queimadura');
  console.groupEnd();

  // --- TESTE: COACHING ---
  console.group('%c🥋 Teste: Instrução (Coaching)', 'color: #ef4444;');
  const coachAttacker = createDummy({ name: 'Riolu' });
  const coachLogs: LogEntry[] = [];
  const coachState = createBattleState([coachAttacker], []);

  handleCoaching(coachAttacker, coachLogs, coachState);

  console.log(coachAttacker.statStages.attack === 1 ? '✅ Attack +1' : '❌ Falha Attack');
  console.log(coachAttacker.statStages.defense === 1 ? '✅ Defense +1' : '❌ Falha Defense');
  console.groupEnd();

  // --- TESTE: PERISH SONG ---
  console.group('%c🎶 Teste: Canção do Perecer (Perish Song)', 'color: #a855f7;');
  const perishAttacker = createDummy({ name: 'Lapras' });
  const perishDefender = createDummy({ name: 'Politoed' });
  const perishLogs: LogEntry[] = [];
  const perishState = createBattleState([perishAttacker], [perishDefender]);

  handlePerishSongStart(perishAttacker, perishLogs, perishState);
  console.log(perishAttacker.statusEffects['perish-song'] ? '✅ Status aplicado em Attacker' : '❌ Falha Attacker');
  console.log(perishDefender.statusEffects['perish-song'] ? '✅ Status aplicado em Defender' : '❌ Falha Defender');

  // Simula contagem
  perishAttacker.statusEffects['perish-song'].turns = 1;
  handlePerishCount(perishAttacker, perishLogs);
  console.log(perishAttacker.isFainted ? '✅ Attacker desmaiou na contagem 0' : '❌ Falha ao desmaiar');

  console.groupEnd();

  // --- TESTE: STRENGTH SAP ---
  console.group('%c🍄 Teste: Drenagem de Força (Strength Sap)', 'color: #16a34a;');
  const sapAttacker = createDummy({ name: 'Shiinotic', hp: 50, maxHP: 100 });
  const sapDefender = createDummy({ name: 'Machamp', attackStat: 130 });
  const sapLogs: LogEntry[] = [];
  const sapState = createBattleState([sapAttacker], [sapDefender]);

  handleStrengthSap(sapAttacker, sapDefender, sapLogs, sapState);

  console.log(sapAttacker.hp > 50 ? `✅ Curou HP (Atual: ${sapAttacker.hp})` : '❌ Falha ao curar');
  console.log(sapDefender.statStages.attack === -1 ? '✅ Attack -1' : '❌ Falha ao reduzir Attack');
  console.groupEnd();

  // --- TESTE: ION DELUGE ---
  console.group('%c⚡ Teste: Ion Deluge (Dilúvio de Íons)', 'color: #eab308;');
  const ionAttacker = createDummy({ name: 'Zeraora' });
  const ionDefender = createDummy({ name: 'Defensor' });
  const ionLogs: LogEntry[] = [];
  const ionState = createBattleState([ionAttacker], [ionDefender]);

  handleIonDeluge(ionAttacker, ionDefender, ionLogs, ionState);

  console.log(ionState.ionDelugeActive ? '✅ Efeito de campo ativo' : '❌ Falha ao ativar efeito');

  const ionNormalMove: Move = { name: 'tackle', type: 'normal', damageClass: 'physical' } as Move;
  const ionEffectiveType = getEffectiveMoveType(ionState, ionNormalMove);
  console.log(ionEffectiveType === 'electric' ? '✅ Golpe Normal virou Elétrico' : `❌ Falha na conversão (${ionEffectiveType})`);

  const ionFireMove: Move = { name: 'ember', type: 'fire', damageClass: 'special' } as Move;
  const ionFireEffectiveType = getEffectiveMoveType(ionState, ionFireMove);
  console.log(ionFireEffectiveType === 'fire' ? '✅ Golpe de Fogo inalterado' : `❌ Falha na preservação (${ionFireEffectiveType})`);

  console.groupEnd();

  // --- TESTE: UIVO (HOWL) ---
  console.group('%c🐺 Teste: Uivo (Howl)', 'color: #3b82f6;');
  const howlAttacker = createDummy({ name: 'Atacante' });
  const howlDefender = createDummy({ name: 'Defensor', hp: 100, maxHP: 100 });
  const howlLogs: LogEntry[] = [];
  const howlState = createBattleState([howlAttacker], [howlDefender]);

  handleHowl(howlAttacker, howlLogs, howlState);

  console.log(howlAttacker.statStages.attack === 1 ? '✅ Ataque aumentado' : '❌ Falha ao aumentar ataque');
  console.groupEnd();

  console.groupEnd();
}
