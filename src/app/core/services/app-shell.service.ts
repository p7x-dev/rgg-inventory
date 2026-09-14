import type { WidgetId } from '@core/models/settings.model';
import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsStore } from '@core/stores/settings.store';
import { isOverlayUrl, widgetIdFromUrl } from '@core/utils/overlay';
import { isTauri } from '@core/utils/platform';
import { fromEvent, map } from 'rxjs';
import { TauriWindowService } from './tauri-window.service';

/**
 * Состояние корневой оболочки приложения: режим оверлея, отдельный виджет,
 * фон страницы и побочные эффекты, привязанные к DOM/Tauri.
 */
@Injectable({ providedIn: 'root' })
export class AppShellService {
	/** `true`, когда открыт OBS-виджет (хэш `#/overlay` или браузерный источник OBS): показываем только оверлей. */
	readonly overlayMode = signal(false);

	/** Отдельный виджет по URL `#/widget/<id>` (null — обычный режим). */
	readonly widgetMode = signal<WidgetId | null>(null);

	/**
	 * Фон главной страницы: прозрачный при включённом «Прозрачном фоне» или внутри Tauri
	 * (окно уже transparent:true — так оверлей чисто ловится в OBS без чёрных подложек),
	 * иначе токен темы --inv-background (следует за выбранной темой/цветом фона).
	 */
	readonly appBackground = computed(() => {
		const overlay = this.settingsStore.overlay();
		return overlay.transparentBg || isTauri() ? 'transparent' : 'var(--inv-background)';
	});

	private readonly destroyRef = inject(DestroyRef);
	private readonly document = inject(DOCUMENT);
	private readonly settingsStore = inject(SettingsStore);
	private readonly tauriWindow = inject(TauriWindowService);

	constructor() {
		this.overlayMode.set(isOverlayUrl(window.location.hash));
		this.widgetMode.set(widgetIdFromUrl(window.location.hash));

		fromEvent<HashChangeEvent>(window, 'hashchange')
			.pipe(
				map((event) => event.newURL),
				map((url) => ({ overlay: isOverlayUrl(url), widget: widgetIdFromUrl(url) })),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe(({ overlay, widget }) => {
				this.overlayMode.set(overlay);
				this.widgetMode.set(widget);
			});

		// В OBS-режиме убираем фон у body, чтобы браузерный источник был прозрачным.
		// Прозрачность самого бара (transparentBg) на главную страницу не влияет.
		effect(() => {
			this.document.body.classList.toggle('obs-overlay', this.overlayMode());
		});

		// Фон всплывающих поверхностей (дропдауны, попапы, обучалка) следует за токеном
		// темы, чтобы не оставалось чёрных подложек при смене цвета фона.
		effect(() => {
			const overlay = this.settingsStore.overlay();
			const popup =
				overlay.transparentBg || isTauri()
					? 'rgba(18, 14, 28, 0.95)'
					: 'var(--inv-background)';
			this.document.documentElement.style.setProperty('--inv-popup-bg', popup);
		});

		// PiP-режим: применяем «поверх всех окон» к окну Tauri при изменении настройки.
		effect(() => {
			const enabled = this.settingsStore.overlay().pipEnabled;
			void this.tauriWindow.setAlwaysOnTop(enabled);
		});

		// Авто-подгонка окна Tauri под размер бара при изменении влияющих настроек.
		effect(() => {
			if (this.overlayMode()) {
				return;
			}
			void this.settingsStore.overlay();
			const host = this.document.querySelector('app-overlay-bar') as HTMLElement | null;
			// Ждём обновления DOM после смены сигналов настроек.
			setTimeout(() => void this.tauriWindow.fitToBar(host), 0);
		});
	}
}