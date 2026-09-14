import type { RawgGameDetail, RawgGameSummary } from '@core/models/rawg.model';
import type { WikiGameInfo } from '@core/models/wiki.model';
import { RawgClientImpl } from '@core/connectors/rawg.client';
import { WikipediaClientImpl } from '@core/connectors/wikipedia.client';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { environment } from '../../../environments/environment';

/** Состояние загрузки информации об игре. */
export interface GameInfoEntry {
	/** Детали с RAWG (обложка, рейтинг, платформы) — null, если ключа нет или игры нет. */
	detail: RawgGameDetail | null;
	/** Описание, обложка и ссылка на статью из русской Википедии. */
	wiki: WikiGameInfo | null;
	loading: boolean;
	error: string | null;
}

interface GameInfoState {
	/** Кэш по нормализованному имени игры. */
	byName: Record<string, GameInfoEntry>;
}

interface WikiSearchItemLike {
	title: string;
}

/** Нормализация имени игры для ключа кэша и сравнения с источниками. */
export function normalizeGameKey(name: string): string {
	return name.trim().toLowerCase();
}

/** Выбирает лучший результат поиска RAWG: точное совпадение по имени, иначе первый. */
export function pickBestMatch(games: RawgGameSummary[], query: string): RawgGameSummary | null {
	if (games.length === 0) {
		return null;
	}
	const key = normalizeGameKey(query);
	return games.find((game) => normalizeGameKey(game.name) === key) ?? games[0] ?? null;
}

/** Выбирает лучший результат поиска Википедии: точное совпадение по имени, иначе первый. */
export function pickBestWikiMatch(
	items: readonly WikiSearchItemLike[],
	query: string,
): WikiSearchItemLike | null {
	if (items.length === 0) {
		return null;
	}
	const key = normalizeGameKey(query);
	return items.find((item) => normalizeGameKey(item.title) === key) ?? items[0] ?? null;
}

/** Ищет статью в русской Википедии и берёт её краткое описание; null — не найдено/ошибка. */
async function loadWikiInfo(wiki: WikipediaClientImpl, name: string): Promise<WikiGameInfo | null> {
	try {
		const search = await wiki.search(name);
		const best = pickBestWikiMatch(search.items, name);
		return best ? await wiki.summary(best.title) : null;
	} catch {
		return null;
	}
}

/** Ищет игру в RAWG (обложка/рейтинг/платформы) как запасной источник; null — ключа нет или запрос не удался. */
async function loadRawgDetail(client: RawgClientImpl | null, name: string): Promise<RawgGameDetail | null> {
	if (!client) {
		return null;
	}
	try {
		const search = await client.search(name);
		const best = pickBestMatch(search.games, name);
		if (!best) {
			return null;
		}
		return await client.detail(best.id);
	} catch {
		return null;
	}
}

/**
 * Информация об игре: описание, обложка и ссылка из русской Википедии;
 * RAWG (обложка/рейтинг/платформы) — как запасной источник, если ключ задан
 * в .env. Результаты кэшируются по имени — повторные запросы не ходят в сеть.
 */
export const GameInfoStore = signalStore(
	{ providedIn: 'root' },
	withState<GameInfoState>({ byName: {} }),
	withMethods((store) => {
		const wiki = new WikipediaClientImpl();
		const rawgClient = (): RawgClientImpl | null => {
			const key = environment.rawgApiKey.trim();
			return key ? new RawgClientImpl(key) : null;
		};

		return {
			async load(name: string): Promise<void> {
				const key = normalizeGameKey(name);
				const existing = store.byName()[key];
				if (existing && !existing.loading) {
					return;
				}
				patchState(store, {
					byName: {
						...store.byName(),
						[key]: { detail: null, wiki: null, loading: true, error: null },
					},
				});
				try {
					const [wikiInfo, rawgDetail] = await Promise.all([
						loadWikiInfo(wiki, name),
						loadRawgDetail(rawgClient(), name),
					]);
					patchState(store, {
						byName: {
							...store.byName(),
							[key]: {
								detail: rawgDetail,
								wiki: wikiInfo,
								loading: false,
								error: null,
							},
						},
					});
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Ошибка загрузки информации';
					patchState(store, {
						byName: {
							...store.byName(),
							[key]: { detail: null, wiki: null, loading: false, error: message },
						},
					});
				}
			},
		};
	}),
);