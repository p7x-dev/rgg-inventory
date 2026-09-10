import type { ThemeTokens } from '@core/models/theme.model';
import { Directive, effect, ElementRef, inject, Renderer2, RendererStyleFlags2 } from '@angular/core';
import { ThemeStore } from '@core/stores/theme.store';
import { THEME_CSS_VARS, themeCssValue } from '@core/theme/theme.service';

/** Применяет активные токены темы как CSS-переменные к host-элементу. */
@Directive({
	selector: '[appThemeHost]',
})
export class ThemeHostDirective {
	private readonly renderer = inject(Renderer2);
	private readonly elementRef = inject(ElementRef<HTMLElement>);
	private readonly themeStore = inject(ThemeStore);

	constructor() {
		effect(() => {
			const tokens = this.themeStore.tokens();
			const host = this.elementRef.nativeElement;
			for (const key of Object.keys(THEME_CSS_VARS) as (keyof ThemeTokens)[]) {
				// CSS-переменные требуют флага DashCase, иначе рендерер пишет `el.style['--inv-*']`,
				// что CSSOM молча игнорирует.
				this.renderer.setStyle(
					host,
					THEME_CSS_VARS[key],
					themeCssValue(tokens, key),
					RendererStyleFlags2.DashCase,
				);
			}
		});
	}
}
