import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BattleReplay, BattleState, BattleReplayEvent } from '../types';
import { createBattlePRNGState } from '../utils/prng';
import { BattleCoordinator } from '../services/engine/coordinator';
import { TurnAnimator } from '../services/animation/turnAnimator';
import { PokemonCard } from './PokemonCard';
import { BattleHeader } from './BattleLayout';
import { restoreActivePokemonIdentity } from '../utils/pokemonIdentity';
import * as BattleEngine from '../services/engine';
import * as Effects from '../services/effectHandlers';
import {
    applyReplayCheckpointMegaProfiles,
    assertReplayCheckpoint,
    buildReplayForcedSwitchAction,
    buildReplayTurnAction,
    normalizeReplayTeams,
    parseBattleReplay,
    resolveReplaySwitchTarget,
} from '../services/replayLogic';

// ── Tipo das velocidades de reprodução ──────────────────────────────
//    Valores < 1 = mais lento; 1 = velocidade original dos delays
//    Inter-turn pause também é dividida pelo speed.
const SPEED_OPTIONS = [
    { label: '¼×', value: 0.25 },
    { label: '½×', value: 0.5  },
    { label: '1×', value: 1    },
    { label: '2×', value: 2    },
];
const DEFAULT_SPEED = 0.25; // ← Velocidade padrão mais lenta (CORREÇÃO #3)

// ── Delay entre turnos (além dos delays internos de cada step) ───────
const INTER_TURN_DELAY_MS = 1800; // pausa após cada turno antes do próximo

interface ReplayPlayerProps {
    onClose: () => void;
}

