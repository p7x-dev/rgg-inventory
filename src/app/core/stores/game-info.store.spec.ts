import { describe, expect, it } from 'vitest';
import { normalizeGameKey, pickBestMatch, pickBestWikiMatch } from './game-info.store';

describe('normalizeGameKey', () => {
	it('приводит имя к нижнему регистру без пробелов по краям', () => {
		expect(normalizeGameKey('  Chrono Trigger  ')).toBe('chrono trigger');
	});

	it('возвращает пустую строку для пустого имени', () => {
		expect(normalizeGameKey('')).toBe('');
	});
});

describe('pickBestMatch', () => {
	const games = [
		{
			id: 1,
			name: 'Chrono Trigger',
			slug: 'chrono-trigger',
			released: null,
			background_image: null,
			rating: 0,
			platforms: [],
			genres: [],
		},
		{
			id: 2,
			name: 'Chrono Cross',
			slug: 'chrono-cross',
			released: null,
			background_image: null,
			rating: 0,
			platforms: [],
			genres: [],
		},
	];

	it('выбирает точное совпадение по имени (без учёта регистра)', () => {
		const best = pickBestMatch(games, 'chrono trigger');
		expect(best?.id).toBe(1);
	});

	it('выбирает первый результат, если точного совпадения нет', () => {
		const best = pickBestMatch(games, 'trigger');
		expect(best?.id).toBe(1);
	});

	it('возвращает null для пустого списка', () => {
		expect(pickBestMatch([], 'Chrono Trigger')).toBeNull();
	});
});

describe('pickBestWikiMatch', () => {
	const items = [{ title: 'Chrono Trigger' }, { title: 'Chrono Cross' }];

	it('выбирает точное совпадение по названию (без учёта регистра)', () => {
		const best = pickBestWikiMatch(items, 'chrono trigger');
		expect(best?.title).toBe('Chrono Trigger');
	});

	it('выбирает первый результат, если точного совпадения нет', () => {
		const best = pickBestWikiMatch(items, 'trigger');
		expect(best?.title).toBe('Chrono Trigger');
	});

	it('возвращает null для пустого списка', () => {
		expect(pickBestWikiMatch([], 'Chrono Trigger')).toBeNull();
	});
});