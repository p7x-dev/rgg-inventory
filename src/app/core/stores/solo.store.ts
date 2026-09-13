import type { SoloData, SoloLoadResult } from '@core/models/solo.model';
import { computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { SoloConnector } from '@core/connectors/solo.connector';
import { SettingsStore } from '@core/stores/settings.store';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { from, interval, startWith, switchMap, tap } from 'rxjs';

interface SoloState {
	data: SoloData | null;
	loading: boolean;
	error: string | null;
}

/**
 * Solo RGG: состояние таблицы стримера. Загружается из Google Sheets
 * (solo-профиль настроек) и автообновляется по overlay.refreshIntervalSec.
 */
export const SoloStore = signalStore(
	{ providedIn: 'root' },
	withState<SoloState>({ data: null, loading: false, error: null }),
	withComputed((store) => ({
		categories: computed(() => store.data()?.categories ?? []),
		total: computed(() => store.data()?.total ?? { completed: 0, reroll: 0, skip: 0 }),
	})),
	withMethods((store, settingsStore = inject(SettingsStore)) => {
		const load = (): Promise<SoloLoadResult> => {
			const config = settingsStore.settings().sources.solo;
			const connector = new SoloConnector(config);
			return connector
				.load()
				.then((data): SoloLoadResult => ({ ok: true, data }))
				.catch((error: unknown): SoloLoadResult => {
					const message = error instanceof Error ? error.message : 'Неизвестная ошибка загрузки';
					return { ok: false, error: message };
				});
		};

		return {
			/** Принудительная загрузка; возвращает результат. */
			async refresh(): Promise<SoloLoadResult> {
				patchState(store, { loading: true });
				try {
					const result = await load();
					if (result.ok) {
						patchState(store, { data: result.data, error: null });
					} else {
						patchState(store, { error: result.error });
					}
					return result;
				} finally {
					patchState(store, { loading: false });
				}
			},
		};
	}),
	withHooks({
		onInit(store) {
			const settingsStore = inject(SettingsStore);
			const destroyRef = inject(DestroyRef);

			toObservable(settingsStore.overlay)
				.pipe(
					takeUntilDestroyed(destroyRef),
					switchMap((overlay) => {
						const clamped = Math.min(3600, Math.max(15, overlay.refreshIntervalSec));
						return interval(clamped * 1000).pipe(
							startWith(0),
							tap(() => patchState(store, { loading: true })),
							switchMap(() => from(store.refresh())),
							tap(() => patchState(store, { loading: false })),
						);
					}),
				)
				.subscribe();
		},
	}),
);