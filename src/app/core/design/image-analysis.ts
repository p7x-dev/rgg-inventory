/**
 * Чистые функции анализа изображения: работают с пиксельным массивом
 * (Uint8ClampedArray RGBA), без DOM — легко тестируются.
 */

export interface RgbColor {
	red: number;
	green: number;
	blue: number;
}

export interface DetectGridOptions {
	/** Порог градиента (0..255) для детекции границ. */
	edgeThreshold?: number;
	/** Минимальный размер слота в пикселях. */
	minSlotPx?: number;
	/** Максимум слотов, иначе считаем, что сетка не найдена. */
	maxSlots?: number;
}

/** Относительная яркость (WCAG). */
export function relativeLuminance(color: RgbColor): number {
	const channel = (value: number): number => {
		const s = value / 255;
		return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(color.red) + 0.7152 * channel(color.green) + 0.0722 * channel(color.blue);
}

/** Контрастный цвет текста: тёмный на светлом фоне и наоборот. */
export function readableTextColor(color: RgbColor): '#ffffff' | '#000000' {
	return relativeLuminance(color) > 0.45 ? '#000000' : '#ffffff';
}

export function rgbToHex(color: RgbColor): string {
	const hex = (value: number): string => Math.round(value).toString(16).padStart(2, '0');
	return `#${hex(color.red)}${hex(color.green)}${hex(color.blue)}`;
}

export function pixelAt(pixels: Uint8ClampedArray, width: number, x: number, y: number): RgbColor {
	const offset = (y * width + x) * 4;
	return { red: pixels[offset], green: pixels[offset + 1], blue: pixels[offset + 2] };
}

/** Средний цвет прямоугольной области (с отступом, если задан). */
export function averageColor(
	pixels: Uint8ClampedArray,
	width: number,
	rect: { x: number; y: number; width: number; height: number },
	inset = 0,
): RgbColor {
	let red = 0;
	let green = 0;
	let blue = 0;
	let count = 0;

	const x0 = Math.max(0, rect.x + inset);
	const y0 = Math.max(0, rect.y + inset);
	const x1 = Math.min(width, rect.x + rect.width - inset);
	const y1 = Math.min(pixels.length / 4 / width, rect.y + rect.height - inset);

	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			const offset = (y * width + x) * 4;
			red += pixels[offset];
			green += pixels[offset + 1];
			blue += pixels[offset + 2];
			count++;
		}
	}
	if (count === 0) {
		return { red: 0, green: 0, blue: 0 };
	}
	return { red: red / count, green: green / count, blue: blue / count };
}

/** Средний цвет рамки прямоугольника (кольцо толщиной borderThickness). */
export function averageBorderColor(
	pixels: Uint8ClampedArray,
	width: number,
	rect: { x: number; y: number; width: number; height: number },
	borderThickness = 2,
): RgbColor {
	let red = 0;
	let green = 0;
	let blue = 0;
	let count = 0;

	const height = pixels.length / 4 / width;
	const x0 = Math.max(0, rect.x);
	const y0 = Math.max(0, rect.y);
	const x1 = Math.min(width, rect.x + rect.width);
	const y1 = Math.min(height, rect.y + rect.height);
	const thickness = Math.max(1, borderThickness);

	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			const onTopBorder = y < y0 + thickness;
			const onBottomBorder = y >= y1 - thickness;
			const onLeftBorder = x < x0 + thickness;
			const onRightBorder = x >= x1 - thickness;
			if (!onTopBorder && !onBottomBorder && !onLeftBorder && !onRightBorder) {
				continue;
			}
			const offset = (y * width + x) * 4;
			red += pixels[offset];
			green += pixels[offset + 1];
			blue += pixels[offset + 2];
			count++;
		}
	}
	if (count === 0) {
		return { red: 0, green: 0, blue: 0 };
	}
	return { red: red / count, green: green / count, blue: blue / count };
}

/** Карта границ: 1 там, где градиент яркости превышает порог. */
export function buildEdgeMap(pixels: Uint8ClampedArray, width: number, height: number, threshold = 48): Uint8Array {
	const edge = new Uint8Array(width * height);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const left = pixelAt(pixels, width, Math.max(0, x - 1), y);
			const right = pixelAt(pixels, width, Math.min(width - 1, x + 1), y);
			const top = pixelAt(pixels, width, x, Math.max(0, y - 1));
			const bottom = pixelAt(pixels, width, x, Math.min(height - 1, y + 1));
			const lum = (color: RgbColor): number => 0.299 * color.red + 0.587 * color.green + 0.114 * color.blue;
			const gradient = Math.abs(lum(left) - lum(right)) + Math.abs(lum(top) - lum(bottom));
			edge[y * width + x] = gradient >= threshold ? 1 : 0;
		}
	}
	return edge;
}

