import { Injectable } from '@angular/core';
import { isTauri } from '@core/utils/platform';
import { fitTauriWindow } from '@core/utils/tauri-fit';

/**
 * Низкоуровневая работа с окном Tauri: «поверх всех окон» (PiP) и
 * автоподгонка размера под натуральный размер бара.
 */
@Injectable({ providedIn: 'root' })
export class TauriWindowService {
	/** Переключает «поверх всех окон» (PiP). Окно переключаем только в Tauri. */
	async setAlwaysOnTop(enabled: boolean): Promise<void> {
		if (!isTauri()) {
			return;
		}
		try {
			const { getCurrentWindow } = await import('@tauri-apps/api/window');
			await getCurrentWindow().setAlwaysOnTop(enabled);
		} catch (error) {
			console.warn('Не удалось переключить always-on-top:', error);
		}
	}

	/** Подгоняет размер окна под бар. Принимает host-элемент бара (может быть null). */
	async fitToBar(hostElement: HTMLElement | null): Promise<void> {
		await fitTauriWindow(hostElement);
	}
}