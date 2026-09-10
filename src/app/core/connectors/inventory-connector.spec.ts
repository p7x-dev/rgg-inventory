import { normalizeIconName } from '@core/stores/icon.store';
import { describe, expect, it } from 'vitest';
import { normalizeInventoryJson } from './inventory-connector';

describe('normalizeInventoryJson', () => {
	it('принимает готовый InventoryData', () => {
		const data = normalizeInventoryJson({
			player: 'bradhi',
			coins: 100,
			tears: 50,
			notes: 'x',
			categories: [{ id: 'items', title: 'Обычные предметы', entries: [{ id: 'pauk', name: 'Паук' }] }],
			fetchedAt: '2026-01-01',
		});
		expect(data.categories).toHaveLength(1);
		expect(data.categories[0].entries[0].name).toBe('Паук');
	});

	it('нормализует плоский список записей по категориям', () => {
		const data = normalizeInventoryJson([
			{ name: 'Паук', category: 'items', note: 'Выкопан' },
			{ name: 'Дейликовое проклятие', category: 'effects' },
			{ name: 'Игра от Хоста', category: 'specials', description: 'приоритет' },
			{ name: 'Без категории' },
			{ name: '' },
		]);

		expect(data.categories.map((category) => category.id)).toEqual(['effects', 'items', 'specials']);
		expect(data.categories[1].entries[0].note).toBe('Выкопан');
		expect(data.categories[2].entries[0].description).toBe('приоритет');
		expect(data.categories[1].entries.map((entry) => entry.name)).toEqual(['Паук', 'Без категории']);
	});

	it('кидает ошибку на мусоре', () => {
		expect(() => normalizeInventoryJson('строка')).toThrow();
		expect(() => normalizeInventoryJson(42)).toThrow();
		expect(() => normalizeInventoryJson({ foo: 'bar' })).toThrow();
	});
});

describe('normalizeIconName', () => {
	it('сравнивает имена без регистра и спецсимволов', () => {
		expect(normalizeIconName('Паук')).toBe('паук');
		expect(normalizeIconName('  Паук!  ')).toBe('паук');
		expect(normalizeIconName('GoodBoy_TV')).toBe('goodboytv');
	});
});
