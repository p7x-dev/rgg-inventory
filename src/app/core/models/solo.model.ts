/**
 * Модель данных Solo RGG.
 *
 * Всё берётся из Google-таблицы стримера и «тасуется» по заголовкам:
 * платформа + игра + действие + причина. В инвентаре показывается текущая
 * игра на платформе, что с ней сделано (action) и причина скипа/реролла.
 */

/** Платформы Solo RGG (как в правилах rgg.land /solo). */
export const SOLO_PLATFORMS: readonly string[] = [
	'NES',
	'PS1',
	'SNES',
	'STEAM',
	'SMD',
	'SMD+2',
	'N64',
	'3DO',
	'PS2',
	'ZXspec',
	'ZX Spectrum',
	'DOS',
	'Game Boy',
	'Master System',
	'Game Gear',
	'TG16',
	'GBA',
] as const;

export type SoloPlatform = (typeof SOLO_PLATFORMS)[number] | 'Другое';

/** Что сделано с игрой. */
export type SoloAction = 'completed' | 'reroll' | 'skip';

export const SOLO_ACTION_LABEL: Record<SoloAction, string> = {
	completed: 'Пройдено',
	reroll: 'Реролльнуто',
	skip: 'Пропущено',
};

/** Строка таблицы стримера: одна запись «платформа → игра → действие». */
export interface SoloRow {
	platform: SoloPlatform;
	game: string;
	action: SoloAction;
	/** Причина скипа/реролла (пусто для пройденных). */
	reason?: string;
	/** Короткое описание/заметка об игре из таблицы (если колонка есть). */
	description?: string;
	/** Признак «текущая игра на платформе» (что показывать в инвентаре). */
	current: boolean;
}

/** Итоги по платформе: сколько пройдено / реролльнуто / пропущено. */
export interface SoloStats {
	completed: number;
	reroll: number;
	skip: number;
}

/** Платформа с её играми и сводкой. */
export interface SoloCategory {
	platform: SoloPlatform;
	/** Игра, которая сейчас на платформе (current), если есть. */
	current: SoloRow | null;
	rows: SoloRow[];
	stats: SoloStats;
}

/** Полный набор данных Solo RGG. */
export interface SoloData {
	player: string;
	/** Итоги «сколько пройдено/реролльнуто/пропущено» по всем платформам. */
	total: SoloStats;
	categories: SoloCategory[];
	fetchedAt: string;
}

/** Унифицированный результат загрузки Solo-таблицы. */
export type SoloLoadResult = { ok: true; data: SoloData } | { ok: false; error: string };

/** Парсит действие из значения ячейки (регистр/символы не важны). */
export function parseSoloAction(value: string): SoloAction | null {
	const normalized = value.trim().toLowerCase();
	if (
		normalized === 'пройдено' ||
		normalized === 'пройдена' ||
		normalized === 'пройден' ||
		normalized === 'clear' ||
		normalized === 'прошёл' ||
		normalized === 'прошел' ||
		normalized === '+' ||
		normalized === '💾'
	) {
		return 'completed';
	}
	if (
		normalized === 'реролл' ||
		normalized === 'рерол' ||
		normalized === 'реролльнуто' ||
		normalized === 'reroll' ||
		normalized === 're-roll' ||
		normalized === 'пропущено через реролл' ||
		normalized === '🔁'
	) {
		return 'reroll';
	}
	if (
		normalized === 'скип' ||
		normalized === 'пропущено' ||
		normalized === 'пропущен' ||
		normalized === 'skip' ||
		normalized === 'дроп' ||
		normalized === '⏭' ||
		normalized === '✖'
	) {
		return 'skip';
	}
	return null;
}

/** Приводит строку к известной платформе; null — неизвестная. */
export function parseSoloPlatform(value: string): SoloPlatform | null {
	const normalized = value.trim().toLowerCase();
	return SOLO_PLATFORMS.find((platform) => platform.toLowerCase() === normalized) ?? null;
}

/** Короткое имя платформы для компактной подписи слота (fallback иконки). */
export function soloPlatformShortName(platform: string): string {
	switch (platform) {
		case 'Game Boy':
			return 'GB';
		case 'Master System':
			return 'MS';
		case 'Game Gear':
			return 'GG';
		case 'ZX Spectrum':
			return 'ZX';
		default:
			return platform;
	}
}