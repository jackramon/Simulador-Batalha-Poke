
import React, { useState, useEffect } from 'react';
import { PlayerInventory, BagItem, Pokemon } from '../types';
import { ITEMS_DATA } from '../data/items';

interface BagModalProps {
  inventory: PlayerInventory;
  team: Pokemon[];
  currentActiveId?: number; 
  aiSelection?: { itemId: string, targetId: number, isGive: boolean, moveName?: string }; // Adicionado moveName
  onUseItem: (itemId: string, targetId: number, moveName?: string) => void;
  onGiveItem: (itemId: string, targetId: number) => void;
  onCancel: () => void;
}

type BagCategory = 'medicine' | 'battle-item' | 'berry' | 'held';
type BagView = 'list' | 'details' | 'target' | 'moves';

export const BagModal: React.FC<BagModalProps> = ({ inventory, team, currentActiveId, aiSelection, onUseItem, onGiveItem, onCancel }) => {
  const [activeCategory, setActiveCategory] = useState<BagCategory>('medicine');
  const [selectedItem, setSelectedItem] = useState<BagItem | null>(null);
  const [selectedTargetPokemon, setSelectedTargetPokemon] = useState<Pokemon | null>(null); // Novo estado
  const [view, setView] = useState<BagView>('list');
  const [actionType, setActionType] = useState<'use' | 'give'>('use');

  // Efeito para sincronizar o estado visual com a escolha da IA
  useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;

      if (aiSelection) {
          const itemData = ITEMS_DATA[aiSelection.itemId];
          if (itemData) {
              // 1. Navega para a categoria correta
              let category: BagCategory = 'medicine';
              if (itemData.category === 'medicine') category = 'medicine';
              else if (itemData.category === 'battle-item') category = 'battle-item';
              else if (itemData.category === 'berry') category = 'berry';
              else category = 'held';
              
              setActiveCategory(category);

              // 2. Seleciona o item na lista
              const item = inventory.items.find(i => i.id === aiSelection.itemId);
              if (item) setSelectedItem(item);

              // 3. Define o tipo de ação e alvo
              setActionType(aiSelection.isGive ? 'give' : 'use');
              const targetP = team.find(p => p.id === aiSelection.targetId);
              if (targetP) setSelectedTargetPokemon(targetP);

              // 4. Fluxo Visual: Detalhes -> Alvo -> (Movimentos)
              setView('details'); 
              
              const needsMoveSelect = (itemData as any).targetType === 'move' && !aiSelection.isGive;

              // Sequência de animação da IA
              timer = setTimeout(() => {
                  setView('target');
                  
                  if (needsMoveSelect) {
                      setTimeout(() => {
                          setView('moves');
                      }, 1500);
                  }
              }, 1500);
          }
      }
      return () => {
          if (timer) clearTimeout(timer);
      };
  }, [aiSelection, inventory.items, team]);

  // Filtragem de itens por categoria
  const filteredItems = inventory.items.filter(item => {
    const data = ITEMS_DATA[item.id];
    if (!data) return false;
    
    if (activeCategory === 'medicine') return data.category === 'medicine';
    if (activeCategory === 'battle-item') return data.category === 'battle-item';
    if (activeCategory === 'berry') return data.category === 'berry';
    if (activeCategory === 'held') return ['held', 'plate', 'memory'].includes(data.category);
    
    return false;
  }).sort((a, b) => (ITEMS_DATA[a.id]?.name || a.id).localeCompare(ITEMS_DATA[b.id]?.name || b.id));

  const handleItemClick = (item: BagItem) => {
    if (aiSelection) return; 
    setSelectedItem(item);
    setView('details');
  };

  const handleActionClick = (type: 'use' | 'give') => {
    if (aiSelection) return;
    setActionType(type);
    setView('target');
  };

  const handleTargetSelect = (pokemon: Pokemon) => {
    if (aiSelection) return;
    if (!selectedItem) return;

    if (actionType === 'use') {
      const data = ITEMS_DATA[selectedItem.id];
      
      // Lógica de Validação Geral
      if (data.category === 'medicine') {
          if (selectedItem.id.includes('revive')) {
              if (!pokemon.isFainted) return; 
          } else {
              if (pokemon.isFainted) return; 
              if (selectedItem.id.includes('potion') || selectedItem.id === 'full-restore') {
                  if (pokemon.hp === pokemon.maxHP) return; 
              }
          }
      }

      // Se o item requer seleção de movimento (Ether, Leppa Berry), vai para a tela de moves
      if ((data as any).targetType === 'move') {
          setSelectedTargetPokemon(pokemon);
          setView('moves');
          return;
      }

      onUseItem(selectedItem.id, pokemon.id);
    } else {
      // Dar item
      if (pokemon.isFainted) return; 
      onGiveItem(selectedItem.id, pokemon.id);
    }
  };

  const handleMoveSelect = (moveName: string) => {
      if (aiSelection) return;
      if (!selectedItem || !selectedTargetPokemon) return;
      
      // Validação de PP
      const move = selectedTargetPokemon?.moves?.find(m => m?.name === moveName);
      if (move && move.uses >= move.maxUses) return; // PP Cheio

      onUseItem(selectedItem.id, selectedTargetPokemon.id, moveName);
  };

  const renderTabs = () => (
    <div className="flex justify-around mb-4 border-b pb-2">
      {(['medicine', 'battle-item', 'berry', 'held'] as BagCategory[]).map(cat => (
        <button
          key={cat}
          className={`px-3 py-1 font-bold rounded-t-lg transition-colors text-sm sm:text-base ${activeCategory === cat ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          onClick={() => { 
              if (aiSelection) return;
              setActiveCategory(cat); setView('list'); setSelectedItem(null); setSelectedTargetPokemon(null);
          }}
        >
          {cat === 'medicine' ? 'Remédios' : cat === 'battle-item' ? 'Batalha' : cat === 'berry' ? 'Frutas' : 'Itens'}
        </button>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Nenhum item nesta categoria.</p>
      ) : (
        filteredItems.map(item => {
            const isAiSelected = aiSelection?.itemId === item.id;
            return (
              <div 
                key={item.id} 
                className={`flex justify-between items-center p-3 border rounded-lg transition-colors group ${isAiSelected ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-400' : 'hover:bg-indigo-50 cursor-pointer'}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden border border-gray-200 group-hover:border-indigo-300">
                        <span className="text-xs font-bold text-gray-400 absolute">{ITEMS_DATA[item.id]?.name.charAt(0)}</span>
                        <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.id}.png`}
                            alt={ITEMS_DATA[item.id]?.name}
                            className="w-full h-full object-contain relative z-10 transition-transform group-hover:scale-110"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                    <span className="font-bold text-gray-800">{ITEMS_DATA[item.id]?.name || item.id}</span>
                </div>
                <span className="font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded text-sm">x{item.quantity}</span>
              </div>
            );
        })
      )}
    </div>
  );

  const renderDetails = () => {
    if (!selectedItem) return null;
    const data = ITEMS_DATA[selectedItem.id];
    const canBeUsed = data.category === 'medicine' || data.category === 'battle-item' || (data.category === 'berry' && (data as any).targetType === 'move'); // Berries agora podem ser usadas (Leppa)
    
    return (
      <div className="flex flex-col h-full justify-between">
        <div>
            <div className="flex items-center gap-4 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                     <span className="text-2xl font-bold text-gray-300 absolute">{data.name.charAt(0)}</span>
                     <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${selectedItem.id}.png`}
                        alt={data.name}
                        className="w-full h-full object-contain relative z-10"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                     />
                </div>
                <div>
                    <h3 className="text-xl font-black text-indigo-800 leading-tight">
                        {data.name} 
                    </h3>
                    <div className="mt-1">
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                            Quantidade: x{selectedItem.quantity}
                        </span>
                    </div>
                </div>
            </div>

            <p className="text-gray-700 italic mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm border-l-4 border-l-yellow-400">
                "{data.desc}"
            </p>
        </div>
        
        <div className="flex flex-col gap-3">
            {canBeUsed && (
                <button 
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    onClick={() => handleActionClick('use')}
                    disabled={!!aiSelection}
                >
                    <span>💊</span> USAR
                </button>
            )}
            <button 
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={() => handleActionClick('give')}
                disabled={!!aiSelection}
            >
                <span>🎁</span> DAR AO POKÉMON
            </button>
            <button 
                className="w-full bg-gray-500 text-white font-bold py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                onClick={() => setView('list')}
                disabled={!!aiSelection}
            >
                VOLTAR
            </button>
        </div>
      </div>
    );
  };

  const renderTargetSelection = () => (
    <div className="flex flex-col h-full">
        <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
            {actionType === 'use' ? 'Usar em quem?' : 'Dar para quem?'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto mb-4">
            {team.map(p => {
                const data = selectedItem ? ITEMS_DATA[selectedItem.id] : null;
                let disabled = false;
                let reason = "";

                if (actionType === 'use' && data?.category === 'medicine') {
                    if (selectedItem?.id.includes('revive')) {
                        if (!p.isFainted) { disabled = true; reason = "Vivo"; }
                    } else {
                        if (p.isFainted) { disabled = true; reason = "Desmaiado"; }
                        else if ((selectedItem?.id.includes('potion') || selectedItem?.id === 'full-restore') && p.hp === p.maxHP) { 
                            disabled = true; reason = "Cheio"; 
                        }
                    }
                }
                
                if (actionType === 'give' && p.isFainted) {
                    disabled = true; reason = "Desmaiado";
                }

                const isAiTarget = aiSelection?.targetId === p?.id;
                const isActive = p?.id === currentActiveId;
                const highlightClass = isAiTarget 
                    ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400 scale-[1.02]' 
                    : 'border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400';

                return (
                    <div 
                        key={p?.id} 
                        className={`border-2 rounded-lg p-2 flex items-center gap-2 transition-all ${disabled ? 'opacity-50 border-gray-200 cursor-not-allowed bg-gray-100' : `cursor-pointer ${highlightClass}`}`}
                        onClick={() => !disabled && handleTargetSelect(p)}
                    >
                        <div className="relative">
                            <img src={p?.spriteUrl} className="w-10 h-10" alt={p?.name ?? 'Pokémon'} />
                            {isActive && (
                                <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm z-10 border border-white">
                                    Ativo
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-800 truncate">{p?.name ?? 'Pokémon'}</div>
                            <div className="text-xs text-gray-600">PV: {p?.hp ?? 0}/{p?.maxHP ?? 0}</div>
                            {p?.heldItem && <div className="text-[10px] text-amber-600 truncate">Item: {ITEMS_DATA[p.heldItem]?.name}</div>}
                        </div>
                        {reason && <span className="text-[10px] font-bold text-red-500 bg-white px-1 border rounded whitespace-nowrap flex-shrink-0">{reason}</span>}
                        {isAiTarget && <span className="text-[10px] font-black text-yellow-600 bg-yellow-200 px-2 py-1 rounded animate-pulse whitespace-nowrap flex-shrink-0">ALVO</span>}
                    </div>
                );
            })}
        </div>
        <button 
            className="mt-auto w-full bg-gray-500 text-white font-bold py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
            onClick={() => setView('details')}
            disabled={!!aiSelection}
        >
            VOLTAR
        </button>
    </div>
  );

  const renderMoveSelection = () => {
      if (!selectedTargetPokemon) return null;

      return (
        <div className="flex flex-col h-full">
            <h3 className="text-lg font-bold text-center mb-4 text-gray-800">
                Restaurar PP de qual golpe?
            </h3>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto mb-4">
                {selectedTargetPokemon?.moves?.map((move) => {
                    if (!move) return null;
                    const isAiMove = aiSelection?.moveName === move?.name;
                    const ppPercent = (move.uses / move.maxUses) * 100;
                    const isFull = move.uses >= move.maxUses;
                    
                    return (
                        <div 
                            key={move?.name}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${isFull ? 'bg-gray-100 opacity-60' : 'hover:bg-indigo-50 hover:border-indigo-400'} ${isAiMove ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-400' : 'border-indigo-100'}`}
                            onClick={() => !isFull && handleMoveSelect(move?.name)}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-gray-800">{move?.displayName ?? move?.name}</span>
                                <span className={`text-xs font-bold ${isFull ? 'text-gray-500' : move.uses === 0 ? 'text-red-500' : 'text-indigo-600'}`}>
                                    {move.uses} / {move.maxUses} PP
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full transition-all duration-500 ${move.uses === 0 ? 'bg-transparent' : ppPercent < 30 ? 'bg-red-500' : ppPercent < 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                    style={{ width: `${ppPercent}%` }}
                                ></div>
                            </div>
                            {isAiMove && <span className="text-[10px] font-black text-yellow-600 animate-pulse block mt-1 text-center">ESCOLHIDO PELA IA</span>}
                        </div>
                    );
                })}
            </div>
            <button 
                className="mt-auto w-full bg-gray-500 text-white font-bold py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                onClick={() => setView('target')}
                disabled={!!aiSelection}
            >
                VOLTAR
            </button>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg min-h-[450px] flex flex-col border-4 relative transition-colors duration-500 ${aiSelection ? 'border-indigo-500' : 'border-yellow-400'}`}>
        
        {/* Faixa de aviso da IA */}
        {aiSelection && (
            <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-center text-xs font-bold py-1 rounded-t-lg z-10 animate-pulse">
                A IA está utilizando um item...
            </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-4 mt-2">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <span className="text-3xl">🎒</span> Mochila
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 font-bold text-xl disabled:opacity-0" disabled={!!aiSelection}>✕</button>
        </div>

        {view === 'list' && renderTabs()}
        
        <div className="flex-1">
            {view === 'list' && renderList()}
            {view === 'details' && renderDetails()}
            {view === 'target' && renderTargetSelection()}
            {view === 'moves' && renderMoveSelection()}
        </div>
      </div>
    </div>
  );
};
