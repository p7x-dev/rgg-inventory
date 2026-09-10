/** Идентификатор целевой ОС для артефакта релиза. */
export type ReleaseOsId = 'windows' | 'macos' | 'linux';

const RELEASE_OS_IDS: readonly ReleaseOsId[] = ['windows', 'macos', 'linux'];

/** URL префикс для относительных ссылок в манифесте релиза. */
export interface ReleaseInfo {
	/** Версия приложения в манифесте, например '0.1.0'. */
	version: string;
	/** Ссылка на артефакт для каждой ОС (относительные пути). */
	files: Partial<Record<ReleaseOsId, string>>;
	/** Дата сборки/публикации в ISO. */
	updatedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string, fallback: string): string {
	const value = record[key];
	return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

function readFiles(value: unknown): Partial<Record<ReleaseOsId, string>> {
	if (!isRecord(value)) {
		return {};
	}
	const files: Partial<Record<ReleaseOsId, string>> = {};
	for (const os of RELEASE_OS_IDS) {
		const url = readString(value, os, '');
		// Принимаем и относительные пути (/downloads/…), и прямые ссылки (https://…).
		if (url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://')) {
			files[os] = url;
		}
	}
	return files;
}

/** Проверка, что объект — валидный манифест релиза. Артефактов может не быть (нет сборки). */
export function isReleaseInfo(value: unknown): value is ReleaseInfo {
	if (!isRecord(value)) {
		return false;
	}
	const version = readString(value, 'version', '');
	const updatedAt = readString(value, 'updatedAt', '');
	const files = readFiles(value['files']);
	if (!version || !updatedAt) {
		return false;
	}
	return isRecord(value['files']) ? Object.keys(files).length === Object.keys(value['files']).length : true;
}

/**
 * Определение ОС, на которой запущено приложение.
 * Возвращает идентификатор для скачивания сборки, либо null, если ОС не распознана.
 */
export function detectReleaseOs(): ReleaseOsId | null {
	const ua = navigator.userAgent;
	if (/windows|win32/i.test(ua)) {
		return 'windows';
	}
	if (/mac os x|macintosh|darwin/i.test(ua)) {
		return 'macos';
	}
	if (/linux/i.test(ua)) {
		return 'linux';
	}
	return null;
}

/** Человекочитаемое имя ОС для кнопки скачивания. */
export function releaseOsLabel(os: ReleaseOsId | null): string {
	switch (os) {
		case 'windows':
			return 'Windows';
		case 'macos':
			return 'macOS';
		case 'linux':
			return 'Linux';
		default:
			return 'приложение';
	}
}