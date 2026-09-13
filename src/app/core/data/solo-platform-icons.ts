/**
 * Inline SVG-иконки платформ Solo RGG (pixel-art стиль, RGG-палитра).
 * Все иконки 24×24, data:image/svg+xml;base64.
 */
import { svgDataUri } from './svg-icon.util';

// --- Базовые цвета (RGG-палитра) ---
const fg = '#e0d6ff'; // основной цвет пикселей
const bg = '#3a2a5c'; // фоновые элементы
const accent = '#c084fc'; // акцент (фиолет)
const dim = '#6b5a8d'; // приглушённые элементы

// -------------------
// NES — прямоугольная консоль
// -------------------
const nes = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="2" y="8" width="20" height="10" rx="1" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<rect x="4" y="10" width="4" height="4" fill="${dim}" stroke="${fg}" stroke-width="0.5"/>
		<rect x="16" y="10" width="4" height="4" fill="${dim}" stroke="${fg}" stroke-width="0.5"/>
		<rect x="9" y="12" width="2" height="1" fill="${accent}"/>
		<rect x="13" y="12" width="2" height="1" fill="${accent}"/>
		<rect x="11" y="14" width="2" height="1" fill="${fg}"/>
	</svg>`,
);

// -------------------
// Game Boy — вертикальный карманный
// -------------------
const gameBoy = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="5" y="2" width="14" height="20" rx="2" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<rect x="7" y="4" width="10" height="7" rx="1" fill="#1a1028" stroke="${fg}" stroke-width="0.5"/>
		<circle cx="9" cy="16" r="2" fill="${dim}" stroke="${fg}" stroke-width="0.5"/>
		<rect x="14" y="14" width="4" height="1" fill="${fg}"/>
		<rect x="16" y="13" width="1" height="3" fill="${fg}"/>
	</svg>`,
);

// -------------------
// Master System — консоль
// -------------------
const masterSystem = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="2" y="9" width="20" height="8" rx="1" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<rect x="3" y="10" width="7" height="5" fill="#1a1028" stroke="${fg}" stroke-width="0.5"/>
		<rect x="14" y="10" width="2" height="1" fill="${fg}"/>
		<rect x="18" y="10" width="2" height="1" fill="${fg}"/>
		<rect x="14" y="12" width="2" height="1" fill="${accent}"/>
		<rect x="18" y="12" width="2" height="1" fill="${accent}"/>
	</svg>`,
);

// -------------------
// Game Gear — горизонтальный карманный
// -------------------
const gameGear = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="2" y="6" width="20" height="12" rx="2" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<rect x="8" y="7" width="8" height="6" fill="#1a1028" stroke="${fg}" stroke-width="0.5"/>
		<circle cx="4" cy="13" r="2" fill="${dim}" stroke="${fg}" stroke-width="0.5"/>
		<rect x="16" y="12" width="4" height="1" fill="${fg}"/>
		<rect x="18" y="11" width="1" height="3" fill="${fg}"/>
	</svg>`,
);

// -------------------
// SMD (Genesis) — консоль с выемкой
// -------------------
const smd = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="2" y="8" width="20" height="10" rx="2" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<rect x="4" y="9" width="6" height="5" fill="#1a1028" stroke="${fg}" stroke-width="0.5"/>
		<rect x="11" y="10" width="1" height="3" fill="${accent}"/>
		<rect x="14" y="11" width="6" height="3" fill="${dim}" stroke="${fg}" stroke-width="0.5"/>
	</svg>`,
);

// -------------------
// SNES — консоль с джойстиками
// -------------------
const snes = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="2" y="8" width="20" height="10" rx="3" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<circle cx="7" cy="13" r="3" fill="${dim}" stroke="${fg}" stroke-width="0.5"/>
		<rect x="6" y="12" width="2" height="1" fill="${fg}"/>
		<rect x="16" y="11" width="2" height="2" rx="0.5" fill="${accent}" stroke="${fg}" stroke-width="0.5"/>
		<circle cx="15" cy="11" r="1" fill="${fg}"/>
		<circle cx="19" cy="13" r="1" fill="${fg}"/>
	</svg>`,
);

