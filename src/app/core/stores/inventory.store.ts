import type { InventoryCategory, InventoryData, InventoryLoadResult } from '@core/models/inventory.model';
import { computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ConnectorRegistry } from '@core/connectors/inventory-connector';
import { SettingsStore } from '@core/stores/settings.store';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { from, interval, startWith, switchMap, tap } from 'rxjs';

interface InventoryState {
	data: InventoryData | null;
	loading: boolean;
	error: string | null;
}

/**
 * Инвентарь оверлея. Состояние — data/loading/error. Загрузка через ConnectorRegistry
 * (rggland / sheets / local). Автообновление: interval по settings.overlay.refreshIntervalSec
 * (clamp 15..3600), первый тик сразу.
 */
export const InventoryStore = signalStore(
	{ providedIn: 'root' },
	withState<InventoryState>({ data: null, loading: false, error: null }),
	withComputed((store) => ({
		entries: computed<InventoryCategory[]>(() => store.data()?.categories ?? []),
	})),
	withMethods((store, settingsStore = inject(SettingsStore), connectors = inject(ConnectorRegistry)) => {
		/** Холодная загрузка из активного источника. */
		const load = (): Promise<InventoryLoadResult> => {
			const settings = settingsStore.settings();
			const connector = connectors.create(settings.activeSource, settings.sources);
			return connector
				.load()
				.then((data): InventoryLoadResult => ({ ok: true, data }))
				.catch((error: unknown): InventoryLoadResult => {
					const message = error instanceof Error ? error.message : 'Неизвестная ошибка загрузки';
					return { ok: false, error: message };
				});
		};

		return {
			/** Принудительная загрузка; возвращает результат. */
			async refresh(): Promise<InventoryLoadResult> {
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