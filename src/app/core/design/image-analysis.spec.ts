import { describe, expect, it } from 'vitest';
import {
	averageColor,
	buildEdgeMap,
	detectSlotGrid,
	findGridLines,
	gridDimensions,
	readableTextColor,
	rgbToHex,
} from './image-analysis';

/**
 * Синтетическое изображение: белый фон, чёрные рамки слотов.
 * Рамки 2px. Сетка 2 строки x 3 колонки.
 *
 * Рамки по X: [4,6), [34,36), [64,66), [94,96)
 * Рамки по Y: [4,6), [24,26), [44,46)
 *
 * После edge detection полосы расширяются на 1px с каждой стороны:
 *   вертикальные: [3,7), [33,37), [63,67), [93,97)
 *   горизонтальные: [3,7), [23,27), [43,47)
 *
 * Ячейки между полосами: 26x16 (3 col x 2 row = 6 шт).
 */
function makeGridPixels(width: number, height: number): Uint8ClampedArray {
	const pixels = new Uint8ClampedArray(width * height * 4);
	const fill = (x: number, y: number, rgb: readonly [number, number, number]): void => {
		const offset = (y * width + x) * 4;
		pixels[offset] = rgb[0];
		pixels[offset + 1] = rgb[1];
		pixels[offset + 2] = rgb[2];
		pixels[offset + 3] = 255;
	};

	const BLACK: readonly [number, number, number] = [0, 0, 0];
	const WHITE: readonly [number, number, number] = [255, 255, 255];

	const inBorderX = (x: number): boolean =>
		(x >= 4 && x < 6) || (x >= 34 && x < 36) || (x >= 64 && x < 66) || (x >= 94 && x < 96);
	const inBorderY = (y: number): boolean =>
		(y >= 4 && y < 6) || (y >= 24 && y < 26) || (y >= 44 && y < 46);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			fill(x, y, inBorderX(x) || inBorderY(y) ? BLACK : WHITE);
		}
	}
	return pixels;
}

describe('detectSlotGrid', () => {
	it('находит сетку 2x3 одинаковых слотов', () => {
		const pixels = makeGridPixels(120, 50);
		const cells = detectSlotGrid(pixels, 120, 50);

		expect(cells).toHaveLength(6);
		// После расширения edge detection: ячейки 26x16
		expect(cells.every((cell) => cell.width === 26 && cell.height === 16)).toBe(true);
		const { rows, cols } = gridDimensions(cells);
		expect(rows).toBe(2);
		expect(cols).toBe(3);
	});

	it('возвращает пусто без линий сетки', () => {
		const pixels = new Uint8ClampedArray(40 * 40 * 4).fill(255);
		expect(detectSlotGrid(pixels, 40, 40)).toEqual([]);
	});

	it('фильтрует шумовые ячейки: оставляет доминирующий размер', () => {
		const pixels = makeGridPixels(120, 50);
		// добавим один «сломанный» прямоугольник другого размера
		for (let y = 46; y < 49; y++) {
			for (let x = 4; x < 15; x++) {
				const offset = (y * 120 + x) * 4;
				pixels[offset] = 0;
				pixels[offset + 1] = 0;
				pixels[offset + 2] = 0;
			}
		}
		const cells = detectSlotGrid(pixels, 120, 50);
		expect(cells.every((cell) => cell.width === 26 && cell.height === 16)).toBe(true);
	});
});

describe('findGridLines', () => {
	it('находит горизонтальные полосы-рамки', () => {
		const pixels = makeGridPixels(120, 50);
		const edge = buildEdgeMap(pixels, 120, 50);
		const bands = findGridLines(edge, 120, 50, 'horizontal');
		expect(bands.length).toBe(3);
	});
});

describe('averageColor / averageBorderColor', () => {
	it('усредняет внутреннюю область и рамку', () => {
		const pixels = makeGridPixels(120, 50);

		// внутренность первого слота (ячейка x=7..32, y=7..22)
		const interior = averageColor(pixels, 120, { x: 7, y: 7, width: 26, height: 16 }, 2);
		expect(interior.red).toBeGreaterThan(200);

		// рамка: левая граница слота x=4..5 (полностью чёрный вертикальный столбец)
		const border = averageColor(pixels, 120, { x: 4, y: 7, width: 2, height: 16 }, 0);
		expect(border.red).toBeLessThan(20);
	});
});

describe('readableTextColor / rgbToHex', () => {
	it('подбирает контрастный цвет текста', () => {
		expect(readableTextColor({ red: 255, green: 255, blue: 255 })).toBe('#000000');
		expect(readableTextColor({ red: 10, green: 10, blue: 20 })).toBe('#ffffff');
	});

	it('форматирует hex', () => {
		expect(rgbToHex({ red: 255, green: 0, blue: 128 })).toBe('#ff0080');
	});
});
