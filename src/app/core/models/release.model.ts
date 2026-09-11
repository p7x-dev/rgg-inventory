/** Идентификатор целевой ОС для артефакта релиза. */
export type ReleaseOsId = 'windows' | 'macos' | 'linux';

const RELEASE_OS_IDS: readonly ReleaseOsId[] = ['windows', 'macos', 'linux'];

/**
 * Ссылка на артефакт: может быть одна (Windows/macOS) или несколько форматов
 * (Linux — AppImage, rpm, deb). Для каждого элемента возвращаем одну ссылку.
 */
export interface ReleaseArtifact {
	/** Формат/тип артефакта: 'AppImage', 'deb', 'rpm', 'exe', 'dmg' и т.п. */
	format: string;
	/** URL для скачивания (относительный /downloads/... или прямой https://...). */
	url: string;
}

/** URL префикс для относительных ссылок в манифесте релиза. */
export interface ReleaseInfo {
	/** Версия приложения в манифесте, например '0.1.0'. */
	version: string;
	/** Ссылка на артефакт(ы) для каждой ОС (относительные пути или прямые ссылки). */
	files: Partial<Record<ReleaseOsId, string | readonly string[]>>;
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

function ACCEPTED_URL(url: string): boolean {
	return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
}

/** Читает одну ссылку или список ссылок для ОС, возвращает [] когда нет. */
function readOsUrls(value: unknown): string[] {
	if (typeof value === 'string') {
		return ACCEPTED_URL(value) ? [value] : [];
	}
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((url): url is string => typeof url === 'string' && ACCEPTED_URL(url));
}

function readFiles(value: unknown): Partial<Record<ReleaseOsId, string[]>> {
	if (!isRecord(value)) {
		return {};
	}
	const files: Partial<Record<ReleaseOsId, string[]>> = {};
	for (const os of RELEASE_OS_IDS) {
		const urls = readOsUrls(value[os]);
		if (urls.length > 0) {
			files[os] = urls;
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
	if (!version || !updatedAt) {
		return false;
	}
	const files = readFiles(value['files']);
	return isRecord(value['files'])
		? Object.keys(files).length === Object.keys(value['files']).length
		: true;
}

/** Расшифровывает формат артефакта по имени/URL (AppImage, deb, rpm, exe, dmg). */
export function releaseArtifactFormat(urlOrName: string): string {
	const lower = urlOrName.toLowerCase();
	if (lower.includes('.appimage')) {
		return 'AppImage';
	}
	if (lower.includes('.deb')) {
		return 'deb';
	}
	if (lower.includes('.rpm')) {
		return 'rpm';
	}
	if (lower.includes('.dmg')) {
		return 'dmg';
	}
	if (lower.includes('-setup.exe') || lower.includes('.exe')) {
		return 'exe';
	}
	if (lower.includes('.msi')) {
		return 'msi';
	}
	const match = /\.([a-z0-9]{2,6})(?:$|\?)/.exec(lower);
	return match ? match[1] : 'сборка';
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