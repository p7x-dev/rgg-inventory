import type { getCurrentWindow as TauriGetCurrentWindow } from '@tauri-apps/api/window';
import { DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OverlayBarComponent } from '@app/features/overlay/overlay-bar/overlay-bar.component';
import { OverlayPageComponent } from '@app/features/overlay/overlay-page/overlay-page.component';
import { TutorialComponent } from '@app/features/tutorial/tutorial.component';
import { SettingsStore } from '@core/stores/settings.store';
import { isTauri } from '@core/utils/platform';
import { fitTauriWindow } from '@core/utils/tauri-fit';
import { ThemeHostDirective } from '@shared/ui/theme-host/theme-host.directive';
import { TuiRoot } from '@taiga-ui/core';
import { fromEvent, map } from 'rxjs';

/** Хэш-фрагмент URL, включающий OBS-виджет оверлея без панели управления. */
export const OVERLAY_URL_HASH = '#/overlay';

/** Полный URL OBS-виджета для текущего origin (вставляется в браузерный источник OBS). */
export function overlayUrl(): string {
	return `${window.location.origin}${window.location.pathname}${OVERLAY_URL_HASH}`;
}

/** `true`, когда страница загружена внутри браузерного источника OBS (User-Agent содержит `obs`). */
export function isObsBrowserSource(): boolean {
	return typeof navigator !== 'undefined' && /obs/i.test(navigator.userAgent);
}

/** Применяет «поверх всех окон» к окну Tauri в зависимости от PiP-настройки. */
async function applyAlwaysOnTop(getCurrentWindow: typeof TauriGetCurrentWindow, enabled: boolean): Promise<void> {
	try {
		await getCurrentWindow().setAlwaysOnTop(enabled);
	} catch (error) {
		console.warn('Не удалось переключить always-on-top:', error);
	}
}

@Component({
	selector: 'app-root',
	imports: [TuiRoot, ThemeHostDirective, OverlayBarComponent, OverlayPageComponent, TutorialComponent],
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App {
	/** `true`, когда открыт OBS-виджет (хэш `#/overlay` или браузерный источник OBS): показываем только оверлей. */
	protected readonly overlayMode = signal(false);

	/**
	 * Фон главной страницы — всегда цвет оверлея (подложка для превью бара и настроек).
	 * Прозрачность самого бара задаётся отдельной настройкой transparentBg в overlay-bar.
	 */
	protected readonly appBackground = computed(() => this.settingsStore.overlay().overlayColor);

	private readonly destroyRef = inject(DestroyRef);
	private readonly document = inject(DOCUMENT);
	private readonly settingsStore = inject(SettingsStore);

	private readonly lastAlwaysOnTop = signal<boolean | null>(null);

	constructor() {
		const isOverlay = (url: string): boolean => url.endsWith(OVERLAY_URL_HASH) || isObsBrowserSource();
		this.overlayMode.set(isOverlay(window.location.hash));

		fromEvent<HashChangeEvent>(window, 'hashchange')
			.pipe(
				map((event) => event.newURL),
				map(isOverlay),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe((next) => this.overlayMode.set(next));

		// В OBS-режиме убираем фон у body, чтобы браузерный источник был прозрачным.
		// Прозрачность самого бара (transparentBg) на главную страницу не влияет.
		effect(() => {
			this.document.body.classList.toggle('obs-overlay', this.overlayMode());
		});

		// Фон всплывающих поверхностей (дропдауны, попапы, обучалка) следует за цветом оверлея,
		// чтобы не оставалось чёрных подложек при смене цвета фона.
		effect(() => {
			const overlay = this.settingsStore.overlay();
			const popup = overlay.transparentBg ? 'rgba(18, 14, 28, 0.95)' : overlay.overlayColor;
			this.document.documentElement.style.setProperty('--inv-popup-bg', popup);
		});

		// PiP-режим: применяем «поверх всех окон» к окну Tauri при изменении настройки.
		effect(() => {
			if (!isTauri()) {
				return;
			}
			const enabled = this.settingsStore.overlay().pipEnabled;
			if (enabled === this.lastAlwaysOnTop()) {
				return;
			}
			this.lastAlwaysOnTop.set(enabled);
			void import('@tauri-apps/api/window').then(({ getCurrentWindow }) =>
				applyAlwaysOnTop(getCurrentWindow, enabled),
			);
		});

		// Авто-подгонка окна Tauri под размер бара. Пересматриваем окно при изменении
		// настроек, влияющих на ширину/высоту бара (слоты, колонки, скрытие таймера).
		effect(() => {
			if (!isTauri() || this.overlayMode()) {
				return;
			}
			void this.settingsStore.overlay();
			const host = this.document.querySelector('app-overlay-bar');
			// Ждём обновления DOM после смены сигналов настроек.
			setTimeout(() => void fitTauriWindow(host as HTMLElement | null), 0);
		});
	}
}
