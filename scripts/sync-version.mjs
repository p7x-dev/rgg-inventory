#!/usr/bin/env node
/**
 * Генерирует src/app/core/version.ts из package.json — единственный источник версии.
 * Запускается автоматически перед build/test/start/watch (хуки pre-* в package.json).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = String(pkg.version ?? '').replace(/^v/, '');

const content = `// AUTO-GENERATED from package.json — do not edit.
export const APP_VERSION: string = '${version}';
`;

writeFileSync(join(root, 'src/app/core/version.ts'), content);
console.warn(`version.ts synced: ${version}`);