import type { CustomFontFace } from '@app/core/models/theme.model';
import { describe, expect, it } from 'vitest';
import { fontFaceCss, fontStack, sanitizeFontFamily } from './font-face';

describe('sanitizeFontFamily', () => {
	it('чистит кавычки и лишние символы', () => {
		expect(sanitizeFontFamily('"My Font"')).toBe('My-Font');
		expect(sanitizeFontFamily('  A  B  ')).toBe('A-B');
	});

	it('даёт безопасное имя для пустого значения', () => {
		expect(sanitizeFontFamily('')).toBe('rgg-custom-font');
	});

	it('никогда не возвращает подозрительные имена', () => {
		expect(sanitizeFontFamily('..\\etc')).toBe('etc');
	});
});

describe('fontStack', () => {
	it('ставит кастомный шрифт первым в стеке', () => {
		expect(fontStack('My Font', 'sans-serif')).toBe('"My Font", sans-serif');
	});

	it('без кастомного шрифта возвращает фолбэк', () => {
		expect(fontStack(null, 'sans-serif')).toBe('sans-serif');
	});
});

describe('fontFaceCss', () => {
	it('собирает правильный @font-face (woff2 в кавычках)', () => {
		const font: CustomFontFace = {
			family: 'vern',
			dataUrl: 'data:font/woff2;base64,ABC',
			format: 'woff2',
		};
		expect(fontFaceCss(font)).toBe(
			[
				'@font-face {',
				'\tfont-family: vern;',
				'\tsrc: url("data:font/woff2;base64,ABC") format("woff2");',
				'\tfont-display: swap;',
				'}',
			].join('\n'),
		);
	});

	it('собирает @font-face для truetype без кавычек у формата', () => {
		const font: CustomFontFace = {
			family: 'vern',
			dataUrl: 'data:font/ttf;base64,XYZ',
			format: 'truetype',
		};
		expect(fontFaceCss(font)).toContain('format(truetype)');
	});
});