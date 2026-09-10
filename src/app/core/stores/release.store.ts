import { computed } from '@angular/core';
import { httpGetJson } from '@core/connectors/http.util';
import {
	detectReleaseOs,
	isReleaseInfo,
	type ReleaseInfo,
} from '@core/models/release.model';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

/**
 * Базовый URL релизов. В Tauri location.origin — синтетический (tauri://localhost),
 * поэтому используем абсолютный адрес прод-сервера, где лежит latest.json.
 */
export const RELEASES_BASE_URL = 'https://rgg-inv.rdpctd.dev';

interface ReleaseState {
	latest: ReleaseInfo | null;
	loading: boolean;
	error: string | null;
}

const initialState: ReleaseState = { latest: null, loading: false, error: null };

/**
 * Релизы приложения. Проверка обновлений: запрос манифеста /downloads/latest.json,
 * результат — latest со ссылкой на артефакт. Скачивание — навигация браузера на URL.
 */
export const ReleaseStore = signalStore(
	{ providedIn: 'root' },
	withState<ReleaseState>(initialState),
	withComputed((store) => ({
		/** ОС, под которую нужно качать (для текущей платформы). */
		os: computed(() => detectReleaseOs()),
		/** Готова ли мета-информация о последнем релизе. */
		isAvailable: computed(() => store.latest() !== null),
		/** Есть ли артефакт под текущую ОС в загруженном манифесте. */
		hasArtifact: computed(() => {
			const latest = store.latest();
			const os = detectReleaseOs();
			return latest !== null && os !== null && latest.files[os] !== undefined;
		}),
		/** Полный URL артефакта под текущую ОС (или пустая строка). */
		downloadUrl: computed(() => {
			const latest = store.latest();
			const os = detectReleaseOs();
			if (!latest || !os) {
				return '';
			}
			const path = latest.files[os];
			if (!path) {
				return '';
			}
			return `${RELEASES_BASE_URL}${path}`;
		}),
	})),
	withMethods((store) => ({
		/** Повторная проверка манифеста с сервера. */
		async check(): Promise<void> {
			patchState(store, { loading: true, error: null });
			try {
				const payload: unknown = await httpGetJson(`${RELEASES_BASE_URL}/downloads/latest.json`);
				if (!isReleaseInfo(payload)) {
					throw new Error('Манифест релиза повреждён');
				}
				patchState(store, { latest: payload, loading: false });
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : 'Не удалось проверить обновления';
				patchState(store, { error: message, loading: false });
			}
		},
	})),
);