import { THEME_PRESETS } from '@core/theme/theme.service';
import { describe, expect, it } from 'vitest';
import { generateThemeCss, generateThemeScss, normalizeCauseName, themeFileName } from './theme-export';

const TOKENS = THEME_PRESETS['rgg-retro'];

describe('normalizeCauseName', () => {
	it('приводит ник к нижнему регистру и убирает мусор', () => {
		expect(normalizeCauseName('Bradhi')).toBe('bradhi');
		expect(normalizeCauseName('  My_Nick__Stream  ')).toBe('my_nick_stream');
		expect(normalizeCauseName('Хороший_Ник999')).toBe('хороший_ник999');
	});

	it('пустой ник даёт пустую строку', () => {
		expect(normalizeCauseName('   ')).toBe('');
	});
});

describe('themeFileName', () => {
	it('формирует {ник}-theme.css', () => {
		expect(themeFileName('Bradhi', 'css')).toBe('bradhi-theme.css');
		expect(themeFileName('bradhi', 'scss')).toBe('bradhi-theme.scss');
	});

	it('без ника использует inventory-тему', () => {
		expect(themeFileName('', 'css')).toBe('inventory-theme.css');
	});
});

describe('generateThemeCss', () => {
	it('включает шрифты, :root и все токены', () => {
		const css = generateThemeCss(TOKENS, 'bradhi');
		expect(css).toContain('RGG Inventory · кастомная тема — bradhi');
		expect(css).toContain('fonts.googleapis.com');
		expect(css).toContain(':root');
		expect(css).toContain('--inv-slot-bg: rgba(255, 255, 255, 0.08);');
		expect(css).toContain('--inv-text: #eceff1;');
		expect(css).toContain('--inv-slot-size: 56px;');
	});

	it('переопределяет токены на .app-shell с !important (для OBS)', () => {
		const css = generateThemeCss(TOKENS, 'bradhi');
		expect(css).toContain('.app-shell {');
		expect(css).toContain('--inv-slot-bg: rgba(255, 255, 255, 0.08) !important;');
		expect(css).toContain('--inv-text: #eceff1 !important;');
	});

	it('документирует подключение в OBS', () => {
		const css = generateThemeCss(TOKENS, 'bradhi');
		expect(css).toContain('Как использовать в OBS');
		expect(css).toContain('Пользовательский CSS');
	});

	it('null-текстура и фон становятся none', () => {
		const css = generateThemeCss(TOKENS, '');
		expect(css).toContain('--inv-slot-texture: none;');
		expect(css).toContain('--inv-background-image: none;');
	});

	it('dataURL-текстура становится url("...")', () => {
		const tokens = { ...TOKENS, slotTexture: 'data:image/png;base64,AAA' };
		const css = generateThemeCss(tokens, '');
		expect(css).toContain('--inv-slot-texture: url("data:image/png;base64,AAA");');
		expect(css).toContain('--inv-slot-texture: url("data:image/png;base64,AAA") !important;');
	});
});

describe('generateThemeScss', () => {
	it('содержит SCSS-переменные и :root-блок с оболочкой', () => {
		const scss = generateThemeScss(TOKENS, 'bradhi');
		expect(scss).toContain('RGG Inventory · кастомная тема — bradhi');
		expect(scss).toContain(':root');
		expect(scss).toContain('--inv-slot-bg: rgba(255, 255, 255, 0.08);');
		expect(scss).toContain('.app-shell {');
		expect(scss).toContain('--inv-text: #eceff1 !important;');
		expect(scss).toMatch(/\$inv-text: #eceff1;/);
	});
});