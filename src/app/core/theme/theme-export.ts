import type { CustomFontFace, ThemeTokens } from '@core/models/theme.model';
import { THEME_CSS_VARS, themeCssValue } from '@core/theme/theme.service';

export type ThemeExportFormat = 'css' | 'scss' | 'sass' | 'less' | 'stylus';

const FONT_FACE = [
	'@import url("https://fonts.googleapis.com/css2?',
	'family=Roboto+Mono:wght@400;600',
	'&family=Rubik:wght@400;500;600;700',
	'&display=swap");',
].join('');

const FONT_FORMAT_MIME: Record<CustomFontFace['format'], string> = {
	woff2: 'font/woff2',
	woff: 'font/woff',
	truetype: 'font/ttf',
	opentype: 'font/otf',
};

/** Инлайн @font-face для кастомного шрифта (dataURL с base64). */
export function customFontFaceCss(fontFace: CustomFontFace): string {
	const src = `url("${fontFace.dataUrl}") format("${FONT_FORMAT_MIME[fontFace.format]}")`;
	return `@font-face { font-family: ${fontFace.family}; src: ${src}; font-display: swap; }`;
}

/** Блок шрифтов: Google import + (если задан) кастомный @font-face. */
export function fontFacesBlock(tokens: ThemeTokens): string {
	const custom = tokens.fontFace ? customFontFaceCss(tokens.fontFace) : null;
	return custom ? `${FONT_FACE}\n${custom}` : FONT_FACE;
}

/** Ник → безопасное имя файла: только буквы/цифры, нижний регистр, разделитель `_`. */
export function normalizeCauseName(nick: string): string {
	return nick
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '_')
		.replace(/^_+|_+$/g, '');
}

/** Имя файла темы вида `{ник}-theme.{css|scss}`. */
export function themeFileName(nick: string, format: ThemeExportFormat): string {
	const base = normalizeCauseName(nick) || 'inventory';
	return `${base}-theme.${format}`;
}

function header(nick: string): string {
	const who = normalizeCauseName(nick) || 'без имени';
	return [
		'/* ============================================================',
		` * RGG Inventory · кастомная тема — ${who}`,
		' * Сгенерировано автоматически. Токены оверлея инвентаря.',
		' *',
		' * Как использовать в OBS:',
		' * 1) Добавьте источник "Браузер" и укажите адрес виджета.',
		' * 2) Поле "Пользовательский CSS" → вставьте содержимое этого файла.',
		' * 3) Цвета и шрифты виджета переопределятся темой.',
		' *',
		' * Как использовать на сайте: подключите файл после основных стилей виджета.',
		' * ============================================================ */',
	].join('\n');
}

function varsBlock(tokens: ThemeTokens, indent: string, important = false): string {
	const bang = important ? ' !important' : '';
	return Object.entries(THEME_CSS_VARS)
		.map(([key, cssVar]) => `${indent}${cssVar}: ${themeCssValue(tokens, key as keyof ThemeTokens)}${bang};`)
		.join('\n');
}

function scssVars(tokens: ThemeTokens): string {
	return Object.entries(THEME_CSS_VARS)
		.map(([, cssVar]) => {
			const scssName = cssVar.replace(/^--/, '$');
			return `${scssName}: ${themeCssValue(tokens, cssVar.replace('--inv-', '') as keyof ThemeTokens)};`;
		})
		.join('\n');
}

/** Sass (отступы) версия переменных: `$inv-background: value`. */
function sassVars(tokens: ThemeTokens): string {
	return Object.entries(THEME_CSS_VARS)
		.map(([, cssVar]) => {
			const name = cssVar.replace(/^--/, '$');
			return `${name}: ${themeCssValue(tokens, cssVar.replace('--inv-', '') as keyof ThemeTokens)}`;
		})
		.join('\n');
}

