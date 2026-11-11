
import React, { useRef, useEffect, useState } from 'react';
import { ITEMS_DATA, MEGA_STONES } from './data/items'; 
import { useBattleController } from './hooks/useBattleController';
import * as BattleEngine from './services/engine'; 
import { useDynamicBGM } from './hooks/useDynamicBGM'; // Novo Hook
import { useDarkMode } from './hooks/useDarkMode';

import { PokemonCard } from './components/PokemonCard';
import { MoveButton } from './components/MoveButton';
import { SwitchModal, DetailsModal } from './components/BattleModals';
import { BattleHeader, BattleLogs } from './components/BattleLayout';
import { BagButton } from './components/BagButton'; 
import { BagModal } from './components/BagModal';   
import { TeamBuilderModal } from './components/TeamBuilderModal'; 
import { BattleScene } from './components/BattleScene'; 
import { VolumeControl } from './components/VolumeControl'; 
import ReplayPlayer from './components/ReplayPlayer';
import { BattleSummaryScreen } from './components/BattleSummaryScreen';

const WEATHER_BG_COLORS: Record<string, string> = {
    'sun': '#fcd34d', 
    'rain': '#93c5fd', 
    'sand': '#d6d3d1', 
    'hail': '#67e8f9', 
    'none': '#f3f4f6'  
};

const TERRAIN_BG_COLORS: Record<string, string> = {
    'electric': '#fde047', 
    'grassy': '#86efac',   
    'misty': '#f9a8d4',    
    'psychic': '#d8b4fe',  
    'none': '#f3f4f6'      
};

const WEATHER_BG_COLORS_DARK: Record<string, string> = {
  'sun': '#451a03', 'rain': '#0c1a2e', 'sand': '#1c1917', 'hail': '#082f49', 'none': '#0f172a'
};
const TERRAIN_BG_COLORS_DARK: Record<string, string> = {
  'electric': '#713f12', 'grassy': '#052e16', 'misty': '#500724', 'psychic': '#3b0764', 'none': '#0f172a'
};

