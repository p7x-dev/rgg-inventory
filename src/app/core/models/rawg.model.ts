/**
 * Модели данных RAWG API (rawg.io) для детальной страницы игры.
 * Эндпоинты: /api/games?search=..., /api/games/{id}.
 */

/** Игра из результатов поиска (краткая карточка). */
export interface RawgGameSummary {
	id: number;
	name: string;
	slug: string;
	released: string | null;
	background_image: string | null;
	rating: number;
	platforms: string[];
	genres: string[];
}

/** Полная информация об игре (детальная страница). */
export interface RawgGameDetail {
	id: number;
	name: string;
	slug: string;
	/** Человеческое описание без HTML-тегов. */
	description: string;
	released: string | null;
	background_image: string | null;
	rating: number;
	platforms: string[];
	genres: string[];
	developers: string[];
	publishers: string[];
}

/** Поиск игры: результат со всеми найденными вариантами. */
export interface RawgSearchResult {
	games: RawgGameSummary[];
}