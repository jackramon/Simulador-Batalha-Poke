import React, { useRef, useState } from 'react';
import { Pokemon } from '../types';
import { exportShowdownTeam, parseShowdownTeam, ShowdownParseError } from '../services/showdownParser';

interface ShowdownImportPanelProps {
    playerNum: 1 | 2;
    teamSize: number;
    accent: 'green' | 'red';
    /** Equipe atualmente carregada para este jogador (ref da configuração), usada na exportação. */
    currentTeam: Pokemon[] | null;
    onImported: (team: Pokemon[]) => void;
}

const PLACEHOLDER = `Charizard (M) @ Leftovers
Ability: Blaze
Level: 50
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
IVs: 0 Atk
Tera Type: Fire
- Flamethrower
- Air Slash
- Roost
- Dragon Pulse`;

/**
 * Importação por texto/arquivo .txt e exportação no formato Showdown.
 * O fluxo JSON existente permanece em outro modo, sem alterações.
 */
export const ShowdownImportPanel: React.FC<ShowdownImportPanelProps> = ({
    playerNum,
    teamSize,
    accent,
    currentTeam,
    onImported
}) => {
    const [text, setText] = useState('');
    const [status, setStatus] = useState('');
    const [statusKind, setStatusKind] = useState<'info' | 'success' | 'error'>('info');
    const [isLoading, setIsLoading] = useState(false);
    const [importedTeam, setImportedTeam] = useState<Pokemon[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const accentClasses = accent === 'green'
        ? {
            border: 'border-green-200',
            title: 'text-green-700',
            hint: 'text-green-600',
            button: 'bg-green-600 hover:bg-green-700',
            ghost: 'bg-white text-green-700 border-green-200 hover:bg-green-50'
        }
        : {
            border: 'border-red-200',
            title: 'text-red-700',
            hint: 'text-red-600',
            button: 'bg-red-600 hover:bg-red-700',
            ghost: 'bg-white text-red-700 border-red-200 hover:bg-red-50'
        };

    const exportTeam = importedTeam ?? currentTeam ?? null;

    const runImport = async (rawText: string) => {
        if (!rawText.trim()) {
            setStatusKind('error');
            setStatus('❌ Cole o texto Showdown antes de importar.');
            return;
        }

        setIsLoading(true);
        setStatusKind('info');
        setStatus('Importando equipe Showdown...');
        try {
            const team = await parseShowdownTeam(rawText, { expectedCount: teamSize, playerNum });
            setImportedTeam(team);
            onImported(team);
            setStatusKind('success');
            setStatus(`✅ ${team.length} Pokémon importados do formato Showdown.`);
        } catch (error) {
            setStatusKind('error');
            setStatus(
                error instanceof ShowdownParseError
                    ? `❌ ${error.message}`
                    : '❌ Falha inesperada ao importar a equipe Showdown. Tente novamente.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        setIsLoading(true);
        setStatusKind('info');
        setStatus('Lendo arquivo .txt...');
        try {
            const content = await file.text();
            setText(content);
            setIsLoading(false);
            await runImport(content);
        } catch {
            setIsLoading(false);
            setStatusKind('error');
            setStatus('❌ Não foi possível ler o arquivo .txt.');
        }
    };

    const handleExport = () => {
        if (!exportTeam || exportTeam.length === 0) {
            setStatusKind('error');
            setStatus('❌ Importe uma equipe Showdown antes de exportar.');
            return;
        }
        const blob = new Blob([exportShowdownTeam(exportTeam)], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `equipe_p${playerNum}_showdown.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        setStatusKind('success');
        setStatus(`✅ Equipe exportada em formato Showdown (${exportTeam.length} Pokémon).`);
    };

    const statusColor = statusKind === 'error'
        ? 'text-red-600'
        : statusKind === 'success'
            ? accent === 'green' ? 'text-green-700' : 'text-red-700'
            : accentClasses.hint;

    return (
        <div className={`space-y-2 rounded-lg border-2 ${accentClasses.border} bg-white/70 p-3`}>
            <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-black uppercase tracking-wide ${accentClasses.title}`}>
                    📥 Importar Equipe (Showdown)
                </p>
                <button
                    type="button"
                    onClick={handleExport}
                    className={`text-[11px] font-bold px-2 py-1 rounded border ${accentClasses.ghost}`}
                    disabled={isLoading}
                >
                    📤 Exportar (Showdown)
                </button>
            </div>

            <textarea
                className="bg-white border-2 border-gray-200 rounded-lg p-2 w-full text-xs text-gray-900 focus:outline-none focus:border-gray-400 transition-colors h-32 resize-none font-mono"
                placeholder={PLACEHOLDER}
                value={text}
                onChange={(event) => setText(event.target.value)}
                disabled={isLoading}
            />

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    className={`text-xs font-bold px-3 py-1.5 rounded text-white shadow ${accentClasses.button} disabled:opacity-50`}
                    onClick={() => runImport(text)}
                    disabled={isLoading}
                >
                    {isLoading ? 'Importando...' : 'Importar texto'}
                </button>
                <button
                    type="button"
                    className={`text-xs font-bold px-3 py-1.5 rounded border ${accentClasses.ghost} disabled:opacity-50`}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                >
                    📄 Importar arquivo .txt
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,text/plain"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        void handleFile(file);
                        event.target.value = '';
                    }}
                />
                <span className={`text-[11px] font-bold ${accentClasses.hint}`}>
                    Exatamente {teamSize} Pokémon
                </span>
            </div>

            {status && (
                <p role="status" className={`text-xs font-bold ${statusColor}`}>
                    {status}
                </p>
            )}
        </div>
    );
};