export interface LineBand {
	start: number;
	end: number;
}

/**
 * Группирует строки/колонки с большим количеством граничных пикселей
 * в «полосы» — кандидаты в линии сетки слотов.
 */
export function findGridLines(
	edge: Uint8Array,
	width: number,
	height: number,
	orientation: 'horizontal' | 'vertical',
): LineBand[] {
	const size = orientation === 'horizontal' ? height : width;
	const span = orientation === 'horizontal' ? width : height;
	const coverage = Array.from({ length: size }, () => 0);

	for (let i = 0; i < size; i++) {
		let count = 0;
		for (let j = 0; j < span; j++) {
			const index = orientation === 'horizontal' ? i * width + j : j * width + i;
			count += edge[index];
		}
		coverage[i] = count;
	}

	const minCoverage = Math.max(3, span * 0.35);
	const bands: LineBand[] = [];
	let current: LineBand | null = null;
	for (let i = 0; i < size; i++) {
		if (coverage[i] >= minCoverage) {
			if (current === null) {
				current = { start: i, end: i + 1 };
			} else {
				current.end = i + 1;
			}
		} else if (current !== null) {
			bands.push(current);
			current = null;
		}
	}
	if (current !== null) {
		bands.push(current);
	}
	return bands;
}

export interface CellRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Ячейки между соседними полосами линий. */
export function buildCells(horizontal: LineBand[], vertical: LineBand[]): CellRect[] {
	const cells: CellRect[] = [];
	for (let h = 0; h + 1 < horizontal.length; h++) {
		const top = horizontal[h].end;
		const bottom = horizontal[h + 1].start;
		for (let v = 0; v + 1 < vertical.length; v++) {
			const left = vertical[v].end;
			const right = vertical[v + 1].start;
			if (right > left && bottom > top) {
				cells.push({ x: left, y: top, width: right - left, height: bottom - top });
			}
		}
	}
	return cells;
}

/**
 * Детекция сетки слотов на изображении.
 *
 * Возвращает слоты, отфильтрованные до доминирующего размера ячейки
 * (самая многочисленная группа ячеек одного размера).
 */
export function detectSlotGrid(
	pixels: Uint8ClampedArray,
	width: number,
	height: number,
	options: DetectGridOptions = {},
): CellRect[] {
	const edgeThreshold = options.edgeThreshold ?? 48;
	const minSlotPx = options.minSlotPx ?? 8;
	const maxSlots = options.maxSlots ?? 64;

	const edge = buildEdgeMap(pixels, width, height, edgeThreshold);
	const horizontal = findGridLines(edge, width, height, 'horizontal');
	const vertical = findGridLines(edge, width, height, 'vertical');
	if (horizontal.length < 2 || vertical.length < 2) {
		return [];
	}

	const allCells = buildCells(horizontal, vertical).filter(
		(cell) => cell.width >= minSlotPx && cell.height >= minSlotPx,
	);
	if (allCells.length === 0) {
		return [];
	}

	const sizeCounts = new Map<string, CellRect[]>();
	for (const cell of allCells) {
		const key = `${cell.width}x${cell.height}`;
		const bucket = sizeCounts.get(key) ?? [];
		bucket.push(cell);
		sizeCounts.set(key, bucket);
	}

	let dominant: CellRect[] = [];
	for (const bucket of sizeCounts.values()) {
		if (bucket.length > dominant.length) {
			dominant = bucket;
		}
	}
	if (dominant.length === 0 || dominant.length > maxSlots) {
		return [];
	}

	return dominant
		.slice()
		.sort((a, b) => a.y - b.y || a.x - b.x)
		.map((cell) => ({ ...cell }));
}

/** Подсчёт строк и колонок сетки по слотам (по y/x кластерам). */
export function gridDimensions(cells: CellRect[]): { rows: number; cols: number } {
	const ys = [...new Set(cells.map((cell) => cell.y))];
	const xs = [...new Set(cells.map((cell) => cell.x))];
	return { rows: ys.length, cols: xs.length };
}
