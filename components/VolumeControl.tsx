
import React, { useState, useEffect, useRef } from 'react';
import AudioManager from '../services/audio/AudioManager';

interface VolumeControlProps {
    type?: 'master' | 'music';
    label?: string;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({ type = 'master', label }) => {
    const [volume, setVolume] = useState(
        type === 'master' ? AudioManager.getMasterVolume() : AudioManager.getMusicVolume()
    );
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVol = parseInt(e.target.value);
        setVolume(newVol);
        if (type === 'master') {
            AudioManager.setMasterVolume(newVol);
        } else {
            AudioManager.setMusicVolume(newVol);
        }
    };

    // Fecha o controle ao clicar fora dele
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);

    const getIcon = () => {
        if (volume === 0) return type === 'music' ? '🔕' : '🔇';
        if (volume < 50) return type === 'music' ? '🎵' : '🔉';
        return type === 'music' ? '🎶' : '🔊';
    };

    return (
        <div 
            ref={containerRef}
            className={`flex items-center bg-white/90 backdrop-blur-sm border border-gray-200 shadow-sm transition-all duration-300 ease-out z-50 ${isExpanded ? 'w-auto px-4 py-2 gap-3 rounded-2xl' : 'w-10 h-10 justify-center rounded-full hover:scale-110 cursor-pointer'}`}
            title={label || (type === 'master' ? "Efeitos Sonoros" : "Música")}
            onClick={(e) => {
                 if (!isExpanded) setIsExpanded(true);
            }}
        >
            <button 
                className="text-lg leading-none select-none focus:outline-none flex items-center justify-center w-full h-full"
                onClick={(e) => {
                    if (isExpanded) {
                        e.stopPropagation();
                        setIsExpanded(false);
                    }
                }}
            >
                {getIcon()}
            </button>
            
            {isExpanded && (
                <div className="flex flex-col w-32 animate-fade-in origin-left whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {label && <span className="text-[8px] font-black text-gray-500 uppercase leading-none mb-1 ml-1">{label}</span>}
                    <div className="flex items-center gap-2">
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={volume} 
                            onChange={handleChange}
                            className="flex-1 min-w-0 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="text-xs font-mono font-bold text-gray-600 w-6 text-right">{volume}%</span>
                    </div>
                </div>
            )}
        </div>
    );
};
