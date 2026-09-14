#!/usr/bin/env node
/**
 * Генерирует src/environments/environment.ts из .env — ключи API не живут в исходниках.
 * Читает RAWG_API_KEY (и другие ключи API) и встраивает в бандл.
 * .env и сгенерированный environment.ts в .gitignore — ключи не попадут в репозиторий.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const envPath = join(root, '.env');
const envSource = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const envVars = {};
for (const line of envSource.split(/\r?\n/)) {
	const trimmed = line.trim();
	if (!trimmed || trimmed.startsWith('#')) {
		continue;
	}
	const eq = trimmed.indexOf('=');
	if (eq <= 0) {
		continue;
	}
	const key = trimmed.slice(0, eq).trim();
	const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
	if (key) {
		envVars[key] = value;
	}
}

const rawgApiKey = envVars['RAWG_API_KEY'] ?? '';

const content = `// AUTO-GENERATED from .env by scripts/sync-env.mjs — do not edit.
// Ключи API хранятся в .env (в .gitignore) и не попадают в репозиторий.
export const environment: { rawgApiKey: string } = {
	rawgApiKey: ${JSON.stringify(rawgApiKey)},
};
`;

// Каталог gitignored — на свежем CI-раннере его может не быть.
mkdirSync(join(root, 'src/environments'), { recursive: true });
writeFileSync(join(root, 'src/environments/environment.ts'), content);
console.warn(`environment.ts synced (rawgApiKey: ${rawgApiKey ? 'set' : 'empty'})`);