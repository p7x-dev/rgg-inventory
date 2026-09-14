/**
 * Иконки платформ Solo RGG — PNG-логотипы из пака retro-game-console-icons
 * (KyleBing, GitHub) + Monochrome-Gaming-Logos для недостающих.
 * Файлы: public/assets/platforms/*.png.
 */

const PLATFORM_ASSETS = '/assets/platforms/';

const platformIconFile: Record<string, string> = {
	// Nintendo
	'NES': 'fc',
	'SNES': 'sfc',
	'N64': 'n64',
	'GameCube': 'NGC',
	'Game Boy': 'gb',
	'Game Boy Color': 'gbc',
	'GBA': 'gba',
	'Virtual Boy': 'vb',
	'Famicom Disk System': 'fds',
	// Sega
	'SMD': 'md',
	'SMD+2': 'md',
	'Sega CD': 'segacd',
	'32X': '32X',
	'Master System': 'ms',
	'Game Gear': 'gg',
	'Saturn': 'SATURN',
	'Dreamcast': 'dc',
	'SG-1000': 'SG1000',
	// Sony
	'PS1': 'ps',
	'PS2': 'ps2',
	'PSP': 'psp',
	'STEAM': 'steam',
	// NEC
	'TG16': 'pce',
	'PC-FX': 'PCFX',
	// SNK
	'Neo Geo': 'neogeo',
	'Neo Geo Pocket': 'ngp',
	// Atari
	'Atari 2600': 'atari',
	'Atari 5200': '5200',
	'Atari 7800': '7800',
	'Atari Lynx': 'lynx',
	'Atari Jaguar': 'jaguar',
	'Atari ST': 'atarist',
	// Компьютеры
	'ZX Spectrum': 'zxs',
	'ZXspec': 'zxs',
	'DOS': 'dos',
	'Commodore 64': 'c64',
	'Amiga': 'amiga',
	'MSX': 'msx',
	'Amstrad CPC': 'cpc',
	'Apple II': 'apple2',
	'BBC Micro': 'bbc',
	'X68000': 'x68000',
	'FM Towns': 'fmtowns',
	// Прочее
	'3DO': 'PANASONIC',
	'CD-i': 'cdi',
	'WonderSwan': 'ws',
	'ColecoVision': 'col',
	'Intellivision': 'INTELLIVISION',
	'Vectrex': 'vectrex',
	'Аркада': 'arcade',
};

/** Иконки платформ: относительный URL в public/assets/platforms. */
export const SOLO_PLATFORM_ICONS: Record<string, string> = Object.fromEntries(
	Object.entries(platformIconFile).map(([platform, file]) => [
		platform,
		`${PLATFORM_ASSETS}${file}.png`,
	]),
);