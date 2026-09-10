import type { CustomFontFace, DesignLayout, ThemeTokens } from '@core/models/theme.model';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

/** Формат архива темы. Bump при несовместимых изменениях. */
export const THEME_ARCHIVE_VERSION = 1;

export interface ThemeArchive {
	version: number;
	/** Ник стримера для имени файла при импорте. */
	nick: string;
	tokens: ThemeTokens;
	design: DesignLayout | null;
	fontFace: CustomFontFace | null;
}

export const THEME_ARCHIVE_FILENAME = 'theme.json';

/** Шаблон имени: {ник}-rgg-theme.zip. */
export function themeArchiveName(nick: string): string {
	const safe = nick.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
	return `${safe || 'inventory'}-rgg-theme.zip`;
}

/** Собирает zip-архив темы. Чистая функция: тестируется roundtrip. */
export function buildThemeArchive(archive: ThemeArchive): Uint8Array {
	return zipSync({
		[THEME_ARCHIVE_FILENAME]: strToU8(JSON.stringify(archive)),
	});
}

/** Читает zip-архив темы. Чистая функция: тестируется roundtrip. */
export function parseThemeArchive(bytes: Uint8Array): ThemeArchive {
	const files = unzipSync(bytes);
	const entry = files[THEME_ARCHIVE_FILENAME];
	if (!entry) {
		throw new Error('Архив не содержит theme.json');
	}
	let parsed: unknown;
	try {
		parsed = JSON.parse(strFromU8(entry));
	} catch {
		throw new Error('Некорректный JSON в архиве темы');
	}
	return validateThemeArchive(parsed);
}

/** Валидирует разобранный архив темы, отбрасывая битые/устаревшие поля. */
export function validateThemeArchive(value: unknown): ThemeArchive {
	if (typeof value !== 'object' || value === null) {
		throw new Error('Архив темы повреждён');
	}
	const record = value as Record<string, unknown>;
	const design = isDesignLayout(record['design']) ? (record['design'] as DesignLayout) : null;
	const fontFace = isFontFace(record['fontFace']) ? (record['fontFace'] as CustomFontFace) : null;
	if (!isThemeTokens(record['tokens'])) {
		throw new Error('В архиве нет валидных токенов темы');
	}
	return {
		version: typeof record['version'] === 'number' ? record['version'] : THEME_ARCHIVE_VERSION,
		nick: typeof record['nick'] === 'string' ? record['nick'] : '',
		tokens: record['tokens'] as ThemeTokens,
		design,
		fontFace,
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isThemeTokens(value: unknown): value is ThemeTokens {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value['background'] === 'string' &&
		typeof value['slotSize'] === 'number' &&
		typeof value['text'] === 'string' &&
		typeof value['font'] === 'string' &&
		(value['slotTexture'] === null || typeof value['slotTexture'] === 'string')
	);
}

function isDesignLayout(value: unknown): value is DesignLayout {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value['imageWidth'] === 'number' &&
		typeof value['imageHeight'] === 'number' &&
		typeof value['image'] === 'string' &&
		Array.isArray(value['slots'])
	);
}

function isFontFace(value: unknown): value is CustomFontFace {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value['family'] === 'string' &&
		value['family'].length > 0 &&
		typeof value['dataUrl'] === 'string' &&
		value['dataUrl'].startsWith('data:')
	);
}