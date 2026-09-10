import type { ThemePresetId, ThemeTokens } from '@core/models/theme.model';

/** Встроенные темы-пресеты. */
export const THEME_PRESETS: Record<Exclude<ThemePresetId, 'custom'>, ThemeTokens> = {
	'rgg-retro': {
		background: '#121212',
		backgroundImage: null,
		backgroundOpacity: 1,
		slotSize: 56,
		slotGap: 6,
		padding: 14,
		borderRadius: 12,
		slotBg: 'rgba(255, 255, 255, 0.08)',
		slotBorderColor: 'rgba(144, 202, 249, 0.45)',
		slotBorderWidth: 2,
		slotHoverBg: 'rgba(144, 202, 249, 0.22)',
		slotTexture: null,
		coinIcon: null,
		tearIcon: null,
		slotSprites: null,
		fontFace: null,
		text: '#eceff1',
		textMuted: 'rgba(236, 239, 241, 0.65)',
		accent: '#ffd700',
		timerFont: '"DS-DIGI", "Roboto Mono", monospace',
		font: '"Rubik", "Segoe UI", sans-serif',
		shadow: '0 4px 24px rgba(0, 0, 0, 0.6)',
	},
	'minecraft': {
		background: 'rgba(0, 0, 0, 0.55)',
		backgroundImage: null,
		backgroundOpacity: 1,
		slotSize: 56,
		slotGap: 4,
		padding: 10,
		borderRadius: 3,
		slotBg: 'rgba(45, 45, 48, 0.85)',
		slotBorderColor: '#55555a',
		slotBorderWidth: 2,
		slotHoverBg: 'rgba(90, 90, 96, 0.9)',
		slotTexture: null,
		coinIcon: null,
		tearIcon: null,
		slotSprites: null,
		fontFace: null,
		text: '#ffffff',
		textMuted: '#b0b0b4',
		accent: '#55ff55',
		timerFont: '"DS-DIGI", "Roboto Mono", monospace',
		font: '"Segoe UI", sans-serif',
		shadow: 'inset 0 2px 0 rgba(255, 255, 255, 0.08), 0 4px 16px rgba(0, 0, 0, 0.5)',
	},
	'glass': {
		background: 'rgba(255, 255, 255, 0.06)',
		backgroundImage: null,
		backgroundOpacity: 1,
		slotSize: 56,
		slotGap: 8,
		padding: 12,
		borderRadius: 10,
		slotBg: 'rgba(255, 255, 255, 0.12)',
		slotBorderColor: 'rgba(255, 255, 255, 0.35)',
		slotBorderWidth: 1,
		slotHoverBg: 'rgba(255, 255, 255, 0.22)',
		slotTexture: null,
		coinIcon: null,
		tearIcon: null,
		slotSprites: null,
		fontFace: null,
		text: '#ffffff',
		textMuted: 'rgba(255, 255, 255, 0.65)',
		accent: '#7dd3fc',
		timerFont: '"DS-DIGI", "Roboto Mono", monospace',
		font: '"Segoe UI", sans-serif',
		shadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
	},
};

/** Маппинг токенов темы на CSS-переменные (используется директивой-хостом). */
export const THEME_CSS_VARS: Record<keyof ThemeTokens, string> = {
	background: '--inv-background',
	backgroundImage: '--inv-background-image',
	backgroundOpacity: '--inv-background-opacity',
	slotSize: '--inv-slot-size',
	slotGap: '--inv-slot-gap',
	padding: '--inv-padding',
	borderRadius: '--inv-border-radius',
	slotBg: '--inv-slot-bg',
	slotBorderColor: '--inv-slot-border-color',
	slotBorderWidth: '--inv-slot-border-width',
	slotHoverBg: '--inv-slot-hover-bg',
	slotTexture: '--inv-slot-texture',
	coinIcon: '--inv-coin-icon',
	tearIcon: '--inv-tear-icon',
	slotSprites: '--inv-slot-sprites',
	fontFace: '--inv-font-face',
	text: '--inv-text',
	textMuted: '--inv-text-muted',
	accent: '--inv-accent',
	timerFont: '--inv-timer-font',
	font: '--inv-font',
	shadow: '--inv-shadow',
};

function cssValue(token: ThemeTokens, key: keyof ThemeTokens): string {
	switch (key) {
		case 'slotSize':
		case 'slotGap':
		case 'padding':
		case 'borderRadius':
		case 'slotBorderWidth':
			return `${token[key]}px`;
		case 'backgroundImage':
		case 'slotTexture':
		case 'coinIcon':
		case 'tearIcon':
			return token[key] === null ? 'none' : `url("${token[key]}")`;
		case 'backgroundOpacity':
			return String(token[key]);
		case 'slotSprites':
		case 'fontFace':
			return 'none';
		default:
			return token[key] as string;
	}
}

/** CSS-значение для токена (переиспользуется хост-директивой). */
export function themeCssValue(tokens: ThemeTokens, key: keyof ThemeTokens): string {
	return cssValue(tokens, key);
}
