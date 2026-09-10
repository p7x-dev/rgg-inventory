import { computed } from '@angular/core';
import { httpGetJson } from '@core/connectors/http.util';
import {
	detectReleaseOs,
	isReleaseInfo,
	type ReleaseInfo,
	releaseOsLabel,
} from '@core/models/release.model';
import { isTauri } from '@core/utils/platform';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

/**
 * Базовый URL релизов. В Tauri location.origin — синтетический (tauri://localhost),
 * поэтому используем абсолютный адрес прод-сервера, где лежит latest.json.
 */
export const RELEASES_BASE_URL = 'https://rgg-inv.rdpctd.dev';

/** Публичный репозиторий: GitHub API читается без токена (источник артефактов на случай пустого манифеста). */
const GITHUB_REPO = 'p7x-dev/rgg-inventory';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}`;

/** Статус последней сборки CI (опрос GitHub Actions runs). */
export type BuildStatus = 'unknown' | 'building' | 'ready' | 'failed';

interface ReleaseState {
	latest: ReleaseInfo | null;
	/** Версия из GitHub Releases (если манифест сервера пуст). */
	githubVersion: string | null;
	/** Browser-download URL артефакта GitHub под текущую ОС (или null). */
	githubDownloadUrl: string | null;
	loading: boolean;
	error: string | null;
	/** Статус последней сборки CI. */
	buildStatus: BuildStatus;
	/** id последнего run (для отладки/ссылки). */
	buildRunId: number | null;
	/** Сообщение о последней сборке. */
	buildMessage: string | null;
}

const initialState: ReleaseState = {
	latest: null,
	githubVersion: null,
	githubDownloadUrl: null,
	loading: false,
	error: null,
	buildStatus: 'unknown',
	buildRunId: null,
	buildMessage: null,
};

function readAssetUrl(assets: unknown, mode: 'prefer' | 'first'): string | null {
	if (!Array.isArray(assets)) {
		return null;
	}
	const list = assets
		.map((asset): string | null => {
			if (typeof asset !== 'object' || asset === null) {
				return null;
			}
			const name = (asset as { name?: unknown }).name;
			const url = (asset as { browser_download_url?: unknown }).browser_download_url;
			return typeof name === 'string' && typeof url === 'string' ? `${name}\u0000${url}` : null;
		})
		.filter((item): item is string => item !== null);

	const os = detectReleaseOs();
	const pick = (name: string): string | null => {
		const match = list.find((item) => item.startsWith(`${name}\u0000`));
		return match ? match.split('\u0000')[1] : null;
	};

	if (os === 'windows') {
		return mode === 'first' ? pick('-setup.exe') : pick('-setup.exe');
	}
	if (os === 'macos') {
		return mode === 'first' ? pick('.dmg') : pick('.dmg');
	}
	// Linux: предпочитаем AppImage, иначе deb/rpm.
	const best = pick('.AppImage');
	return best ?? pick('.deb') ?? pick('.rpm');
}

/**
 * Релизы приложения. Источники артефактов: манифест сервера /downloads/latest.json
 * и GitHub Releases (публичный репо, API без токена). Плюс статус последней сборки CI.
 */
export const ReleaseStore = signalStore(
	{ providedIn: 'root' },
	withState<ReleaseState>(initialState),
	withComputed((store) => ({
		/** ОС, под которую нужно качать (для текущей платформы). */
		os: computed(() => detectReleaseOs()),
		/** Версия доступного приложения: из манифеста, иначе из GitHub Releases. */
		availableVersion: computed(() => store.latest()?.version ?? store.githubVersion()),
		/** Готова ли мета-информация о последнем релизе. */
		isAvailable: computed(() => store.latest() !== null || store.githubVersion() !== null),
		/** Есть ли артефакт под текущую ОС (манифест сервера или GitHub). */
		hasArtifact: computed(() => {
			const latest = store.latest();
			const os = detectReleaseOs();
			if (latest && os && latest.files[os]) {
				return true;
			}
			return store.githubDownloadUrl() !== null;
		}),
		/** Полный URL артефакта под текущую ОС (или пустая строка). */
		downloadUrl: computed(() => {
			const latest = store.latest();
			const os = detectReleaseOs();
			if (latest && os && latest.files[os]) {
				return `${RELEASES_BASE_URL}${latest.files[os]}`;
			}
			return store.githubDownloadUrl() ?? '';
		}),
		/** Есть ли новая версия относительно текущей установленной (OTA для Tauri). */
		hasUpdate: computed(() => {
			const version = store.latest()?.version ?? store.githubVersion();
			return version !== null && version !== '' && version !== '0.1.0';
		}),
	})),
	withMethods((store) => ({
		/** Повторная проверка: манифест сервера + GitHub Releases + статус сборки. */
		async check(): Promise<void> {
			patchState(store, { loading: true, error: null });
			try {
				const payload: unknown = await httpGetJson(`${RELEASES_BASE_URL}/downloads/latest.json`);
				const latest = isReleaseInfo(payload) ? payload : null;
				patchState(store, { latest, loading: false });
			} catch (error: unknown) {
				patchState(store, {
					error: error instanceof Error ? error.message : 'Не удалось проверить обновления',
					loading: false,
				});
			}
			await this.checkGithub();
			await this.checkBuild();
		},

		/** Проверка GitHub Releases (фолбэк источника артефактов для публичного репо). */
		async checkGithub(): Promise<void> {
			try {
				const release: unknown = await httpGetJson(`${GITHUB_API}/releases/latest`);
				if (typeof release !== 'object' || release === null) {
					return;
				}
				const tag = (release as { tag_name?: unknown }).tag_name;
				const assets = (release as { assets?: unknown }).assets;
				patchState(store, {
					githubVersion: typeof tag === 'string' ? tag.replace(/^v/, '') : null,
					githubDownloadUrl: readAssetUrl(assets, 'first'),
				});
			} catch {
				// GitHub недоступен — используем только манифест сервера.
			}
		},

		/** Статус последней сборки CI (последний run workflow по тегу v*). */
		async checkBuild(): Promise<void> {
			try {
				const runs: unknown = await httpGetJson(
					`${GITHUB_API}/actions/runs?event=push&per_page=1`,
				);
				if (typeof runs !== 'object' || runs === null) {
					return;
				}
				const workflowRuns = (runs as { workflow_runs?: unknown }).workflow_runs;
				if (!Array.isArray(workflowRuns) || workflowRuns.length === 0) {
					return;
				}
				const run = workflowRuns[0] as {
					id?: unknown;
					status?: unknown;
					conclusion?: unknown;
					head_branch?: unknown;
				};
				const id = typeof run.id === 'number' ? run.id : null;
				const status = typeof run.status === 'string' ? run.status : '';
				const conclusion = typeof run.conclusion === 'string' ? run.conclusion : null;
				const branch = typeof run.head_branch === 'string' ? run.head_branch : '';

				let buildStatus: BuildStatus = 'unknown';
				let message: string | null = null;
				if (status === 'in_progress' || status === 'queued') {
					buildStatus = 'building';
					message = `Сборка ${branch} в процессе…`;
				} else if (conclusion === 'success') {
					const release = await this.checkGithubRelease();
					buildStatus = release ? 'ready' : 'failed';
					message = release ? 'Сборка готова — можно скачать' : 'Артефакт под твою ОС пока не собран';
				} else if (conclusion === 'failure' || conclusion === 'cancelled' || conclusion === 'timed_out') {
					buildStatus = 'failed';
					message = `Сборка завершилась с ошибкой (${conclusion})`;
				}
				patchState(store, { buildStatus, buildRunId: id, buildMessage: message });
			} catch {
				// GitHub недоступен — статус остаётся прежним.
			}
		},

		/** Проверка наличия артефакта в последнем GitHub-релизе (переиспользуется из checkBuild). */
		async checkGithubRelease(): Promise<boolean> {
			try {
				const release: unknown = await httpGetJson(`${GITHUB_API}/releases/latest`);
				if (typeof release !== 'object' || release === null) {
					return false;
				}
				const assetUrl = readAssetUrl((release as { assets?: unknown }).assets, 'first');
				if (assetUrl) {
					patchState(store, { githubDownloadUrl: assetUrl });
				}
				return assetUrl !== null;
			} catch {
				return false;
			}
		},

		/** Человекочитаемые названия ОС для UI. */
		osLabel(): string {
			return releaseOsLabel(detectReleaseOs());
		},

		/** Версия, установленная в текущей сборке (для сравнения с OTA). */
		async currentVersion(): Promise<string> {
			if (isTauri()) {
				try {
					const { getVersion } = await import('@tauri-apps/api/app');
					return await getVersion();
				} catch {
					return '0.1.0';
				}
			}
			return '0.1.0';
		},
	})),
);