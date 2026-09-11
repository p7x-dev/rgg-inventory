import { Injectable, signal } from '@angular/core';

/**
 * Межкомпонентная навигация к настройкам: любой инжектор (например, баннер
 * «Доступно скачивание») может запросить открытие настроек с раскрытием и
 * прокруткой к секции «Приложение». OverlayBar перехватывает запрос.
 */
@Injectable({ providedIn: 'root' })
export class SettingsNavigationService {
	/** Счётчик запросов «открыть секцию Приложение» (инкремент = новый запрос). */
	private readonly openAppRequest = signal(0);

	/** Последний номер запроса; 0 — запросов ещё не было. */
	readonly appSectionVersion = this.openAppRequest.asReadonly();

	/** Попросить открыть настройки и прокрутить к секции «Приложение». */
	requestOpenAppSection(): void {
		this.openAppRequest.update((value) => value + 1);
	}
}