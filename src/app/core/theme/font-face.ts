import type { CustomFontFace } from '@core/models/theme.model';

/** Допустимые MIME шрифтов и их формат в @font-face. */
const FONT_FORMATS: Record<string, CustomFontFace['format']> = {
	'font/woff2': 'woff2',
	'font/woff': 'woff',
	'font/ttf': 'truetype',
	'font/otf': 'opentype',
	'application/font-woff2': 'woff2',
	'application/font-woff': 'woff',
	'application/vnd.ms-fontobject': 'truetype',
	'application/vnd.ms-opentype': 'opentype',
};

/**
 * Нормализует имя семейства шрифта в CSS-безопасное имя:
 * только буквы/цифры/дефис, без пробелов и спецсимволов.
 */
export function sanitizeFontFamily(name: string): string {
	const base = name.trim().replace(/\.[a-z0-9]{1,7}$/i, '');
	const cleaned = base
		.replace(/[^\p{L}\p{N}-]+/gu, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
	return cleaned || 'rgg-custom-font';
}

/** Парсит MIME и имя файла в токен кастомного шрифта. */
export function fontFaceFromFile(name: string, mime: string, dataUrl: string): CustomFontFace {
	return {
		family: sanitizeFontFamily(name),
		format: FONT_FORMATS[mime] ?? 'truetype',
		dataUrl,
	};
}

/** CSS правила @font-face для встраивания кастомного шрифта. */
export function fontFaceCss(fontFace: CustomFontFace): string {
	const formatValue = fontFace.format === 'truetype' ? 'truetype' : fontFace.format;
	const quotedFormat = ['woff2', 'woff'].includes(fontFace.format) ? `"${fontFace.format}"` : formatValue;
	return [
		'@font-face {',
		`\tfont-family: ${fontFace.family};`,
		`\tsrc: url("${fontFace.dataUrl}") format(${quotedFormat});`,
		'\tfont-display: swap;',
		'}',
	].join('\n');
}

/** Список приоритетных семейств: кастомный шрифт всегда первым. */
export function fontStack(customFamily: string | null, fallback: string): string {
	if (!customFamily) {
		return fallback;
	}
	return `"${customFamily}", ${fallback}`;
}