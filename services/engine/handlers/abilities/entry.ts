
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { ABILITY_EFFECTS } from '../../../../data/abilities';
import { log } from '../../utils';
import * as Forms from './forms';
import * as StatusEffect from '../../../effectHandlers';
import * as Rattled from './rattled';
import * as Competitive from './competitive';
import * as Defiant from './defiant';
import * as DauntlessShield from './dauntless_shield';
import * as IntrepidSword from './intrepid_sword';
import * as VitalSpirit from './vital_spirit';
import * as Insomnia from './insomnia';
import * as Limber from './limber';
import * as InnerFocus from './inner_focus';
import * as WhiteSmoke from './white_smoke';
import * as Immunity from './immunity';
import * as MoldBreaker from './mold_breaker';
import * as Trace from './trace';
import * as WaterVeil from './water_veil';
import * as SupersweetSyrup from './supersweet_syrup';
import * as FullMetalBody from './full_metal_body';
import * as ClearBody from './clear_body';
import * as HyperCutter from './hyper_cutter';
import * as NeutralizingGas from './neutralizing_gas';
import * as Receiver from './receiver';
import * as Anticipation from './anticipation';
import * as AirLock from './air_lock';
import * as Commander from './commander';
import * as Scrappy from './scrappy';
import * as OwnTempo from './own_tempo';
import * as Unnerve from './unnerve';
import * as Download from './download';
import * as ElectricSurge from './electric_surge';
import * as GrassySurge from './grassy_surge';
import * as MistySurge from './misty_surge';
import * as PsychicSurge from './psychic_surge';
import * as Illusion from './illusion';
import * as SlowStart from './slow_start';
import * as Oblivious from './oblivious';
import * as HadronEngine from './hadron_engine';
import * as Pressure from './pressure';
import * as Forewarn from './forewarn';
import * as OrichalcumPulse from './orichalcum_pulse';
import * as SnowWarning from './snow_warning';
import * as Drought from './drought';
import * as Frisk from './frisk';
import * as SupremeOverlord from './supreme_overlord';
import * as SweetVeil from './sweet_veil';
import * as AuraBreak from './aura_break';
import * as Costar from './costar';
import * as MagmaArmor from './magma_armor';
import * as BallFetch from './ball_fetch';
import * as IceFace from './ice_face';
import * as ZeroToHero from './zero_to_hero';
import * as Hospitality from './hospitality';
import * as ScreenCleaner from './screen_cleaner';
import * as TeraShift from './tera_shift';
import * as Multitype from './multitype';
import * as Forecast from './forecast';
import * as RKSSystem from './rks_system';
import * as Imposter from './imposter';
import * as MirrorArmor from './mirror_armor';
import * as GuardDog from './guard_dog';
import * as TeraformZero from './teraform_zero';
import * as DesolateLand from './desolate_land';

