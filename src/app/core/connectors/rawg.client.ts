import type {
	RawgGameDetail,
	RawgGameSummary,
	RawgSearchResult,
} from '@core/models/rawg.model';
import { httpGetJson } from '@core/connectors/http.util';

/**
 * Клиент RAWG API (rawg.io) — обложки и описания игр (запасной источник
 * после Википедии). Требует API-ключ (бесплатный на rawg.io/apidocs),
 * передаётся в query. CORS у RAWG открыт, запросы идут напрямую из браузера.
 */
export class RawgClientImpl {
	private static readonly BASE_URL = 'https://api.rawg.io/api';

	constructor(private readonly apiKey: string) {}

	private gameUrl(params: Record<string, string>): string {
		const query = new URLSearchParams({ key: this.apiKey, ...params });
		return `${RawgClientImpl.BASE_URL}/games?${query.toString()}`;
	}

	/** Поиск игр по названию (до 5 результатов). */
	async search(query: string): Promise<RawgSearchResult> {
		const payload: unknown = await httpGetJson(this.gameUrl({ search: query, page_size: '5' }));
		return { games: parseSearchResults(payload) };
	}

	/** Полная информация об игре; null — игра не найдена. */
	async detail(id: number): Promise<RawgGameDetail | null> {
		const payload: unknown = await httpGetJson(
			`${RawgClientImpl.BASE_URL}/games/${id}?key=${encodeURIComponent(this.apiKey)}`,
		);
		return parseGameDetail(payload);
	}
}

interface RawgGameSearchItem {
	id: number;
	name: string;
	slug?: string;
	released?: string | null;
	background_image?: string | null;
	rating?: number;
	platforms?: Array<{ platform?: { name?: string } }>;
	genres?: Array<{ name?: string }>;
	description_raw?: string;
	developers?: Array<{ name?: string }>;
	publishers?: Array<{ name?: string }>;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function textOrNull(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

function nameList(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.map((item) => (isObject(item) && typeof item['name'] === 'string' ? item['name'] : null))
		.filter((name): name is string => name !== null);
}

function isGameSearchItem(value: unknown): value is RawgGameSearchItem {
	return isObject(value) && typeof value['id'] === 'number' && typeof value['name'] === 'string';
}

/** Разбирает ответ /games?search=... (результаты поиска). */
function parseSearchResults(payload: unknown): RawgGameSummary[] {
	if (!isObject(payload) || !Array.isArray(payload['results'])) {
		return [];
	}
	return payload['results']
		.filter(isGameSearchItem)
		.map((item) => ({
			id: item.id,
			name: item.name,
			slug: textOrNull(item.slug) ?? '',
			released: textOrNull(item.released),
			background_image: textOrNull(item.background_image),
			rating: typeof item.rating === 'number' ? item.rating : 0,
			platforms: nameList(item.platforms?.map((entry) => entry.platform)),
			genres: nameList(item.genres),
		}));
}

/** Разбирает ответ /games/{id} (полная информация). */
function parseGameDetail(payload: unknown): RawgGameDetail | null {
	if (!isGameSearchItem(payload)) {
		return null;
	}
	const description = textOrNull(payload.description_raw);
	if (description === null) {
		return null;
	}
	return {
		id: payload.id,
		name: payload.name,
		slug: textOrNull(payload.slug) ?? '',
		description,
		released: textOrNull(payload.released),
		background_image: textOrNull(payload.background_image),
		rating: typeof payload.rating === 'number' ? payload.rating : 0,
		platforms: nameList(payload.platforms?.map((entry) => entry.platform)),
		genres: nameList(payload.genres),
		developers: nameList(payload.developers),
		publishers: nameList(payload.publishers),
	};
}