// -------------------
// TG16 — маленькая консоль
// -------------------
const tg16 = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="4" y="10" width="16" height="6" rx="1" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<rect x="6" y="11" width="4" height="3" fill="${dim}" stroke="${fg}" stroke-width="0.5"/>
		<circle cx="15" cy="13" r="1" fill="${accent}"/>
		<circle cx="18" cy="13" r="1" fill="${fg}"/>
	</svg>`,
);

// -------------------
// GBA — горизонтальный карманный
// -------------------
const gba = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="2" y="7" width="20" height="10" rx="2" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<rect x="9" y="8" width="8" height="5" fill="#1a1028" stroke="${fg}" stroke-width="0.5"/>
		<circle cx="5" cy="13" r="2" fill="${dim}" stroke="${fg}" stroke-width="0.5"/>
		<rect x="18" y="12" width="2" height="1" fill="${fg}"/>
	</svg>`,
);

// -------------------
// DOS — компьютер/терминал
// -------------------
const dos = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="4" y="4" width="16" height="11" rx="1" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<rect x="5" y="5" width="14" height="9" fill="#1a1028"/>
		<rect x="6" y="6" width="3" height="1" fill="${fg}"/>
		<rect x="6" y="8" width="6" height="1" fill="${accent}"/>
		<rect x="6" y="10" width="4" height="1" fill="${dim}"/>
		<rect x="8" y="15" width="8" height="2" rx="0.5" fill="${dim}" stroke="${fg}" stroke-width="0.5"/>
	</svg>`,
);

// -------------------
// ZX Spectrum — клавиатура
// -------------------
const zxSpectrum = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="2" y="8" width="20" height="10" rx="1" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<rect x="4" y="10" width="2" height="2" fill="${accent}" stroke="${fg}" stroke-width="0.3"/>
		<rect x="7" y="10" width="2" height="2" fill="${accent}" stroke="${fg}" stroke-width="0.3"/>
		<rect x="10" y="10" width="2" height="2" fill="${accent}" stroke="${fg}" stroke-width="0.3"/>
		<rect x="13" y="10" width="2" height="2" fill="${accent}" stroke="${fg}" stroke-width="0.3"/>
		<rect x="4" y="13" width="2" height="2" fill="${dim}" stroke="${fg}" stroke-width="0.3"/>
		<rect x="7" y="13" width="2" height="2" fill="${dim}" stroke="${fg}" stroke-width="0.3"/>
		<rect x="10" y="13" width="2" height="2" fill="${dim}" stroke="${fg}" stroke-width="0.3"/>
		<rect x="13" y="13" width="2" height="2" fill="${dim}" stroke="${fg}" stroke-width="0.3"/>
		<rect x="17" y="10" width="3" height="5" fill="#1a1028" stroke="${fg}" stroke-width="0.5"/>
	</svg>`,
);

// -------------------
// PS1 — консоль
// -------------------
const ps1 = svgDataUri(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<rect x="3" y="7" width="18" height="11" rx="1" fill="${bg}" stroke="${fg}" stroke-width="1"/>
		<rect x="5" y="9" width="5" height="4" fill="#1a1028" stroke="${fg}" stroke-width="0.5"/>
		<circle cx="16" cy="11" r="1.5" fill="${dim}" stroke="${fg}" stroke-width="0.5"/>
		<rect x="11" y="12" width="1" height="1" fill="${accent}"/>
		<rect x="13" y="12" width="1" height="1" fill="${accent}"/>
	</svg>`,
);

/**
 * Иконки платформ (key = платформа из SOLO_PLATFORMS).
 * Каждая иконка — data:image/svg+xml;base64.
 */
export const SOLO_PLATFORM_ICONS: Record<string, string> = {
	'NES': nes,
	'Game Boy': gameBoy,
	'Master System': masterSystem,
	'Game Gear': gameGear,
	'SMD': smd,
	'SNES': snes,
	'TG16': tg16,
	'GBA': gba,
	'DOS': dos,
	'ZX Spectrum': zxSpectrum,
	'PS1': ps1,
};