export function handleEntryAbilities(
    pokemon: Pokemon, 
    opponent: Pokemon | null, 
    weatherEnabled: boolean, 
    logs: LogEntry[], 
    state: BattleState,
    lastPokemon: Pokemon | null = null
): { weather?: BattleState['weather'] } {
    let newWeather: BattleState['weather'] | undefined;

    // Multitipo (Arceus) e Sistema RKS (Silvally) - Devem ocorrer imediatamente
    Multitype.handleMultitype(pokemon, logs);
    RKSSystem.handleRKSSystem(pokemon, logs);

    // Tenta aplicar Ilusão imediatamente
    const team = state.team1.some(p => p.id === pokemon.id) ? state.team1 : state.team2;
    Illusion.applyIllusion(pokemon, team, logs);

    // Se o Pokémon que entra tem Gás Neutralizante, anuncia imediatamente
    if (pokemon.ability === 'neutralizing-gas') {
        NeutralizingGas.announceGas(pokemon, logs, state);
    }

    // Bloqueio Aéreo / Nuvem Nove
    if (pokemon.ability === 'air-lock' || pokemon.ability === 'cloud-nine') {
        AirLock.announceAirLock(pokemon, logs);
    }

    // Teraformação Zero (Teraform Zero)
    TeraformZero.handleTeraformZero(pokemon, state, logs);

    // Mudança Tera (Tera Shift)
    TeraShift.handleTeraShift(pokemon, logs);

    // Se o Gás estiver ativo, apenas habilidades imunes funcionam
    if (!NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        // Forecast ainda precisa checar se volta ao normal se suprimida por gás na entrada
        Forecast.handleForecast(pokemon, state, logs);
        return {};
    }

    // --- IMPOSTOR (Ditto) ---
    Imposter.handleImposter(pokemon, opponent, logs, state);

    // Do Zero ao Herói
    ZeroToHero.checkTransformation(pokemon, logs);

    // Coestrelato (Costar)
    Costar.handleCostar(pokemon, lastPokemon, logs);

    // Hospitalidade (Hospitality)
    Hospitality.handleHospitality(pokemon, lastPokemon, logs);

    // Limpa-Telas (Screen Cleaner)
    ScreenCleaner.handleScreenCleaner(pokemon, state, logs);

    // Aura Inversa (Aura Break)
    if (pokemon.ability === 'aura-break') {
        AuraBreak.announceAuraBreak(pokemon, logs);
    }

    // Tensão (Unnerve) e Unidade (As One)
    Unnerve.announceUnnerve(pokemon, logs);

    // Anúncio de Pressão
    Pressure.announcePressure(pokemon, logs);

    // Anúncio de Habilidades de Ruína (Indicador visual de redução)
    if (pokemon.ability === 'beads-of-ruin') {
        log(logs, `As Contas da Ruína de ${pokemon.name} reduziram a Defesa Especial de todos!`, 'text-purple-700 font-bold italic');
    }
    if (pokemon.ability === 'sword-of-ruin') {
        log(logs, `A Espada da Ruína de ${pokemon.name} reduziram a Defesa de todos!`, 'text-purple-700 font-bold italic');
    }
    if (pokemon.ability === 'tablets-of-ruin') {
        log(logs, `As Tabuletas da Ruína de ${pokemon.name} reduziram o Ataque de todos!`, 'text-purple-700 font-bold italic');
    }
    if (pokemon.ability === 'vessel-of-ruin') {
        log(logs, `O Vaso da Ruína de ${pokemon.name} reduziu o Ataque Especial de todos!`, 'text-purple-700 font-bold italic');
    }

    // Soberano Supremo
    SupremeOverlord.announceSupremeOverlord(pokemon, state, logs);

    // Slow Start
    SlowStart.announceEntry(pokemon, logs);

    // Receptor
    Receiver.handleReceiver(pokemon, lastPokemon, logs);

    Trace.handleTrace(pokemon, opponent, logs);
    Forms.checkSchooling(pokemon, logs);
    Forms.checkShieldsDown(pokemon, logs);

    if (MoldBreaker.suppressesAbilities(pokemon.ability)) {
        log(logs, `${pokemon.name} quebra o molde!`, 'text-purple-600 font-bold italic');
    }

    VitalSpirit.checkVitalSpirit(pokemon, logs);
    Insomnia.checkInsomnia(pokemon, logs);
    SweetVeil.checkSweetVeil(pokemon, logs);
    Limber.checkLimber(pokemon, logs);
    Immunity.checkImmunity(pokemon, logs);
    WaterVeil.checkWaterVeil(pokemon, logs);
    MagmaArmor.checkMagmaArmor(pokemon, logs);
    BallFetch.handleBallFetch(pokemon, logs);
    
    if (weatherEnabled && state.weather === 'hail') {
        IceFace.checkIceFaceRestoration(pokemon, state.weather, logs);
    }

    SupersweetSyrup.triggerSupersweetSyrup(pokemon, opponent, logs);
    Frisk.handleFrisk(pokemon, opponent, logs);
    Anticipation.checkAnticipation(pokemon, opponent, logs);
    Forewarn.triggerForewarn(pokemon, opponent, logs);
    Commander.handleCommander(pokemon, state, logs);

    if (pokemon.ability === 'download') {
        Download.handleDownload(pokemon, opponent, state, logs);
    }

    ElectricSurge.handleElectricSurge(pokemon, state, logs);
    GrassySurge.handleGrassySurge(pokemon, state, logs);
    MistySurge.handleMistySurge(pokemon, state, logs);
    PsychicSurge.handlePsychicSurge(pokemon, state, logs);
    HadronEngine.triggerHadronEngineTerrain(pokemon, state, logs);

    if (weatherEnabled) {
        if (DesolateLand.isDesolateLandActive(state) && pokemon.ability !== 'desolate-land') {
            log(logs, `O calor extremo impede que o clima mude!`, 'text-orange-600 italic font-bold');
        } else {
            const opWeather = OrichalcumPulse.triggerWeather(pokemon, state, logs);
            if (opWeather) newWeather = opWeather as any;

            if (!newWeather) {
                const desolateWeather = DesolateLand.triggerDesolateLand(pokemon, state, logs);
                if (desolateWeather) newWeather = desolateWeather as any;
            }

            if (!newWeather) {
                const droughtWeather = Drought.triggerDrought(pokemon, state, logs);
                if (droughtWeather) newWeather = droughtWeather as any;
            }

            if (!newWeather) {
                const snowWeather = SnowWarning.triggerSnowWarning(pokemon, state, logs);
                if (snowWeather) newWeather = snowWeather as any;
            }
        }
    }

    const ab = ABILITY_EFFECTS[pokemon.ability];
    if (ab?.weather && weatherEnabled && !newWeather && !DesolateLand.isDesolateLandActive(state)) {
        newWeather = ab.weather;
        log(logs, `O clima mudou devido a ${ABILITY_EFFECTS[pokemon.ability]?.name || pokemon.ability}!`, 'text-blue-600');
    }

    // Após processar todas as mudanças de clima de entrada, Castform deve atualizar sua forma
    const finalState = newWeather ? { ...state, weather: newWeather } : state;
    Forecast.handleForecast(pokemon, finalState as any, logs);
    // Também atualiza o oponente se ele for um Castform
    if (opponent) Forecast.handleForecast(opponent, finalState as any, logs);

    if (pokemon.ability === 'intimidate' && opponent && !opponent.isFainted) {
        if (NeutralizingGas.canAbilityTrigger(opponent, state)) {
            const ignoresAbilities = MoldBreaker.suppressesAbilities(pokemon.ability);
            const isImmune = FullMetalBody.isImmuneToStatDrops(opponent) || 
                ClearBody.isImmuneToStatDrops(opponent, ignoresAbilities) || 
                WhiteSmoke.isImmuneToStatDrops(opponent, ignoresAbilities) || 
                HyperCutter.isImmuneToAttackDrop(opponent, ignoresAbilities) ||
                (!ignoresAbilities && InnerFocus.isImmuneToIntimidate(opponent)) ||
                Scrappy.isImmuneToIntimidate(opponent) ||
                Oblivious.isImmuneToIntimidate(opponent) ||
                OwnTempo.isImmuneToIntimidate(opponent);

            if (!isImmune) {
                // Checa Cão de Guarda (Guard Dog)
                if (opponent.ability === 'guard-dog') {
                    GuardDog.handleIntimidate(opponent, logs);
                }
                // Checa Mirror Armor (Armadura Espelhada)
                else if (MirrorArmor.shouldReflect(opponent, ignoresAbilities, logs)) {
                    // Reflete para o usuário da Intimidação
                    if (pokemon.statStages.attack > -6) {
                        pokemon.statStages.attack -= 1;
                        log(logs, `${pokemon.name} teve seu Ataque reduzido pelo reflexo da armadura!`, 'text-red-600');
                    }
                } else {
                    // Aplicação normal
                    if (opponent.statStages.attack > -6) {
                        opponent.statStages.attack -= 1;
                        log(logs, `${pokemon.name} intimida ${opponent.name}! Ataque caiu!`, 'text-orange-600');
                        if (opponent.ability === 'competitive') Competitive.triggerCompetitive(opponent, logs);
                        if (opponent.ability === 'defiant') Defiant.triggerDefiant(opponent, logs);
                        if (opponent.ability === 'rattled') Rattled.triggerRattled(opponent, logs, "Intimidação");
                    }
                }
            }
        }
    }

    if (pokemon.ability === 'dauntless-shield') DauntlessShield.triggerDauntlessShield(pokemon, logs);
    if (pokemon.ability === 'intrepid-sword') IntrepidSword.triggerIntrepidSword(pokemon, logs);
    
    return { weather: newWeather };
}
