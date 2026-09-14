/**
 * Модель данных Solo RGG.
 *
 * Всё берётся из Google-таблицы стримера и «тасуется» по заголовкам:
 * платформа + игра + действие + причина. В инвентаре показывается текущая
 * игра на платформе, что с ней сделано (action) и причина скипа/реролла.
 */

/** Платформы Solo RGG (как в правилах rgg.land /solo). */
export const SOLO_PLATFORMS: readonly string[] = [
	// Nintendo
	'NES',
	'SNES',
	'N64',
	'GameCube',
	'Game Boy',
	'Game Boy Color',
	'GBA',
	'Virtual Boy',
	'Famicom Disk System',
	// Sega
	'SMD',
	'Sega CD',
	'32X',
	'Master System',
	'Game Gear',
	'Saturn',
	'Dreamcast',
	'SG-1000',
	// Sony
	'PS1',
	'PS2',
	'PSP',
	// Прочее
	'STEAM',
	// NEC
	'TG16',
	'PC-FX',
	// SNK
	'Neo Geo',
	'Neo Geo Pocket',
	// Atari
	'Atari 2600',
	'Atari 5200',
	'Atari 7800',
	'Atari Lynx',
	'Atari Jaguar',
	'Atari ST',
	// Компьютеры
	'ZX Spectrum',
	'DOS',
	'Commodore 64',
	'Amiga',
	'MSX',
	'Amstrad CPC',
	'Apple II',
	'BBC Micro',
	'X68000',
	'FM Towns',
	// Прочее
	'3DO',
	'CD-i',
	'WonderSwan',
	'ColecoVision',
	'Intellivision',
	'Vectrex',
	'Аркада',
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

/** Синонимы названий платформ (как их пишут в таблицах стримеров). */
const SOLO_PLATFORM_ALIASES: Readonly<Record<string, SoloPlatform>> = {
	'nintendo entertainment system': 'NES',
	'famicon': 'NES',
	'famicom': 'NES',
	'super nintendo': 'SNES',
	'super nintendo entertainment system': 'SNES',
	'super famicom': 'SNES',
	'nintendo 64': 'N64',
	'nintendo 64dd': 'N64',
	'gamecube': 'GameCube',
	'gc': 'GameCube',
	'nintendo gamecube': 'GameCube',
	'gameboy': 'Game Boy',
	'game boy classic': 'Game Boy',
	'gb': 'Game Boy',
	'gameboy color': 'Game Boy Color',
	'gbc': 'Game Boy Color',
	'game boy advance': 'GBA',
	'gameboy advance': 'GBA',
	'gba sp': 'GBA',
	'virtual boy': 'Virtual Boy',
	'famicom disk system': 'Famicom Disk System',
	'fds': 'Famicom Disk System',
	'sega mega drive': 'SMD',
	'sega genesis': 'SMD',
	'mega drive': 'SMD',
	'genesis': 'SMD',
	'megadrive': 'SMD',
	'md': 'SMD',
	'sega mega drive 2': 'SMD',
	'mega drive 2': 'SMD',
	'genesis 2': 'SMD',
	'md2': 'SMD',
	'sega cd': 'Sega CD',
	'mega cd': 'Sega CD',
	'sega mega cd': 'Sega CD',
	'sega 32x': '32X',
	'32x': '32X',
	'sega master system': 'Master System',
	'master system': 'Master System',
	'ms': 'Master System',
	'sega game gear': 'Game Gear',
	'game gear': 'Game Gear',
	'gg': 'Game Gear',
	'sega saturn': 'Saturn',
	'saturn': 'Saturn',
	'sega dreamcast': 'Dreamcast',
	'dreamcast': 'Dreamcast',
	'dc': 'Dreamcast',
	'sega sg-1000': 'SG-1000',
	'sg1000': 'SG-1000',
	'sg-1000': 'SG-1000',
	'playstation': 'PS1',
	'psx': 'PS1',
	'ps one': 'PS1',
	'ps1': 'PS1',
	'playstation 2': 'PS2',
	'ps2': 'PS2',
	'playstation portable': 'PSP',
	'psp': 'PSP',
	'turbografx-16': 'TG16',
	'turbografx 16': 'TG16',
	'pc engine': 'TG16',
	'turbo grafx': 'TG16',
	'pce': 'TG16',
	'pc-fx': 'PC-FX',
	'neo geo': 'Neo Geo',
	'neo geo aes': 'Neo Geo',
	'neo geo mvs': 'Neo Geo',
	'ng': 'Neo Geo',
	'neo geo pocket': 'Neo Geo Pocket',
	'atari 2600': 'Atari 2600',
	'atari 5200': 'Atari 5200',
	'atari 7800': 'Atari 7800',
	'atari lynx': 'Atari Lynx',
	'atari jaguar': 'Atari Jaguar',
	'atari st': 'Atari ST',
	'zx-spectrum': 'ZX Spectrum',
	'zx spectrum': 'ZX Spectrum',
	'zxspectrum': 'ZX Spectrum',
	'zx': 'ZX Spectrum',
	'спеktrum': 'ZX Spectrum',
	'спектрум': 'ZX Spectrum',
	'commodore 64': 'Commodore 64',
	'c64': 'Commodore 64',
	'commodore c64': 'Commodore 64',
	'amiga': 'Amiga',
	'commodore amiga': 'Amiga',
	'msx': 'MSX',
	'msx2': 'MSX',
	'amstrad cpc': 'Amstrad CPC',
	'cpc': 'Amstrad CPC',
	'apple ii': 'Apple II',
	'apple 2': 'Apple II',
	'bbc micro': 'BBC Micro',
	'x68000': 'X68000',
	'sharp x68000': 'X68000',
	'fm towns': 'FM Towns',
	'3do': '3DO',
	'panasonic 3do': '3DO',
	'cd-i': 'CD-i',
	'philips cd-i': 'CD-i',
	'wonderswan': 'WonderSwan',
	'bandai wonderswan': 'WonderSwan',
	'colecovision': 'ColecoVision',
	'coleco vision': 'ColecoVision',
	'intellivision': 'Intellivision',
	'vectrex': 'Vectrex',
	'аркада': 'Аркада',
	'arcade': 'Аркада',
	'автомат': 'Аркада',
	'игровой автомат': 'Аркада',
	'pc': 'DOS',
	'пк': 'DOS',
	'компьютер': 'DOS',
	'windows': 'DOS',
};

/** Приводит строку к известной платформе; null — неизвестная. */
export function parseSoloPlatform(value: string): SoloPlatform | null {
	const normalized = value.trim().toLowerCase();
	const exact = SOLO_PLATFORMS.find((platform) => platform.toLowerCase() === normalized);
	if (exact) {
		return exact;
	}
	return SOLO_PLATFORM_ALIASES[normalized] ?? null;
}

/** Короткое имя платформы для компактной подписи слота (fallback иконки). */
export function soloPlatformShortName(platform: string): string {
	switch (platform) {
		case 'Game Boy':
			return 'GB';
		case 'Game Boy Color':
			return 'GBC';
		case 'Master System':
			return 'MS';
		case 'Game Gear':
			return 'GG';
		case 'ZX Spectrum':
			return 'ZX';
		case 'Famicom Disk System':
			return 'FDS';
		case 'Sega CD':
			return 'SCD';
		case 'Neo Geo':
			return 'NG';
		case 'Neo Geo Pocket':
			return 'NGP';
		case 'Atari 2600':
			return 'A2600';
		case 'Atari 5200':
			return 'A5200';
		case 'Atari 7800':
			return 'A7800';
		case 'Atari Lynx':
			return 'Lynx';
		case 'Atari Jaguar':
			return 'Jag';
		case 'Atari ST':
			return 'AST';
		case 'Commodore 64':
			return 'C64';
		case 'Amstrad CPC':
			return 'CPC';
		case 'Apple II':
			return 'AII';
		case 'BBC Micro':
			return 'BBC';
		case 'FM Towns':
			return 'FMT';
		case 'CD-i':
			return 'CDi';
		case 'WonderSwan':
			return 'WS';
		case 'ColecoVision':
			return 'CV';
		case 'Intellivision':
			return 'INTV';
		case 'Vectrex':
			return 'VTX';
		case 'Аркада':
			return 'ARC';
		default:
			return platform;
	}
}