export default function App() {
  const {
    state,
    config,
    setConfig,
    isLoading,
    p1AiSelectedMove,
    aiHighlightingMember,
    p1AiBagSelection,
    showSwitchModal,
    setShowSwitchModal,
    showDetailsModal,
    setShowDetailsModal,
    showBagModal,
    setShowBagModal,
    activeBuilderPlayer,
    setActiveBuilderPlayer,
    isTeraToggled,
    setIsTeraToggled,
    isMegaToggled,
    setIsMegaToggled, 
    toastMessage,
    animationState,
    p1Action,
    p2Action,
    handleStartClick,
    handleBuilderSave,
    handleRunAway,
    handleBagAction,
    handlePlayerAction,
    recordAction,
    resetBattle,
    updateStateWithLogs,
    checkFaintedSwitch,
    p1CustomTeamRef,
    p2CustomTeamRef,
    currentPlayer: currentPlayerRaw,
    currentActive,
    currentTarget,
    isCurrentTrapped,
    currentReplay,
    stateRef,
    configRef
  } = useBattleController();

  // Integração do Sistema de Música Dinâmica
  useDynamicBGM(state);
  const [isDark, toggleDark] = useDarkMode();

  const currentPlayer = currentPlayerRaw as 1 | 2;
  const [isSceneMaximized, setIsSceneMaximized] = useState(false);
  
  const [p1ImportStatus, setP1ImportStatus] = useState<string>('');
  const [p2ImportStatus, setP2ImportStatus] = useState<string>('');
  const [showReplayPlayer, setShowReplayPlayer] = useState(false);
  const [openRouterModels, setOpenRouterModels] = useState<Array<{ id: string, name: string, isFree: boolean }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (config.useLLM && config.llmProvider === 'openrouter') {
      setLoadingModels(true);
      fetch('/api/openrouter-models')
        .then(res => res.json())
        .then(data => {
          if (data.models) {
            setOpenRouterModels(data.models);
          }
        })
        .catch(err => console.error('Error loading OpenRouter models:', err))
        .finally(() => setLoadingModels(false));
    }
  }, [config.useLLM, config.llmProvider]);

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [state.logs]);

  const handleExportTeam = (playerNum: 1 | 2) => {
      const team = playerNum === 1 ? state.team1 : state.team2;
      const json = JSON.stringify(team, null, 2);
      
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equipe_p${playerNum}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 flex flex-col items-center min-h-screen text-gray-900 dark:text-gray-100 dark:bg-slate-900">
      <div className="max-w-4xl w-full">
        <div className={`info-toast fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-300 ${toastMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             {toastMessage}
        </div>

        {!state.isBattleInProgress && !state.winner ? (
            <div className="bg-white p-6 rounded-xl shadow-2xl border-4 border-indigo-200 dark:bg-slate-800 dark:border-indigo-900 flex flex-col gap-6 relative">
                {/* Volume Control in Setup */}
                <div className="w-full flex justify-end gap-2 mb-2 flex-wrap">
                    <button
                      onClick={toggleDark}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 dark:bg-slate-700 backdrop-blur-sm border border-gray-200 dark:border-slate-600 shadow-sm hover:scale-110 transition-transform text-lg"
                      title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
                    >
                      {isDark ? '☀️' : '🌙'}
                    </button>
                    <VolumeControl type="music" label="BGM" />
                    <VolumeControl type="master" label="SFX" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200">
                        <h3 className="font-black text-green-800 mb-4 flex items-center gap-2">
                           <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">P1</span>
                           Jogador (Você)
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-green-700 uppercase mb-1 block">Seleção de Equipe</label>
                                <select className="bg-white border-2 border-green-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-green-400 transition-colors" value={config.p1Mode} onChange={e => setConfig({...config, p1Mode: e.target.value as any})}>
                                    <option value="random" className="text-gray-900">Equipe Aleatória</option>
                                    <option value="manual" className="text-gray-900">Manual (Texto)</option>
                                    <option value="builder" className="text-gray-900 font-bold">🛠️ Construtor Avançado</option>
                                    <option value="import" className="text-gray-900 font-bold">📥 Importar Equipe (JSON)</option>
                                </select>
                            </div>
                            
                            {config.p1Mode === 'manual' && (
                                <div>
                                    <input placeholder="pikachu, charizard, lucario..." className="bg-white border-2 border-green-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-green-400 transition-colors" value={config.p1Input} onChange={e => setConfig({...config, p1Input: e.target.value})} />
                                    <p className="text-[10px] text-green-600 mt-1 italic">*Separe os nomes por vírgula</p>
                                </div>
                            )}

                            {config.p1Mode === 'builder' && (
                                <div className="text-center py-2">
                                    <p className="text-sm text-green-700 mb-2 font-bold">Monte seu time detalhadamente!</p>
                                    <button 
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-md w-full"
                                        onClick={() => setActiveBuilderPlayer(1 as 1 | 2)}
                                    >
                                        ABRIR CONSTRUTOR
                                    </button>
                                </div>
                            )}

                            {config.p1Mode === 'import' && (
                                <div className="space-y-2">
                                    <textarea 
                                        placeholder="Cole o JSON do time aqui..." 
                                        className="bg-white border-2 border-green-200 rounded-lg p-2 w-full text-xs text-gray-900 focus:outline-none focus:border-green-400 transition-colors h-24 resize-none"
                                        onChange={(e) => {
                                            const text = e.target.value;
                                            if (text.trim().length > 10) {
                                                try {
                                                    const team = JSON.parse(text);
                                                    if (Array.isArray(team) && team.length > 0) {
                                                        p1CustomTeamRef.current = team;
                                                        setP1ImportStatus(`✅ ${team.length} Pokémon carregados!`);
                                                    } else {
                                                        setP1ImportStatus('❌ Formato JSON inválido.');
                                                    }
                                                } catch (err) {
                                                    setP1ImportStatus('❌ Erro ao ler JSON.');
                                                }
                                            }
                                        }}
                                    />
                                    <input 
                                        type="file" 
                                        accept=".json" 
                                        className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setP1ImportStatus('Carregando...');
                                                try {
                                                    const text = await file.text();
                                                    const team = JSON.parse(text);
                                                    if (Array.isArray(team) && team.length > 0) {
                                                        p1CustomTeamRef.current = team;
                                                        setP1ImportStatus(`✅ ${team.length} Pokémon carregados!`);
                                                    } else {
                                                        setP1ImportStatus('❌ Formato JSON inválido.');
                                                    }
                                                } catch (err) {
                                                    setP1ImportStatus('❌ Erro ao ler arquivo JSON.');
                                                }
                                            }
                                        }}
                                    />
                                    {p1ImportStatus && <p className="text-xs font-bold text-green-700">{p1ImportStatus}</p>}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-green-700 uppercase mb-1 block">Qtd. Pokémon</label>
                                    <select className="bg-white border-2 border-green-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-green-400 transition-colors" value={config.p1TeamSize} onChange={e => setConfig({...config, p1TeamSize: parseInt(e.target.value)})}>
                                        <option value="1" className="text-gray-900">1 Pokémon</option>
                                        <option value="3" className="text-gray-900">3 Pokémon</option>
                                        <option value="6" className="text-gray-900">6 Pokémon</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-green-700 uppercase mb-1 block">Controle</label>
                                    <select className="bg-white border-2 border-green-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-green-400 transition-colors" value={config.p1AutoMode ? 'auto' : 'manual'} onChange={e => setConfig({...config, p1AutoMode: e.target.value === 'auto'})}>
                                        <option value="manual" className="text-gray-900">Manual (P1)</option>
                                        <option value="auto" className="text-gray-900">IA (Computador)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 p-5 rounded-xl border-2 border-red-200">
                        <h3 className="font-black text-red-800 mb-4 flex items-center gap-2">
                           <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">P2</span>
                           Oponente
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-red-700 uppercase mb-1 block">Seleção de Equipe</label>
                                <select className="bg-white border-2 border-red-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-red-400 transition-colors" value={config.p2Mode} onChange={e => setConfig({...config, p2Mode: e.target.value as any})}>
                                    <option value="random" className="text-gray-900">Equipe Aleatória</option>
                                    <option value="manual" className="text-gray-900">Escolher Pokémon (Manual)</option>
                                    <option value="builder" className="text-gray-900 font-bold">🛠️ Construtor Avançado</option>
                                    <option value="import" className="text-gray-900 font-bold">📥 Importar Equipe (JSON)</option>
                                </select>
                            </div>

                            {config.p2Mode === 'manual' && (
                                <div>
                                    <input placeholder="mewtwo, gengar, rayquaza..." className="bg-white border-2 border-red-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-red-400 transition-colors" value={config.p2Input} onChange={e => setConfig({...config, p2Input: e.target.value})} />
                                    <p className="text-[10px] text-red-600 mt-1 italic">*Separe os nomes por vírgula</p>
                                </div>
                            )}

                            {(config.p2Mode as any) === 'builder' && (
                                <div className="text-center py-2">
                                    <p className="text-sm text-red-700 mb-2 font-bold">Customize o time adversário!</p>
                                    <button 
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-md w-full"
                                        onClick={() => setActiveBuilderPlayer(2 as 1 | 2)}
                                    >
                                        ABRIR CONSTRUTOR
                                    </button>
                                </div>
                            )}

                            {config.p2Mode === 'import' && (
                                <div className="space-y-2">
                                    <textarea 
                                        placeholder="Cole o JSON do time aqui..." 
                                        className="bg-white border-2 border-red-200 rounded-lg p-2 w-full text-xs text-gray-900 focus:outline-none focus:border-red-400 transition-colors h-24 resize-none"
                                        onChange={(e) => {
                                            const text = e.target.value;
                                            if (text.trim().length > 10) {
                                                try {
                                                    const team = JSON.parse(text);
                                                    if (Array.isArray(team) && team.length > 0) {
                                                        p2CustomTeamRef.current = team;
                                                        setP2ImportStatus(`✅ ${team.length} Pokémon carregados!`);
                                                    } else {
                                                        setP2ImportStatus('❌ Formato JSON inválido.');
                                                    }
                                                } catch (err) {
                                                    setP2ImportStatus('❌ Erro ao ler JSON.');
                                                }
                                            }
                                        }}
                                    />
                                    <input 
                                        type="file" 
                                        accept=".json" 
                                        className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-red-700 hover:file:bg-red-100"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setP2ImportStatus('Carregando...');
                                                try {
                                                    const text = await file.text();
                                                    const team = JSON.parse(text);
                                                    if (Array.isArray(team) && team.length > 0) {
                                                        p2CustomTeamRef.current = team;
                                                        setP2ImportStatus(`✅ ${team.length} Pokémon carregados!`);
                                                    } else {
                                                        setP2ImportStatus('❌ Formato JSON inválido.');
                                                    }
                                                } catch (err) {
                                                    setP2ImportStatus('❌ Erro ao ler arquivo JSON.');
                                                }
                                            }
                                        }}
                                    />
                                    {p2ImportStatus && <p className="text-xs font-bold text-red-700">{p2ImportStatus}</p>}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-red-700 uppercase mb-1 block">Qtd. Pokémon</label>
                                    <select className="bg-white border-2 border-red-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-red-400 transition-colors" value={config.p2TeamSize} onChange={e => setConfig({...config, p2TeamSize: parseInt(e.target.value)})}>
                                        <option value="1" className="text-gray-900">1 Pokémon</option>
                                        <option value="3" className="text-gray-900">3 Pokémon</option>
                                        <option value="6" className="text-gray-900">6 Pokémon</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-red-700 uppercase mb-1 block">Controle</label>
                                    <select className="bg-white border-2 border-red-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-red-400 transition-colors" value={config.opponentMode} onChange={e => setConfig({...config, opponentMode: e.target.value as any})}>
                                        <option value="auto" className="text-gray-900">IA (Computador)</option>
                                        <option value="manual" className="text-gray-900">Manual (P2)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                    <h4 className="text-center text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Configurações de Mecânicas</h4>
                    <div className="flex flex-wrap justify-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={config.moveLimitEnabled} onChange={e => setConfig({...config, moveLimitEnabled: e.target.checked})} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">Limitar Usos (PP)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 accent-orange-600" checked={config.weatherEnabled} onChange={e => setConfig({...config, weatherEnabled: e.target.checked})} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-orange-600 transition-colors">Mecânicas de Clima</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 accent-green-600" checked={config.terrainEnabled} onChange={e => setConfig({...config, terrainEnabled: e.target.checked})} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-green-600 transition-colors">Mecânicas de Terreno</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={config.itemsEnabled} onChange={e => setConfig({...config, itemsEnabled: e.target.checked})} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Mochila de Itens</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 accent-purple-600" checked={config.terastallizationEnabled} onChange={e => setConfig({...config, terastallizationEnabled: e.target.checked})} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-purple-600 transition-colors">Terastalização</span>
                        </label>
                         {/* Novo Checkbox para Mega Evolução */}
                         <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 accent-pink-600" checked={config.megaEvolutionEnabled} onChange={e => setConfig({...config, megaEvolutionEnabled: e.target.checked})} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-pink-600 transition-colors">Mega Evolução</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 accent-pink-600" checked={config.randomIvs} onChange={e => setConfig({...config, randomIvs: e.target.checked})} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-pink-600 transition-colors">IVs Aleatórios</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 accent-teal-600" checked={config.randomLevels} onChange={e => setConfig({...config, randomLevels: e.target.checked})} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-teal-600 transition-colors">Níveis Aleatórios</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 accent-yellow-500" checked={config.useLLM} onChange={e => setConfig({...config, useLLM: e.target.checked})} />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-yellow-500 transition-colors">Ativar IA Real (LLM)</span>
                        </label>
                    </div>
                </div>

                {config.useLLM && (
                    <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200 space-y-3">
                        <h4 className="text-xs font-black text-yellow-800 uppercase tracking-widest flex items-center gap-2">
                            🤖 CONFIGURAÇÃO DA IA REAL (GRÁTIS / PERSONALIZADA)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-yellow-700 uppercase mb-1 block">Provedor de IA</label>
                                <select 
                                    className="bg-white border-2 border-yellow-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-yellow-400 transition-colors" 
                                    value={config.llmProvider || 'gemini'} 
                                    onChange={e => {
                                        const val = e.target.value as any;
                                        setConfig({
                                            ...config, 
                                            llmProvider: val,
                                            llmModel: val === 'gemini' ? 'gemini-2.5-flash' : val === 'openrouter' ? 'google/gemini-2.5-flash:free' : 'deepseek-chat'
                                        });
                                    }}
                                >
                                    <option value="gemini" className="text-gray-900">Google Gemini (Nativo - 100% Grátis)</option>
                                    <option value="openrouter" className="text-gray-900">OpenRouter (Modelos Gratuitos e Personalizados)</option>
                                    <option value="deepseek" className="text-gray-900">DeepSeek Oficial (Requer chave direta)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-yellow-700 uppercase mb-1 block">Modelo de IA</label>
                                {config.llmProvider === 'openrouter' ? (
                                    <div className="space-y-2">
                                        <select 
                                            className="bg-white border-2 border-yellow-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-yellow-400 transition-colors" 
                                            value={config.llmModel || 'google/gemini-2.5-flash:free'} 
                                            onChange={e => setConfig({...config, llmModel: e.target.value})}
                                        >
                                            {loadingModels ? (
                                                <option className="text-gray-500">Carregando modelos do OpenRouter...</option>
                                            ) : (
                                                <>
                                                    {openRouterModels.length > 0 ? (
                                                        openRouterModels.map(model => (
                                                            <option key={model.id} value={model.id} className="text-gray-900">
                                                                {model.name} {model.isFree ? ' (Grátis)' : ''}
                                                            </option>
                                                        ))
                                                    ) : (
                                                        <>
                                                            <option value="google/gemini-2.5-flash:free" className="text-gray-900">Google: Gemini 2.5 Flash (Grátis)</option>
                                                            <option value="mistralai/mistral-7b-instruct:free" className="text-gray-900">Mistral: Mistral 7B (Grátis)</option>
                                                            <option value="deepseek/deepseek-chat" className="text-gray-900">DeepSeek V3 (Pago - Ultra Inteligente)</option>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </select>
                                        
                                        {/* Permite digitar o slug personalizado se escolher custom ou se desejar ajustar diretamente */}
                                        <div className="mt-1">
                                            <input 
                                                type="text" 
                                                className="bg-white border-2 border-yellow-200 rounded-lg p-2 w-full text-xs text-gray-900 focus:outline-none focus:border-yellow-400 transition-colors"
                                                placeholder="Ou digite o slug do modelo (ex: google/gemini-2.5-flash:free)"
                                                value={config.llmModel || ''}
                                                onChange={e => setConfig({...config, llmModel: e.target.value})}
                                            />
                                            <span className="text-[10px] text-yellow-800">Você pode selecionar ou digitar qualquer ID de modelo do OpenRouter diretamente acima!</span>
                                        </div>
                                    </div>
                                ) : config.llmProvider === 'deepseek' ? (
                                    <select 
                                        className="bg-white border-2 border-yellow-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-yellow-400 transition-colors" 
                                        value={config.llmModel || 'deepseek-chat'} 
                                        onChange={e => setConfig({...config, llmModel: e.target.value})}
                                    >
                                        <option value="deepseek-chat" className="text-gray-900">DeepSeek-V3 (deepseek-chat)</option>
                                        <option value="deepseek-reasoner" className="text-gray-900">DeepSeek-R1 (deepseek-reasoner)</option>
                                    </select>
                                ) : (
                                    <select 
                                        className="bg-white border-2 border-yellow-200 rounded-lg p-2 w-full text-sm text-gray-900 focus:outline-none focus:border-yellow-400 transition-colors" 
                                        value={config.llmModel || 'gemini-2.5-flash'} 
                                        onChange={e => setConfig({...config, llmModel: e.target.value})}
                                    >
                                        <option value="gemini-2.5-flash" className="text-gray-900">Gemini 2.5 Flash (Super Rápido)</option>
                                        <option value="gemini-2.5-pro" className="text-gray-900">Gemini 2.5 Pro (Raciocínio Avançado)</option>
                                    </select>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-yellow-800 bg-yellow-100 p-2 rounded border border-yellow-200 leading-relaxed">
                            💡 {config.llmProvider === 'openrouter' ? (
                                "O OpenRouter disponibiliza modelos excelentes de graça (como o Gemini 2.5 Flash)! Se preferir usar modelos pagos ou se o limite gratuito exceder, adicione 'OPENROUTER_API_KEY' na aba Configurações (Settings)."
                            ) : config.llmProvider === 'deepseek' ? (
                                "Adicione sua chave 'DEEPSEEK_API_KEY' na aba Configurações (Settings) para autenticação."
                            ) : (
                                "O Gemini é totalmente nativo e gratuito, não necessitando de nenhuma configuração extra por sua parte!"
                            )}
                        </p>
                    </div>
                )}

                <button className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-xl transform transition hover:-translate-y-1 active:scale-95 ${isLoading ? 'opacity-75 cursor-wait' : ''}`} onClick={handleStartClick} disabled={isLoading}>
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                           <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                           PREPARANDO BATALHA...
                        </span>
                    ) : "INICIAR BATALHA"}
                </button>

                <button 
                    className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors"
                    onClick={() => setShowReplayPlayer(true)}
                >
                    🎥 Assistir Replay
                </button>
            </div>
        ) : (
            <>
                <BattleHeader 
                    turn={state.turn} 
                    weather={state.weather} 
                    weatherTurns={state.weatherTurns}
                    terrain={state.terrain} 
                    terrainTurns={state.terrainTurns}
                    trickRoom={state.trickRoomActive} 
                    trickRoomTurns={state.trickRoomTurns}
                    gravity={state.gravity}
                    gravityTurns={state.gravityTurns}
                    wonderRoom={state.wonderRoomActive}
                    wonderRoomTurns={state.wonderRoomTurns}
                    magicRoom={state.magicRoomActive}
                    magicRoomTurns={state.magicRoomTurns}
                    p1Hazards={state.p1Hazards} 
                    p2Hazards={state.p2Hazards} 
                    isDark={isDark}
                    onToggleDark={toggleDark}
                />
                
                <div 
                    className="p-6 rounded-xl shadow-2xl border-2 border-indigo-200 relative transition-all duration-1000"
                    style={{
                        background: `linear-gradient(to bottom, 
                            color-mix(in srgb, ${isDark ? (WEATHER_BG_COLORS_DARK[state.weather] ?? '#0f172a') : (WEATHER_BG_COLORS[state.weather] || '#f3f4f6')}, black 15%) 0%, 
                            ${isDark ? (WEATHER_BG_COLORS_DARK[state.weather] ?? '#0f172a') : (WEATHER_BG_COLORS[state.weather] || '#f3f4f6')} 30%, 
                            ${isDark ? (TERRAIN_BG_COLORS_DARK[state.terrain] ?? '#0f172a') : (TERRAIN_BG_COLORS[state.terrain] || '#f3f4f6')} 70%, 
                            color-mix(in srgb, ${isDark ? (TERRAIN_BG_COLORS_DARK[state.terrain] ?? '#0f172a') : (TERRAIN_BG_COLORS[state.terrain] || '#f3f4f6')}, black 15%) 100%)`
                    }}
                >
                    {state.winner ? (
                        <>
                            {state.winner === 'draw' ? (
                                <div className="flex flex-col items-center justify-center py-12 min-h-[300px]">
                                    <h2 className="text-4xl font-black text-gray-600 mb-8 uppercase tracking-tighter">Batalha Empatada!</h2>
                                    <div className="text-7xl">🤝</div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 min-h-[300px] animate-fade-in">
                                    <h2 className={`text-4xl font-black mb-10 tracking-tighter uppercase drop-shadow-sm ${state.winner === 1 ? 'text-green-700' : 'text-red-700'}`}>
                                        Equipe Vencedora
                                    </h2>
                                    <div className={`grid gap-8 justify-items-center w-full px-4 ${
                                        (state.winner === 1 ? state.team1 : state.team2).length <= 1 
                                            ? 'grid-cols-1' 
                                            : (state.winner === 1 ? state.team1 : state.team2).length <= 3 
                                                ? 'grid-cols-3' 
                                                : 'grid-cols-3 md:grid-cols-6'
                                    }`}>
                                        {(state.winner === 1 ? state.team1 : state.team2).map((p) => {
                                            if (!p) return null;
                                            return (
                                            <div key={p?.id} className="flex flex-col items-center gap-3 transition-transform hover:scale-110">
                                                <div className={`relative w-24 h-24 sm:w-28 sm:h-28 bg-white/60 rounded-full border-4 shadow-xl flex items-center justify-center overflow-hidden transition-all duration-700 ${state.winner === 1 ? 'border-green-400' : 'border-red-400'} ${p?.isFainted ? 'grayscale opacity-40 scale-90 border-gray-400' : 'animate-pulse scale-105'}`}>
                                                    <img src={p?.spriteUrl} alt={p?.name ?? 'Pokémon'} className="w-full h-full object-contain p-2" onError={(e) => { if (p?.fallbackUrls?.[0]) e.currentTarget.src = p.fallbackUrls[0]; }} />
                                                    {!p?.isFainted && (
                                                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
                                                    )}
                                                </div>
                                                <span className={`font-black text-sm uppercase tracking-wider text-center drop-shadow-sm ${p?.isFainted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {p?.name ?? 'Pokémon'}
                                                </span>
                                            </div>
                                        )})}
                                    </div>
                                    {currentReplay && (
                                        <button 
                                            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors"
                                            onClick={() => {
                                                const json = JSON.stringify(currentReplay, null, 2);
                                                const blob = new Blob([json], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `replay_${new Date().getTime()}.json`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                        >
                                            📥 Exportar Replay (JSON)
                                        </button>
                                    )}
                                </div>
                            )}
                            <BattleSummaryScreen state={state} />
                        </>
                    ) : (
                        // MUDANÇA AQUI: Layout centralizado e Condicional de Maximização
                        <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-3 min-h-[300px] w-full">
                            {!isSceneMaximized && (
                                <PokemonCard 
                                    pokemon={state.currentPokemon1} 
                                    isPlayer={true} 
                                    weather={state.weather} 
                                    terrain={state.terrain} 
                                    team={state.team1} 
                                    showTeraType={config.terastallizationEnabled} 
                                    animationType={animationState?.id === state.currentPokemon1?.id ? animationState.type : null}
                                    sideHazards={state.p1Hazards} 
                                    opponentAbility={state.currentPokemon2?.ability}
                                />
                            )}
                            
                            {/* --- CENA DE BATALHA HÍBRIDA --- */}
                            <BattleScene 
                                p1={state.currentPokemon1}
                                p2={state.currentPokemon2}
                                weather={state.weather}
                                terrain={state.terrain}
                                animationState={animationState}
                                isMaximized={isSceneMaximized}
                                onToggleMaximize={() => setIsSceneMaximized(!isSceneMaximized)}
                                team1={state.team1}
                                team2={state.team2}
                                p1Hazards={state.p1Hazards}
                                p2Hazards={state.p2Hazards}
                            />

                            {!isSceneMaximized && (
                                <PokemonCard 
                                    pokemon={state.currentPokemon2} 
                                    isPlayer={false} 
                                    weather={state.weather} 
                                    terrain={state.terrain} 
                                    team={state.team2} 
                                    showTeraType={config.terastallizationEnabled}
                                    animationType={animationState?.id === state.currentPokemon2?.id ? animationState.type : null}
                                    sideHazards={state.p2Hazards} 
                                    opponentAbility={state.currentPokemon1?.ability}
                                />
                            )}
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-200 relative">
                        {!state.winner && state.isBattleInProgress && (
                            <div className="absolute right-0 top-6 flex flex-row items-center gap-3 z-20">
                                <button 
                                    onClick={() => handleExportTeam(currentPlayer)} 
                                    className="w-12 h-12 rounded-full shadow-xl flex items-center justify-center border-2 bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200 transition-all" 
                                    title="Salvar Time (JSON)"
                                >
                                    <span className="text-lg">💾</span>
                                </button>
                                
                                {config.itemsEnabled && (
                                    (currentPlayer === 1 && !config.p1AutoMode) || (currentPlayer === 2 && config.opponentMode === 'manual')
                                ) && (
                                    <BagButton onClick={() => setShowBagModal(true)} disabled={state.waitingForAction || (currentPlayer === 1 ? !!p1Action : !!p2Action)} />
                                )}
                                
                                <button onClick={() => setConfig(prev => ({ ...prev, p1AutoMode: !prev.p1AutoMode }))} className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center border-2 transition-all ${config.p1AutoMode ? 'bg-indigo-600 text-white border-indigo-300 ai-active-pulse' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'}`} title="Alternar IA P1">
                                    <span className="text-[10px] font-black leading-tight text-center">IA<br/>P1</span>
                                </button>
                                <button onClick={() => setConfig(prev => ({ ...prev, opponentMode: prev.opponentMode === 'auto' ? 'manual' : 'auto' }))} className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center border-2 transition-all ${config.opponentMode === 'auto' ? 'bg-red-600 text-white border-red-300 ai-active-pulse' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'}`} title="Alternar IA P2">
                                    <span className="text-[10px] font-black leading-tight text-center">IA<br/>P2</span>
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {state.winner ? (
                                <div className="flex justify-center py-4">
                                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-12 rounded-xl shadow-2xl transform transition hover:-translate-y-1 active:scale-95" onClick={resetBattle}>Nova Batalha</button>
                                </div>
                            ) : (
                                <>
                                    {state.waitingForAction ? (
                                        <div className="text-center py-10"><p className="text-indigo-600 font-bold">Processando combate...</p></div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center mb-2 px-2 flex-wrap gap-2">
                                                <div className="flex items-center gap-3">
                                                    <p className={`text-lg font-bold ${currentPlayer === 1 ? 'text-green-700' : 'text-red-700'}`}>
                                                        {currentPlayer === 1 ? 'Sua Vez (P1)' : "Turno do Oponente (P2)"}
                                                    </p>
                                                    
                                                    {/* Botão de Terastalização */}
                                                    {config.terastallizationEnabled && (
                                                        (currentPlayer === 1 && !config.p1AutoMode && !state.p1TeraUsed) ||
                                                        (currentPlayer === 2 && config.opponentMode === 'manual' && !state.p2TeraUsed)
                                                    ) && currentActive && !currentActive.isTerastallized && !currentActive.isFainted && !currentActive.isMega && (
                                                        <button 
                                                            className={`px-4 py-1 rounded-full font-black text-xs uppercase tracking-wider border-2 transition-all shadow-md flex items-center gap-1 ${
                                                                isTeraToggled
                                                                    ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white border-white scale-105'
                                                                    : `type-${currentActive?.teraType || 'normal'} text-white border-white/50 hover:brightness-110`
                                                            }`}
                                                            onClick={() => {
                                                                if (isMegaToggled) setIsMegaToggled(false); // Mutually exclusive
                                                                setIsTeraToggled(!isTeraToggled);
                                                            }}
                                                            title={`Terastalizar para o tipo ${currentActive?.teraType || 'Normal'}`}
                                                        >
                                                            <span className="text-lg">💎</span> {isTeraToggled ? 'TERASTAL ATIVO' : 'TERASTALIZAR'}
                                                        </button>
                                                    )}

                                                    {/* Botão de Mega Evolução - SÍNCRONO: Checa Item + Config, não MegaProfile carregado */}
                                                    {config.megaEvolutionEnabled && (
                                                        (currentPlayer === 1 && !config.p1AutoMode && !state.p1MegaUsed) ||
                                                        (currentPlayer === 2 && config.opponentMode === 'manual' && !state.p2MegaUsed)
                                                    ) && currentActive && currentActive.heldItem && MEGA_STONES[currentActive.heldItem] && !currentActive.isMega && !currentActive.isFainted && !currentActive.isTerastallized && (
                                                        <button 
                                                            className={`px-4 py-1 rounded-full font-black text-xs uppercase tracking-wider border-2 transition-all shadow-md flex items-center gap-1 ${
                                                                isMegaToggled
                                                                    ? 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white border-white scale-105'
                                                                    : `bg-gray-700 text-white border-white/50 hover:bg-gray-600`
                                                            }`}
                                                            onClick={() => {
                                                                if (isTeraToggled) setIsTeraToggled(false); // Mutually exclusive
                                                                setIsMegaToggled(!isMegaToggled);
                                                            }}
                                                            title="Mega Evoluir"
                                                        >
                                                            <span className="text-lg">🧬</span> {isMegaToggled ? 'MEGA ATIVO' : 'MEGA EVOLUIR'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {currentActive?.isFainted ? (
                                                <div className="flex flex-col items-center py-6 text-center">
                                                    <p className="text-red-600 font-black text-xl mb-2">Pokémon Desmaiado!</p>
                                                    {(currentPlayer === 1 && config.p1AutoMode) || (currentPlayer === 2 && config.opponentMode === 'auto') ? (
                                                        <p className="text-indigo-600 font-bold animate-pulse italic">A IA está escolhendo um substituto...</p>
                                                    ) : (
                                                        <button className="font-bold py-3 px-8 rounded-lg shadow-md bg-yellow-500 text-white" onClick={() => setShowSwitchModal({player: currentPlayer, canCancel: false})}>
                                                            Escolher Substituto
                                                        </button>
                                                    )}
                                                </div>
                                            ) : currentActive?.mustRecharge ? (
                                                <button className="bg-gray-600 text-white font-bold py-4 rounded-lg w-auto mx-auto block px-12 shadow-lg" onClick={() => handlePlayerAction(currentPlayer, 'move', { name: 'recharge', displayName: 'Recarregar', priority: 0 })}>
                                                    {`O ${currentActive?.name ?? 'Pokémon'} precisa descansar. (Clique aqui!)`}
                                                </button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                                                        {currentActive?.moves?.map((move, i) => {
                                                            if (!move) return null;
                                                            return (
                                                            <MoveButton 
                                                              key={i} 
                                                              move={move} 
                                                              user={currentActive!} 
                                                              target={currentTarget} 
                                                              weather={state.weather} 
                                                              terrain={state.terrain}
                                                              gravity={state.gravity}
                                                              onSelect={() => handlePlayerAction(currentPlayer, 'move', move)} 
                                                              disabled={(config.moveLimitEnabled && move.uses <= 0) || (currentPlayer === 1 && config.p1AutoMode) || (currentPlayer === 2 && config.opponentMode === 'auto')} 
                                                              showUses={config.moveLimitEnabled} 
                                                              isAiSelected={currentPlayer === 1 && p1AiSelectedMove === move.name} 
                                                              isTeraToggled={isTeraToggled}
                                                            />
                                                        )})}
                                                    </div>
                                                    <div className="flex justify-center gap-2">
                                                        <button className={`font-bold py-2 px-6 rounded-lg shadow-md ${isCurrentTrapped || (currentPlayer === 1 && config.p1AutoMode) || (currentPlayer === 2 && config.opponentMode === 'auto') ? 'bg-red-500 text-white opacity-50 cursor-not-allowed' : 'bg-yellow-500 text-white'}`} onClick={() => !isCurrentTrapped && setShowSwitchModal({player: currentPlayer, canCancel: true})}>
                                                            {isCurrentTrapped ? 'PRESO' : 'Trocar Pokémon'}
                                                        </button>
                                                        <button 
                                                            className="bg-red-600 hover:bg-red-700 text-white font-black py-2 px-6 rounded-lg shadow-lg transform transition active:scale-95 flex items-center gap-2"
                                                            onClick={handleRunAway}
                                                        >
                                                            🏃‍♂️ FUGIR
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        <BattleLogs logs={state.logs} containerRef={logContainerRef} state={state} />
                    </div>
                </div>
            </>
        )}
      </div>

      {showSwitchModal && (
        <SwitchModal player={showSwitchModal.player} team={showSwitchModal.player === 1 ? state.team1 : state.team2} currentActive={showSwitchModal.player === 1 ? state.currentPokemon1 : state.currentPokemon2} opponent={showSwitchModal.player === 1 ? state.currentPokemon2 : state.currentPokemon1} weather={state.weather} aiHighlightId={aiHighlightingMember} onSelect={(p) => setShowDetailsModal({pokemon: p, player: showSwitchModal.player})} onCancel={() => setShowSwitchModal(null)} canCancel={showSwitchModal.canCancel} />
      )}

      {showDetailsModal && (
        <DetailsModal pokemon={showDetailsModal.pokemon} opponent={showDetailsModal.player === 1 ? state.currentPokemon2 : state.currentPokemon1} onBack={() => setShowDetailsModal(null)} onSelect={(p) => {
            if (!showDetailsModal) return;
            const playerNum = showDetailsModal.player as 1 | 2;
            
            if ((playerNum === 1 && state.currentPokemon1?.isFainted) || (playerNum === 2 && state.currentPokemon2?.isFainted)) {
                recordAction(playerNum as 1 | 2, 'switch', p, undefined, undefined, true, false);
                const res = BattleEngine.performSwitch(stateRef.current, p, playerNum as 1 | 2, configRef.current.weatherEnabled);
                updateStateWithLogs(res.newState, res.logs);
                checkFaintedSwitch(res.newState);
            } else if (showSwitchModal && !showSwitchModal.canCancel) {
                recordAction(playerNum as 1 | 2, 'switch', p, undefined, undefined, true, false);
                const res = BattleEngine.performSwitch(stateRef.current, p, playerNum as 1 | 2, configRef.current.weatherEnabled);
                const unlockedState = { ...res.newState, waitingForAction: false };
                updateStateWithLogs(unlockedState, res.logs);
                checkFaintedSwitch(unlockedState);
            } else {
                if (showSwitchModal && showSwitchModal.isBatonPass) {
                    recordAction(playerNum as 1 | 2, 'switch', p, undefined, undefined, false, true);
                    const res = BattleEngine.performSwitch(stateRef.current, p, playerNum as 1 | 2, configRef.current.weatherEnabled, true);
                    updateStateWithLogs(res.newState, res.logs);
                } else {
                    handlePlayerAction(playerNum as 1 | 2, 'switch', p);
                }
            }
            setShowDetailsModal(null); setShowSwitchModal(null);
        }} />
      )}

      {showBagModal && (
          <BagModal 
            inventory={currentPlayer === 1 ? state.p1Inventory : state.p2Inventory} 
            team={currentPlayer === 1 ? state.team1 : state.team2}
            currentActiveId={currentPlayer === 1 ? state.currentPokemon1?.id : state.currentPokemon2?.id} 
            aiSelection={p1AiBagSelection || undefined}
            onUseItem={(itemId, targetId, moveName) => handleBagAction('use', itemId, targetId)}
            onGiveItem={(itemId, targetId) => handleBagAction('give', itemId, targetId)}
            onCancel={() => {
                if (!p1AiBagSelection) setShowBagModal(false);
            }} 
          />
      )}

      {activeBuilderPlayer !== null && (
          <TeamBuilderModal 
            playerNum={(activeBuilderPlayer === 1 ? 1 : 2) as 1 | 2}
            initialTeam={activeBuilderPlayer === 1 ? p1CustomTeamRef.current : p2CustomTeamRef.current}
            teamSize={activeBuilderPlayer === 1 ? config.p1TeamSize : config.p2TeamSize}
            onSave={handleBuilderSave}
            onCancel={() => setActiveBuilderPlayer(null)}
            randomLevels={config.randomLevels}
          />
      )}

      {showReplayPlayer && (
          <ReplayPlayer onClose={() => setShowReplayPlayer(false)} />
      )}
    </div>
  );
}
