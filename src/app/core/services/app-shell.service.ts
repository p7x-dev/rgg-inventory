import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsStore } from '@core/stores/settings.store';
import { isOverlayUrl } from '@core/utils/overlay';
import { fromEvent, map } from 'rxjs';
import { TauriWindowService } from './tauri-window.service';

/**
 * Состояние корневой оболочки приложения: режим оверлея, фон страницы и
 * побочные эффекты, привязанные к DOM/Tauri. App.ts — только каркас (шаблон),
 * вся логика живёт здесь и инициализируется через inject.
 */
@Injectable({ providedIn: 'root' })
export class AppShellService {
	/** `true`, когда открыт OBS-виджет (хэш `#/overlay` или браузерный источник OBS): показываем только оверлей. */
	readonly overlayMode = signal(false);

	/**
	 * Фон главной страницы: прозрачный при включённом «Прозрачном фоне», иначе цвет оверлея.
	 * При transparentBg подстраница показывает тёмный фон Taiga (#222), а не белый — тёмная
	 * палитра форсируется в _theme.scss.
	 */
	readonly appBackground = computed(() => {
		const overlay = this.settingsStore.overlay();
		return overlay.transparentBg ? 'transparent' : overlay.overlayColor;
	});

	private readonly destroyRef = inject(DestroyRef);
	private readonly document = inject(DOCUMENT);
	private readonly settingsStore = inject(SettingsStore);
	private readonly tauriWindow = inject(TauriWindowService);

	constructor() {
		this.overlayMode.set(isOverlayUrl(window.location.hash));

		fromEvent<HashChangeEvent>(window, 'hashchange')
			.pipe(
				map((event) => event.newURL),
				map(isOverlayUrl),
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