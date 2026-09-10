import type { CustomFontFace } from '@core/models/theme.model';
import { Injectable } from '@angular/core';
import { fontFaceCss } from '@core/theme/font-face';

/**
 * Инъекция @font-face в <head> документа. Поддерживает один активный шрифт:
 * при замене старый style удаляется, чтобы шрифты не накапливались.
 */
@Injectable({ providedIn: 'root' })
export class FontFaceService {
	private style: HTMLStyleElement | null = null;

	private readonly supported = 'fonts' in document;

	/** Применяет кастомный шрифт (активная семья + font-family токены). */
	apply(fontFace: CustomFontFace | null): void {
		if (!this.supported) {
			return;
		}
		if (!fontFace) {
			this.remove();
			return;
		}
		if (this.style && this.style.textContent === fontFaceCss(fontFace)) {
			return;
		}
		this.remove();
		const style = document.createElement('style');
		style.textContent = fontFaceCss(fontFace);
		document.head.appendChild(style);
		this.style = style;
	}

	/** Убирает встроенный @font-face из документа. */
	remove(): void {
		if (!this.style) {
			return;
		}
		this.style.remove();
		this.style = null;
	}
}