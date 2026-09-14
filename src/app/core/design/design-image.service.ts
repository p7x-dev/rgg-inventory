import type { DesignDerivedTheme, DesignLayout, SlotRegion, ThemeTokens } from '@core/models/theme.model';
import { Injectable } from '@angular/core';
import {
	averageBorderColor,
	averageColor,
	detectSlotGrid,
	gridDimensions,
	readableTextColor,
	rgbToHex,
} from '@core/design/image-analysis';
import { fileToDataUrl } from '@core/utils/file.util';

const MAX_DIMENSION = 1024;
const DEFAULT_FONT = '"Rubik", "Segoe UI", sans-serif';
const DEFAULT_TIMER_FONT = '"DS-DIGI", "Roboto Mono", monospace';

/**
 * Выводит токены темы из готового layout'а дизайна (чистая функция,
 * используется и для превью, и для применения).
 */
export function deriveDesignTokens(layout: DesignLayout): ThemeTokens {
	const slotSizes = layout.slots.map((slot) => slot.width);
	const slotSize =
		slotSizes.length > 0 ? Math.round(slotSizes.reduce((sum, size) => sum + size, 0) / slotSizes.length) : 56;

	return {
		background: 'transparent',
		backgroundImage: layout.image,
		backgroundOpacity: 1,
		slotSize,
		slotGap: 0,
		padding: 0,
		borderRadius: 0,
		slotBg: layout.colors.background,
		slotBorderColor: layout.colors.border,
		slotBorderWidth: 1,
		slotHoverBg: 'rgba(255, 255, 255, 0.18)',
		slotTexture: null,
		// Авто-применение спрайтов: текстуры каждого слота из картинки дизайна.
		slotSprites: layout.slots.map((slot) => slot.texture),
		coinIcon: null,
		tearIcon: null,
		fontFace: null,
		text: layout.colors.text,
		textMuted: layout.colors.text === '#ffffff' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
		accent: layout.colors.border,
		timerFont: DEFAULT_TIMER_FONT,
		font: DEFAULT_FONT,
		shadow: 'none',
	};
}

/** Анализ картинки дизайна: детекция слотов, нарезка текстур, вывод темы. */
@Injectable({ providedIn: 'root' })
export class DesignImageService {
	/** Выводит токены из готового layout (для live-превью после правок пользователя). */
	deriveTokens(layout: DesignLayout): ThemeTokens {
		return deriveDesignTokens(layout);
	}

	/** Читает картинку, находит сетку слотов и режет текстуры. */
	async analyzeFile(file: File): Promise<DesignDerivedTheme> {
		const dataUrl = await fileToDataUrl(file);
		const image = await this.loadImage(dataUrl);
		const { width, height } = this.scaledSize(image.width, image.height);

		const canvas = this.createCanvas(width, height);
		const context = canvas.getContext('2d');
		if (context === null) {
			throw new Error('Canvas недоступен в этом окружении');
		}
		context.drawImage(image, 0, 0, width, height);
		const pixels = context.getImageData(0, 0, width, height).data;

		const cells = detectSlotGrid(pixels, width, height);
		if (cells.length === 0) {
			throw new Error('Не удалось найти сетку слотов на картинке. Попробуйте картинку с явными рамками слотов');
		}

		const slots: SlotRegion[] = cells.map((cell) => {
			const texture = this.cropTexture(canvas, cell.x, cell.y, cell.width, cell.height);
			return {
				...cell,
				texture,
				borderColor: rgbToHex(averageBorderColor(pixels, width, cell, 2)),
				backgroundColor: rgbToHex(averageColor(pixels, width, cell, 2)),
			};
		});

		const { rows, cols } = gridDimensions(cells);
		const overall = averageColor(pixels, width, { x: 0, y: 0, width, height });
		const textColor = readableTextColor(overall);

		const layout: DesignLayout = {
			imageWidth: width,
			imageHeight: height,
			slots,
			rows,
			cols,
			colors: {
				background: rgbToHex(overall),
				border: rgbToHex(
					averageBorderColor(
						pixels,
						width,
						{
							x: 0,
							y: 0,
							width,
							height,
						},
						1,
					),
				),
				text: textColor,
			},
			image: dataUrl,
		};

		return { layout, tokens: deriveDesignTokens(layout) };
	}

	private loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.addEventListener('load', () => resolve(image));
			image.addEventListener('error', () => reject(new Error('Не удалось загрузить картинку')));
			image.src = src;
		});
	}

	private createCanvas(width: number, height: number): HTMLCanvasElement {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}

	private scaledSize(width: number, height: number): { width: number; height: number } {
		const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
		return {
			width: Math.max(1, Math.round(width * scale)),
			height: Math.max(1, Math.round(height * scale)),
		};
	}

	private cropTexture(canvas: HTMLCanvasElement, x: number, y: number, width: number, height: number): string {
		const crop = this.createCanvas(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)));
		const context = crop.getContext('2d');
		if (context === null) {
			return '';
		}
		context.drawImage(canvas, x, y, width, height, 0, 0, crop.width, crop.height);
		return crop.toDataURL('image/png');
	}
}
