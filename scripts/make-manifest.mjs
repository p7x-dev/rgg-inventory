#!/usr/bin/env node
/**
 * Генерирует /downloads/latest.json для сервера из папки с собранными артефактами.
 * Берёт по одному предпочтительному артефакту на ОС:
 *   windows -> *-setup.exe, macos -> *.dmg, linux -> *.AppImage (deb/rpm как запасные).
 * Использование: node scripts/make-manifest.mjs <папка с артефактами> <версия>
 * Результат пишется в <папка>/latest.json, который workflow загружает на сервер.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const [bundleDir, versionArg] = process.argv.slice(2);
if (!bundleDir || !versionArg) {
	console.error('Usage: node scripts/make-manifest.mjs <bundle-dir> <version>');
	process.exit(1);
}

const version = versionArg.replace(/^v/, '');
const files = readdirSync(bundleDir).filter((name) => !name.endsWith('latest.json'));

function pick(exts) {
	return files.find((name) => exts.some((ext) => name.toLowerCase().endsWith(ext)));
}

function pickAll(exts) {
	return files.filter((name) => exts.some((ext) => name.toLowerCase().endsWith(ext)));
}

function entry(name) {
	return name ? `/downloads/${encodeURIComponent(name)}` : undefined;
}

const manifest = {
	version,
	files: {
		windows: entry(pick(['-setup.exe', '.exe', '.msi'])),
		macos: entry(pick(['.dmg', '.app.tar.gz'])),
		// Linux: все собранные форматы списком (0.2.0+); пустой список не включаем.
		...(pickAll(['.AppImage', '.deb', '.rpm']).length > 0
			? { linux: pickAll(['.AppImage', '.deb', '.rpm']).map((name) => entry(name)).filter(Boolean) }
			: {}),
	},
	updatedAt: new Date().toISOString(),
};

const outPath = join(bundleDir, 'latest.json');
writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.warn(`Manifest written: ${outPath}`);
console.warn(JSON.stringify(manifest));