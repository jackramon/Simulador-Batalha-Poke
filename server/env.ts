import path from 'node:path';
import { config } from 'dotenv';

export function loadLocalEnv(directory = process.cwd()): void {
  config({
    path: path.resolve(directory, '.env.local'),
    // Não sobrescreve variáveis injetadas pelo sistema ou pelo AI Studio.
    override: false,
    // A ausência do arquivo é tolerada e nenhum valor carregado é registrado.
    quiet: true,
  });
}