/** Less версия переменных: `@inv-background: value;`. */
function lessVars(tokens: ThemeTokens): string {
	return Object.entries(THEME_CSS_VARS)
		.map(([, cssVar]) => {
			const name = cssVar.replace(/^--/, '@');
			return `${name}: ${themeCssValue(tokens, cssVar.replace('--inv-', '') as keyof ThemeTokens)};`;
		})
		.join('\n');
}

/** Stylus версия переменных: `inv-background = value`. */
function stylusVars(tokens: ThemeTokens): string {
	return Object.entries(THEME_CSS_VARS)
		.map(([, cssVar]) => {
			const name = cssVar.replace(/^--/, '');
			return `${name} = ${themeCssValue(tokens, cssVar.replace('--inv-', '') as keyof ThemeTokens)}`;
		})
		.join('\n');
}

/** Переопределение токенов на оболочке виджета — `!important` побеждает inline-стили приложения. */
function shellOverrides(tokens: ThemeTokens, indent: string): string {
	return `.app-shell {\n${varsBlock(tokens, `${indent}\t`, true)}\n${indent}}`;
}

/** Полноценный CSS-файл темы: :root + переопределение оболочки + шрифты. */
export function generateThemeCss(tokens: ThemeTokens, nick: string): string {
	return [
		header(nick),
		fontFacesBlock(tokens),
		':root {',
		varsBlock(tokens, '\t'),
		'}',
		'',
		shellOverrides(tokens, ''),
	].join('\n');
}

/** SCSS-версия: SCSS-переменные + тот же набор в :root для совместимости с CSS. */
export function generateThemeScss(tokens: ThemeTokens, nick: string): string {
	return [
		header(nick),
		fontFacesBlock(tokens),
		'// SCSS-токены (удобно переопределять и переиспользовать)',
		scssVars(tokens),
		'',
		'// Готовые CSS-переменные для подключения в :root',
		':root {',
		varsBlock(tokens, '\t'),
		'}',
		'',
		'// Переопределение на оболочке виджета (!important, побеждает инлайновые токены — нужно для OBS)',
		'.app-shell {',
		varsBlock(tokens, '\t', true),
		'}',
		'',
	].join('\n');
}

/** Sass-версия (отступы вместо скобок). */
export function generateThemeSass(tokens: ThemeTokens, nick: string): string {
	return [
		header(nick),
		fontFacesBlock(tokens),
		'// Sass-токены',
		sassVars(tokens),
		'',
		'// Переопределение на оболочке виджета (!important)',
		'.app-shell',
		`\t${varsBlock(tokens, '\t', true).replace(/;\n/g, '\n').replace(/;$/gm, '')}`,
		'',
	].join('\n');
}

/** Less-версия. */
export function generateThemeLess(tokens: ThemeTokens, nick: string): string {
	return [
		header(nick),
		fontFacesBlock(tokens),
		'// Less-токены',
		lessVars(tokens),
		'',
		'// Переопределение на оболочке виджета (!important)',
		'.app-shell {',
		varsBlock(tokens, '\t', true),
		'}',
		'',
	].join('\n');
}

/** Stylus-версия. */
export function generateThemeStylus(tokens: ThemeTokens, nick: string): string {
	return [
		header(nick),
		fontFacesBlock(tokens),
		'// Stylus-токены',
		stylusVars(tokens),
		'',
		'// Переопределение на оболочке виджета (!important)',
		'.app-shell',
		`\t${varsBlock(tokens, '\t', true).replace(/;\n/g, '\n').replace(/;$/gm, '')}`,
		'',
	].join('\n');
}

/** Генератор темы по формату. */
export function generateTheme(tokens: ThemeTokens, nick: string, format: ThemeExportFormat): string {
	switch (format) {
		case 'scss':
			return generateThemeScss(tokens, nick);
		case 'sass':
			return generateThemeSass(tokens, nick);
		case 'less':
			return generateThemeLess(tokens, nick);
		case 'stylus':
			return generateThemeStylus(tokens, nick);
		default:
			return generateThemeCss(tokens, nick);
	}
}