/**
 * Модели данных Wikipedia REST API (ru.wikipedia.org) для информации об игре.
 * Эндпоинты: /api/rest_v1/page/summary/{title}, /w/api.php?action=query&list=search.
 */

/** Краткая информация об игре из Wikipedia. */
export interface WikiGameInfo {
	title: string;
	/** Человеческое описание (вступление статьи, plain text). */
	description: string;
	/** Короткая подпись статьи («компьютерная игра 1995 года»). */
	extract: string;
	/** Ссылка на статью. */
	pageUrl: string;
	/** Миниатюра обложки (если есть). */
	thumbnail: string | null;
}

/** Результат поиска страниц Wikipedia. */
export interface WikiSearchResult {
	items: { title: string; pageid: number }[];
}