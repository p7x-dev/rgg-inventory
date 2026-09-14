import { isWidgetId } from '@core/models/settings.model';
import { describe, expect, it } from 'vitest';
import { widgetIdFromUrl, widgetUrl } from './overlay';

describe('widgetIdFromUrl', () => {
	it('извлекает id из URL вида #/widget/<id>', () => {
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/inventory')).toBe('inventory');
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/gameInfo')).toBe('gameInfo');
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/gameTitle')).toBe('gameTitle');
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/stats')).toBe('stats');
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/timer')).toBe('timer');
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/profile')).toBe('profile');
	});

	it('не отрезает первый символ id (регрессия off-by-one)', () => {
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/gameInfo')).toBe('gameInfo');
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/gameInfo')).not.toBe('ameInfo');
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/timer')).toBe('timer');
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/timer')).not.toBe('imer');
	});

	it('принимает хэш без origin', () => {
		expect(widgetIdFromUrl('#/widget/stats')).toBe('stats');
	});

	it('возвращает null для неизвестного id', () => {
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/foo')).toBeNull();
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/game-info')).toBeNull();
		expect(widgetIdFromUrl('http://localhost:3000/#/widget/')).toBeNull();
	});

	it('возвращает null для не-виджетных URL', () => {
		expect(widgetIdFromUrl('')).toBeNull();
		expect(widgetIdFromUrl('http://localhost:3000/')).toBeNull();
		expect(widgetIdFromUrl('http://localhost:3000/#/overlay')).toBeNull();
		expect(widgetIdFromUrl('http://localhost:3000/#/')).toBeNull();
	});
});

describe('widgetUrl', () => {
	it('строит URL виджета на базе текущего origin', () => {
		const base = `${window.location.origin}${window.location.pathname}`;
		expect(widgetUrl('timer')).toBe(`${base}#/widget/timer`);
	});
});

describe('isWidgetId', () => {
	it('распознаёт известные id', () => {
		for (const id of ['inventory', 'gameInfo', 'gameTitle', 'stats', 'timer', 'profile']) {
			expect(isWidgetId(id)).toBe(true);
		}
	});

	it('отклоняет неизвестные значения', () => {
		expect(isWidgetId('')).toBe(false);
		expect(isWidgetId('foo')).toBe(false);
		expect(isWidgetId('game-info')).toBe(false);
		expect(isWidgetId('Inventory')).toBe(false);
	});
});