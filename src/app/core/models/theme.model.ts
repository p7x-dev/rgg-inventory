/** Пользовательский шрифт: семейство + встроенный dataURL. */
export interface CustomFontFace {
	/** Имя семейства для @font-face (безопасное имя). */
	family: string;
	/** dataURL файла шрифта (base64), встраивается без внешних запросов. */
	dataUrl: string;
	/** Формат из MIME файла шрифта. */
	format: 'woff2' | 'woff' | 'truetype' | 'opentype';
}

/** Токены темы — CSS-переменные, которые на лету применяются к документу. */
export interface ThemeTokens {
	background: string;
	backgroundImage: string | null;
	backgroundOpacity: number;
	slotSize: number;
	slotGap: number;
	padding: number;
	borderRadius: number;
	slotBg: string;
	slotBorderColor: string;
	slotBorderWidth: number;
	slotHoverBg: string;
	/** dataURL текстуры, показываемый в каждом слоте (вместо CSS-фона). */
	slotTexture: string | null;
	/** dataURL иконки монеток (заменяет дефолтную иконку TUI). */
	coinIcon: string | null;
	/** dataURL иконки слёз (заменяет дефолтную иконку TUI). */
	tearIcon: string | null;
	/** Спрайты слотов из дизайна: применяются по индексу в grid-режиме (null — отключено). */
	slotSprites: string[] | null;
	/** Пользовательский шрифт, встраиваемый @font-face в документ и в экспорт. */
	fontFace: CustomFontFace | null;
	text: string;
	textMuted: string;
	accent: string;
	timerFont: string;
	font: string;
	shadow: string;
}

/** Прямоугольник слота, обнаруженный на картинке дизайна (в координатах картинки). */
export interface SlotRegion {
	x: number;
	y: number;
	width: number;
	height: number;
	/** Вырезанная текстура слота (dataURL). */
	texture: string;
	borderColor: string;
	backgroundColor: string;
}

/** Результат анализа картинки-дизайна. */
export interface DesignLayout {
	imageWidth: number;
	imageHeight: number;
	slots: SlotRegion[];
	rows: number;
	cols: number;
	colors: {
		background: string;
		border: string;
		text: string;
	};
	/** Полная картинка как dataURL (для фона оверлея). */
	image: string;
}

export const THEME_PRESET = {
	RggRetro: 'rgg-retro',
	Minecraft: 'minecraft',
	Glass: 'glass',
	Custom: 'custom',
} as const;

export type ThemePresetId = (typeof THEME_PRESET)[keyof typeof THEME_PRESET];

/** Набор значений из картинки, достаточный для темы. */
export interface DesignDerivedTheme {
	tokens: ThemeTokens;
	layout: DesignLayout;
}
