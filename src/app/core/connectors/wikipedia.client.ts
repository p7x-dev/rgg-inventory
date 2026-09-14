import type { WikiGameInfo, WikiSearchResult } from '@core/models/wiki.model';
import { httpGetJson } from '@core/connectors/http.util';

/**
 * Клиент Wikipedia (русский раздел) — описание игры и ссылка на статью.
 * REST API ru.wikipedia.org открыт для CORS, запросы идут напрямую из браузера.
 */
export class WikipediaClientImpl {
	private static readonly SEARCH_URL = 'https://ru.wikipedia.org/w/api.php';

	private static readonly SUMMARY_URL = 'https://ru.wikipedia.org/api/rest_v1/page/summary';

	/** Поиск статей по названию (до 5 результатов). */
	async search(query: string): Promise<WikiSearchResult> {
		const url = new URL(WikipediaClientImpl.SEARCH_URL);
		url.searchParams.set('action', 'query');
		url.searchParams.set('list', 'search');
		url.searchParams.set('srsearch', query);
		url.searchParams.set('srlimit', '5');
		url.searchParams.set('format', 'json');
		url.searchParams.set('origin', '*');
		const payload: unknown = await httpGetJson(url.toString());
		return parseSearchResults(payload);
	}

	/** Краткое описание статьи по точному заголовку; null — страницы нет. */
	async summary(title: string): Promise<WikiGameInfo | null> {
		const payload: unknown = await httpGetJson(
			`${WikipediaClientImpl.SUMMARY_URL}/${encodeURIComponent(title.replaceAll(' ', '_'))}`,
		);
		return parseSummary(payload);
	}
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function textOrNull(value: unknown): string | null {
	return typeof value === 'string' && value.length > 0 ? value : null;
}

interface WikiSearchItem {
	title: string;
	pageid: number;
}

function isSearchItem(value: unknown): value is WikiSearchItem {
	return (
		isObject(value) &&
		typeof value['title'] === 'string' &&
		typeof value['pageid'] === 'number'
	);
}

/** Разбирает ответ /w/api.php?action=query&list=search. */
function parseSearchResults(payload: unknown): WikiSearchResult {
	if (!isObject(payload) || !isObject(payload['query']) || !Array.isArray(payload['query']['search'])) {
		return { items: [] };
	}
	return {
		items: payload['query']['search']
			.filter(isSearchItem)
			.map((item) => ({ title: item.title, pageid: item.pageid })),
	};
}

/** Разбирает ответ /api/rest_v1/page/summary/{title}. */
function parseSummary(payload: unknown): WikiGameInfo | null {
	if (!isObject(payload)) {
		return null;
	}
	const title = textOrNull(payload['title']);
	const extract = textOrNull(payload['extract']);
	if (!title || !extract) {
		return null;
	}
	const contentUrl = isObject(payload['content_urls']) ? payload['content_urls'] : null;
	const desktop = contentUrl && isObject(contentUrl['desktop']) ? contentUrl['desktop'] : null;
	const pageUrl = desktop ? textOrNull(desktop['page']) : null;
	if (!pageUrl) {
		return null;
	}
	const thumbnail =
		isObject(payload['thumbnail']) && textOrNull(payload['thumbnail']['source'])
			? textOrNull(payload['thumbnail']['source'])
			: null;
	const description = textOrNull(payload['description']);
	return {
		title,
		description: description ?? '',
		extract,
		pageUrl,
		thumbnail,
	};
}