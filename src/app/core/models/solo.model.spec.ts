import { describe, expect, it } from 'vitest';
import { parseSoloPlatform, soloPlatformShortName } from './solo.model';

describe('parseSoloPlatform', () => {
	it('распознаёт точные названия платформ', () => {
		expect(parseSoloPlatform('NES')).toBe('NES');
		expect(parseSoloPlatform('Game Boy')).toBe('Game Boy');
		expect(parseSoloPlatform('ZX Spectrum')).toBe('ZX Spectrum');
		expect(parseSoloPlatform('Аркада')).toBe('Аркада');
	});

	it('распознаёт названия без учёта регистра и лишних пробелов', () => {
		expect(parseSoloPlatform('  nEs ')).toBe('NES');
		expect(parseSoloPlatform('smd')).toBe('SMD');
	});

	it('распознаёт синонимы платформ', () => {
		expect(parseSoloPlatform('Super Nintendo')).toBe('SNES');
		expect(parseSoloPlatform('Sega Genesis')).toBe('SMD');
		expect(parseSoloPlatform('Genesis')).toBe('SMD');
		expect(parseSoloPlatform('Mega Drive')).toBe('SMD');
		expect(parseSoloPlatform('PlayStation')).toBe('PS1');
		expect(parseSoloPlatform('PSX')).toBe('PS1');
		expect(parseSoloPlatform('Nintendo 64')).toBe('N64');
		expect(parseSoloPlatform('PC Engine')).toBe('TG16');
		expect(parseSoloPlatform('Game Boy Advance')).toBe('GBA');
		expect(parseSoloPlatform('GBC')).toBe('Game Boy Color');
		expect(parseSoloPlatform('GameCube')).toBe('GameCube');
		expect(parseSoloPlatform('Dreamcast')).toBe('Dreamcast');
		expect(parseSoloPlatform('Saturn')).toBe('Saturn');
		expect(parseSoloPlatform('PSP')).toBe('PSP');
		expect(parseSoloPlatform('Arcade')).toBe('Аркада');
		expect(parseSoloPlatform('C64')).toBe('Commodore 64');
		expect(parseSoloPlatform('Amiga')).toBe('Amiga');
	});

	it('возвращает null для неизвестной платформы', () => {
		expect(parseSoloPlatform('Своя платформа')).toBeNull();
		expect(parseSoloPlatform('')).toBeNull();
	});
});

describe('soloPlatformShortName', () => {
	it('сокращает длинные названия', () => {
		expect(soloPlatformShortName('Game Boy')).toBe('GB');
		expect(soloPlatformShortName('Game Boy Color')).toBe('GBC');
		expect(soloPlatformShortName('Master System')).toBe('MS');
		expect(soloPlatformShortName('Game Gear')).toBe('GG');
		expect(soloPlatformShortName('ZX Spectrum')).toBe('ZX');
		expect(soloPlatformShortName('Famicom Disk System')).toBe('FDS');
		expect(soloPlatformShortName('Commodore 64')).toBe('C64');
		expect(soloPlatformShortName('Аркада')).toBe('ARC');
	});

	it('оставляет короткие названия без изменений', () => {
		expect(soloPlatformShortName('NES')).toBe('NES');
		expect(soloPlatformShortName('PS1')).toBe('PS1');
		expect(soloPlatformShortName('DOS')).toBe('DOS');
	});
});