export default function ReplayPlayer({ onClose }: ReplayPlayerProps) {
    const [replayData, setReplayData]           = useState<BattleReplay | null>(null);
    const [error, setError]                     = useState<string>('');
    const [compatibilityWarning, setCompatibilityWarning] = useState('');
    const [isPlaying, setIsPlaying]             = useState(false);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed]     = useState(DEFAULT_SPEED);
    const [stateHistory, setStateHistory]       = useState<BattleState[]>([]);
    const [replayState, setReplayState]         = useState<BattleState | null>(null);

    // FIX #5 — acumulador persistente de logs (nunca reseta entre turnos)
    const accumulatedLogsRef = useRef<{ message: string; color: string }[]>([]);

    // FIX #4 — eventos do turno ATUAL para exibir ações dos jogadores
    const [currentTurnEvents, setCurrentTurnEvents] = useState<BattleReplayEvent[]>([]);

    // Avisos acumulados de compatibilidade (legado + checkpoints antigos sem integridade)
    const warningsRef = useRef<string[]>([]);
    const legacyWarningRef = useRef('');
    const addWarning = useCallback((warning: string | null) => {
        if (!warning || warningsRef.current.includes(warning)) return;
        warningsRef.current = [...warningsRef.current, warning];
        setCompatibilityWarning(warningsRef.current.join(' '));
    }, []);

    const stateRef        = useRef<BattleState | null>(null);
    const isAnimatingRef  = useRef(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll do log para o final sempre que logs mudam (CORREÇÃO #5)
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [replayState?.logs.length]);

    // ── Agrupamento de turnos ──────────────────────────────────────────
    const turns = replayData
        ? Array.from(new Set(replayData.events.map(e => e.turn))).sort((a, b) => Number(a) - Number(b))
        : [];

    // ── Carregamento do arquivo ────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = parseBattleReplay(JSON.parse(text));
            legacyWarningRef.current = parsed.warning;
            setReplayData(parsed.replay);
            resetReplay(parsed.replay);
            setError('');
        } catch (err: any) {
            setReplayData(null);
            setCompatibilityWarning('');
            warningsRef.current = [];
            legacyWarningRef.current = '';
            setError(err.message || 'Erro ao carregar replay.');
        }
    };

    // ── Reset / reiniciar replay ───────────────────────────────────────
    const resetReplay = useCallback((data: BattleReplay) => {
        setIsPlaying(false);
        setCurrentTurnIndex(0);
        setCurrentTurnEvents([]);
        setError('');

        // FIX #5: reiniciar acumulador de logs junto com o replay
        const initialLog = { message: 'Replay Carregado. Pronto para iniciar.', color: 'text-blue-600 font-bold' };
        accumulatedLogsRef.current = [initialLog];

        const normalizedTeams = normalizeReplayTeams(data.initialState);
        // Cada equipe é clonada uma única vez e o Pokémon ativo é a própria entrada da equipe
        // (mesma instância), como na batalha ao vivo. Clones independentes separariam ativo e
        // equipe já no primeiro turno e fariam o hash do checkpoint divergir.
        const team1 = structuredClone(normalizedTeams.team1);
        const team2 = structuredClone(normalizedTeams.team2);
        const initialState: BattleState = restoreActivePokemonIdentity({
            prngState: createBattlePRNGState(data.seed),
            team1,
            team2,
            currentPokemon1: team1[0],
            currentPokemon2: team2[0],
            p1Inventory: structuredClone(data.initialState.p1Inventory),
            p2Inventory: structuredClone(data.initialState.p2Inventory),
            p1TeraUsed: false, p2TeraUsed: false,
            p1MegaUsed: false, p2MegaUsed: false,
            turn: 1, weather: 'none', weatherTurns: 0, terrain: 'none', terrainTurns: 0,
            gravity: false, gravityTurns: 0,
            mudSportTurns: 0, waterSportTurns: 0, ionDelugeActive: false,
            wonderRoomActive: false, wonderRoomTurns: 0,
            magicRoomActive: false, magicRoomTurns: 0,
            trickRoomActive: false, trickRoomTurns: 0,
            p1Hazards: { toxicSpikes: 0, reflect: 0, lightScreen: 0, safeguard: 0, mist: 0, luckyChant: 0, auroraVeil: 0, stealthRock: false, stickyWeb: false, spikes: 0, tailwind: 0 },
            p2Hazards: { toxicSpikes: 0, reflect: 0, lightScreen: 0, safeguard: 0, mist: 0, luckyChant: 0, auroraVeil: 0, stealthRock: false, stickyWeb: false, spikes: 0, tailwind: 0 },
            logs: [initialLog],
            isBattleInProgress: true, winner: null, waitingForAction: false,
        });

        // O checkpoint inicial antecede os efeitos de entrada, como na batalha ao vivo.
        applyReplayCheckpointMegaProfiles(data, 0, initialState);
        warningsRef.current = legacyWarningRef.current ? [legacyWarningRef.current] : [];
        setCompatibilityWarning(warningsRef.current.join(' '));
        addWarning(assertReplayCheckpoint(data, 0, initialState));

        const entryLogs: any[] = [];
        Effects.handleEntryAbilities(initialState.currentPokemon1, initialState.currentPokemon2, data.initialState.config?.weatherEnabled ?? true, entryLogs, initialState);
        Effects.handleEntryAbilities(initialState.currentPokemon2, initialState.currentPokemon1, data.initialState.config?.weatherEnabled ?? true, entryLogs, initialState);
        initialState.logs = [...initialState.logs, ...entryLogs];

        setReplayState(initialState);
        stateRef.current = initialState;
        setStateHistory([initialState]);
    }, []);

    // ── updateStateWithLogs local (FIX #5: acumula via ref) ───────────
    const updateStateWithLogs = useCallback((newState: BattleState, logs: { message: string; color: string }[]) => {
        if (logs.length > 0) {
            accumulatedLogsRef.current = [...accumulatedLogsRef.current, ...logs];
        }
        const updated = { ...newState, logs: accumulatedLogsRef.current };
        setReplayState(updated);
        stateRef.current = updated;
    }, []);

    // ── Reproduzir próximo turno ───────────────────────────────────────
    const playNextTurn = useCallback(async () => {
        if (!replayData || !stateRef.current || isAnimatingRef.current) return;

        const currentTurnNum = turns[currentTurnIndex];
        if (currentTurnNum === undefined) {
            setIsPlaying(false);
            return;
        }

        const turnEvents = replayData.events.filter(e => e.turn === currentTurnNum);
        if (turnEvents.length === 0) {
            setCurrentTurnIndex(prev => prev + 1);
            return;
        }

        // FIX #4: expor eventos do turno atual para exibir ações na UI
        setCurrentTurnEvents(turnEvents);

        isAnimatingRef.current = true;
        setError('');

        try {
            // Trocas pós-desmaio são externas ao coordinator e podem ser a única
            // decisão gravada no turno seguinte; nesse caso não há novo turno a executar.
            ([1, 2] as const).forEach(playerNum => {
                const active = playerNum === 1 ? stateRef.current!.currentPokemon1 : stateRef.current!.currentPokemon2;
                if (active?.isFainted) {
                    const forcedEvent = turnEvents.find(e => e.actorId === playerNum && e.isForcedSwitch);
                    const forcedAction = buildReplayForcedSwitchAction(stateRef.current!, forcedEvent, playerNum, currentTurnNum);
                    const res = BattleEngine.performSwitch(stateRef.current!, forcedAction.data, playerNum, replayData.initialState.config.weatherEnabled);
                    updateStateWithLogs(res.newState, res.logs);
                }
            });

            const p1Event = turnEvents.find(e => e.actorId === 1 && !e.isForcedSwitch && !e.isBatonPass);
            const p2Event = turnEvents.find(e => e.actorId === 2 && !e.isForcedSwitch && !e.isBatonPass);

            if (p1Event || p2Event) {
                applyReplayCheckpointMegaProfiles(replayData, currentTurnNum, stateRef.current!);
                const stateBeforeTurn = structuredClone(stateRef.current!);
                const p1Action = buildReplayTurnAction(stateRef.current!, p1Event, 1, currentTurnNum);
                const p2Action = buildReplayTurnAction(stateRef.current!, p2Event, 2, currentTurnNum);
                const uiActions = { setAnimationState: () => {} };
                const generator = BattleCoordinator.runTurn(
                    stateRef.current,
                    p1Action,
                    p2Action,
                    replayData.initialState.config
                );

                let verificationState: BattleState | null = null;
                let result = generator.next();
                while (!result.done) {
                    const step = result.value;
                    if (!step) { result = generator.next(); continue; }

                    await TurnAnimator.processStep(step, uiActions, playbackSpeed);
                    updateStateWithLogs(step.state, step.logs);

                    if (step.switchPrompt) {
                        const playerNum = step.switchPrompt.player;
                        const forcedEvent = turnEvents.find(e => e.actorId === playerNum && (e.isForcedSwitch || e.isBatonPass));
                        const forcedAction = buildReplayForcedSwitchAction(stateRef.current!, forcedEvent, playerNum, currentTurnNum);
                        result = generator.next(forcedAction);
                        continue;
                    }

                    if (step.phase === 'faint-switch') {
                        // O checkpoint é gravado antes das trocas externas pós-desmaio.
                        // O estado vivo segue recebendo os substitutos para os próximos turnos.
                        verificationState = structuredClone(step.state);
                        ([1, 2] as const).forEach(playerNum => {
                            const active = playerNum === 1 ? stateRef.current!.currentPokemon1 : stateRef.current!.currentPokemon2;
                            if (active?.isFainted) {
                                const forcedEvent = turnEvents.find(e => e.actorId === playerNum && e.isForcedSwitch);
                                if (forcedEvent && (forcedEvent.switchInstanceId || forcedEvent.switchId !== undefined)) {
                                    const switchTarget = resolveReplaySwitchTarget(stateRef.current!, forcedEvent);
                                    if (switchTarget) {
                                        const res = BattleEngine.performSwitch(stateRef.current!, switchTarget, playerNum, replayData.initialState.config.weatherEnabled);
                                        updateStateWithLogs(res.newState, res.logs);
                                    }
                                }
                            }
                        });
                    }

                    result = generator.next();
                }

                // Só um turno efetivamente concluído pelo coordinator possui checkpoint.
                addWarning(assertReplayCheckpoint(replayData, currentTurnNum, verificationState ?? stateRef.current!, stateBeforeTurn));
            }

            setStateHistory(prev => [...prev, stateRef.current!]);
        } catch (err: any) {
            setError(err.message || 'Erro ao reproduzir replay.');
            setIsPlaying(false);
            return;
        } finally {
            isAnimatingRef.current = false;
        }

        // FIX #3: pausa entre turnos antes de avançar automaticamente
        await new Promise(r => setTimeout(r, INTER_TURN_DELAY_MS / playbackSpeed));

        setCurrentTurnIndex(prev => prev + 1);
    }, [replayData, currentTurnIndex, turns, playbackSpeed, updateStateWithLogs]);

    // ── Efeito de auto-play ────────────────────────────────────────────
    useEffect(() => {
        if (isPlaying) {
            playNextTurn();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, currentTurnIndex]);

    // ── Renderização ───────────────────────────────────────────────────
    return (
        // FIX #1: FULL SCREEN — remover max-w, max-h, rounded, p-4 do overlay
        <div className="fixed inset-0 bg-gray-950 dark:bg-gray-950 z-50 flex flex-col overflow-hidden">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex-shrink-0 bg-gray-800 text-white flex items-center justify-between px-6 py-3 shadow-lg">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🎥</span>
                    <h2 className="text-xl font-black tracking-tight">Player de Replay</h2>
                </div>
                {/* FIX #2: Botão fechar proeminente no canto superior direito */}
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black px-5 py-2 rounded-lg shadow-md transition-all text-sm uppercase tracking-wider"
                    title="Fechar Player de Replay e voltar à tela inicial"
                >
                    ✕ Fechar Replay
                </button>
            </div>

            {/* ── Conteúdo ───────────────────────────────────────────── */}
            {!replayData ? (

                /* ── Tela de upload ──────────────────────────────────── */
                <div className="flex-grow flex flex-col items-center justify-center gap-6 p-8">
                    <div className="text-6xl">🎬</div>
                    <p className="text-gray-300 text-lg font-medium">Selecione um arquivo de replay (.json) para assistir.</p>
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-3 rounded-xl shadow-lg transition-all active:scale-95">
                        📂 Escolher Arquivo
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                    {error && (
                        <p className="text-red-400 font-bold bg-red-900/30 px-4 py-2 rounded-lg border border-red-700">{error}</p>
                    )}
                </div>

            ) : (

                /* ── Player ──────────────────────────────────────────── */
                <div className="flex-grow flex flex-col overflow-hidden">

                    {/* ── Barra de controles ───────────────────────────── */}
                    <div className="flex-shrink-0 bg-gray-700 px-4 py-3 flex flex-wrap items-center justify-center gap-3 border-b border-gray-600">
                        {/* Reiniciar */}
                        <button
                            className="flex items-center gap-1 px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white font-bold rounded-lg shadow transition-all active:scale-95 text-sm"
                            onClick={() => resetReplay(replayData)}
                        >
                            ⏪ Reiniciar
                        </button>

                        {/* Voltar turno */}
                        <button
                            className="flex items-center gap-1 px-4 py-2 bg-gray-500 hover:bg-gray-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow transition-all active:scale-95 text-sm"
                            onClick={() => {
                                if (currentTurnIndex > 0 && !isPlaying) {
                                    const newIndex = currentTurnIndex - 1;
                                    setCurrentTurnIndex(newIndex);
                                    const prevState = stateHistory[newIndex];
                                    if (prevState) {
                                        setReplayState(prevState);
                                        stateRef.current = prevState;
                                        accumulatedLogsRef.current = prevState.logs;
                                    }
                                    setStateHistory(prev => prev.slice(0, newIndex + 1));
                                    setCurrentTurnEvents([]);
                                }
                            }}
                            disabled={isPlaying || currentTurnIndex === 0}
                        >
                            ⬅ Voltar
                        </button>

                        {/* Play / Pause */}
                        <button
                            className={`flex items-center gap-2 px-7 py-2 rounded-lg font-black text-white shadow-lg transition-all active:scale-95 text-sm ${
                                isPlaying
                                    ? 'bg-yellow-500 hover:bg-yellow-600'
                                    : 'bg-green-500 hover:bg-green-600'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                            onClick={() => setIsPlaying(p => !p)}
                            disabled={currentTurnIndex >= turns.length}
                        >
                            {isPlaying ? '⏸ Pausar' : '▶ Reproduzir'}
                        </button>

                        {/* Próximo turno */}
                        <button
                            className="flex items-center gap-1 px-4 py-2 bg-gray-500 hover:bg-gray-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow transition-all active:scale-95 text-sm"
                            onClick={() => { if (!isPlaying) playNextTurn(); }}
                            disabled={isPlaying || currentTurnIndex >= turns.length}
                        >
                            Próximo ⏭
                        </button>

                        {/* Velocidade (FIX #3: opções mais lentas + default 0.25x) */}
                        <div className="flex items-center gap-2 ml-4 bg-gray-600 rounded-lg px-3 py-1">
                            <span className="text-xs font-bold text-gray-300">Velocidade:</span>
                            <div className="flex gap-1">
                                {SPEED_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setPlaybackSpeed(opt.value)}
                                        className={`px-2 py-1 rounded text-xs font-black transition-all ${
                                            playbackSpeed === opt.value
                                                ? 'bg-indigo-500 text-white'
                                                : 'bg-gray-500 text-gray-200 hover:bg-gray-400'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contador de turno */}
                        <div className="ml-auto bg-gray-600 rounded-lg px-4 py-2 text-sm font-black text-white">
                            Turno: {currentTurnIndex} / {turns.length}
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="flex-shrink-0 text-red-300 font-bold bg-red-950/80 px-6 py-3 border-b border-red-700">
                            {error}
                        </p>
                    )}
                    {compatibilityWarning && (
                        <p role="status" className="flex-shrink-0 text-amber-200 font-bold bg-amber-950/70 px-6 py-3 border-b border-amber-700">
                            {compatibilityWarning}
                        </p>
                    )}

                    {/* ── Área principal (scrollável) ─────────────────── */}
                    <div className="flex-grow overflow-y-auto p-4 bg-gray-900 space-y-4">
                        {replayState && (
                            <>
                                {/* Header de condições de batalha */}
                                <BattleHeader
                                    turn={replayState.turn}
                                    weather={replayState.weather}
                                    weatherTurns={replayState.weatherTurns}
                                    terrain={replayState.terrain}
                                    terrainTurns={replayState.terrainTurns}
                                    trickRoom={replayState.trickRoomActive}
                                    trickRoomTurns={replayState.trickRoomTurns}
                                    gravity={replayState.gravity}
                                    gravityTurns={replayState.gravityTurns}
                                    wonderRoom={replayState.wonderRoomActive}
                                    wonderRoomTurns={replayState.wonderRoomTurns}
                                    magicRoom={replayState.magicRoomActive}
                                    magicRoomTurns={replayState.magicRoomTurns}
                                    p1Hazards={replayState.p1Hazards}
                                    p2Hazards={replayState.p2Hazards}
                                />

                                {/* Cards dos Pokémon */}
                                <div className="flex flex-col md:flex-row justify-center items-center gap-4 min-h-[260px] w-full">
                                    <PokemonCard
                                        pokemon={replayState.currentPokemon1!}
                                        isPlayer={true}
                                        team={replayState.team1}
                                        weather={replayState.weather}
                                        terrain={replayState.terrain}
                                        sideHazards={replayState.p1Hazards}
                                        showTeraType={true}
                                    />
                                    <div className="hidden md:flex flex-col items-center justify-center px-4">
                                        <div className="text-4xl font-black text-gray-600 italic">VS</div>
                                    </div>
                                    <PokemonCard
                                        pokemon={replayState.currentPokemon2!}
                                        isPlayer={false}
                                        team={replayState.team2}
                                        weather={replayState.weather}
                                        terrain={replayState.terrain}
                                        sideHazards={replayState.p2Hazards}
                                        showTeraType={true}
                                    />
                                </div>

                                {/* ── FIX #4: Painel de ações do turno ─────────────────────
                                    Mostra os movimentos de AMBOS os jogadores.
                                    Botões são não-clicáveis (disabled).
                                    O movimento/ação escolhida é destacado com anel dourado. */}
                                {currentTurnEvents.length > 0 && (
                                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 text-center">
                                            ⚔️ Ações do Turno {currentTurnEvents[0]?.turn ?? replayState.turn}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* P1 */}
                                            {([1, 2] as const).map(playerNum => {
                                                const pokemon = playerNum === 1 ? replayState.currentPokemon1 : replayState.currentPokemon2;
                                                if (!pokemon) return null;
                                                const event = currentTurnEvents.find(e => e.actorId === playerNum && !e.isForcedSwitch && !e.isBatonPass);
                                                const isSwitch = event?.actionType === 'switch';
                                                const isItem   = event?.actionType === 'item';
                                                const selectedMoveId = event?.actionType === 'move' ? event.moveId : null;
                                                const playerColor = playerNum === 1 ? 'text-green-400' : 'text-red-400';
                                                const borderColor  = playerNum === 1 ? 'border-green-700' : 'border-red-700';

                                                return (
                                                    <div key={playerNum} className={`bg-gray-900 rounded-lg p-3 border ${borderColor}`}>
                                                        <p className={`text-xs font-black uppercase mb-2 ${playerColor}`}>
                                                            {playerNum === 1 ? '👤 Jogador 1' : '🤖 Jogador 2'} — {pokemon?.name ?? 'Pokémon'}
                                                        </p>

                                                        {/* Se foi troca */}
                                                        {isSwitch && (
                                                            <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-lg px-3 py-2 text-center text-yellow-300 font-bold text-sm">
                                                                🔄 Trocou Pokémon
                                                            </div>
                                                        )}

                                                        {/* Se foi item */}
                                                        {isItem && (
                                                            <div className="bg-amber-500/20 border-2 border-amber-400 rounded-lg px-3 py-2 text-center text-amber-300 font-bold text-sm">
                                                                🎒 Usou Item: {event?.itemId ?? '—'}
                                                            </div>
                                                        )}

                                                        {/* Movimentos (sempre mostrar todos os 4) */}
                                                        {!isSwitch && !isItem && (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {pokemon?.moves?.map((move, idx) => {
                                                                    if (!move) return null;
                                                                    const isSelected = move?.name === selectedMoveId;
                                                                    return (
                                                                        <button
                                                                            key={move?.name || idx}
                                                                            disabled
                                                                            className={`
                                                                                relative px-2 py-2 rounded-lg text-sm font-bold text-white
                                                                                type-${move.type}
                                                                                cursor-not-allowed select-none
                                                                                transition-all
                                                                                ${isSelected
                                                                                    ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900 scale-105 brightness-125'
                                                                                    : 'opacity-50 brightness-75'
                                                                                }
                                                                            `}
                                                                            title={`${move.displayName}${isSelected ? ' ← escolhido' : ''}`}
                                                                        >
                                                                            {move.displayName}
                                                                            {isSelected && (
                                                                                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-[9px] font-black rounded-full px-1 leading-4">
                                                                                    ✓
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Sem ação registrada */}
                                                        {!event && (
                                                            <div className="text-gray-500 text-xs text-center py-2 italic">
                                                                Sem ação registrada para este turno
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ── FIX #5: Log de batalha acumulado (todos os turnos) ─── */}
                                <div
                                    ref={logContainerRef}
                                    className="bg-gray-800 border border-gray-700 rounded-xl p-4 h-56 overflow-y-auto shadow-inner"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                        📋 Log da Batalha
                                    </p>
                                    {replayState.logs.map((log, i) => (
                                        <p key={i} className={`text-sm mb-0.5 leading-snug ${log.color || 'text-gray-300'}`}>
                                            {log.message}
                                        </p>
                                    ))}
                                    {replayState.logs.length === 1 && (
                                        <p className="text-gray-600 text-xs italic mt-2">
                                            Os logs aparecerão aqui conforme o replay avança...
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
