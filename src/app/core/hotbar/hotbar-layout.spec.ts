import type { HotbarBlockId, HotbarSlot } from '@app/core/models/settings.model';
import type { InventoryCategory, InventoryEntry } from '@core/models/inventory.model';
import { describe, expect, it } from 'vitest';
import { autoFitCols, moveHotbarBlock } from './hotbar-layout';
import { buildHotbarSlots, decodeHotbarDrag } from './hotbar-slots';

const base: HotbarBlockId[] = ['profile', 'inventory', 'controls'];

describe('moveHotbarBlock', () => {
	it('не меняет массив от несуществующего блока', () => {
		expect(moveHotbarBlock(base, 'controls', 2)).toEqual(base);
	});

	it('не создаёт копию при движении на своё место', () => {
		const order = moveHotbarBlock(base, 'inventory', 1);
		expect(order).toEqual(base);
		expect(order).toEqual(base);
	});

	it('двигает блок влево — освободившееся место занимает сосед', () => {
		expect(moveHotbarBlock(base, 'inventory', 0)).toEqual(['inventory', 'profile', 'controls']);
	});

	it('двигает блок вправо через несколько позиций', () => {
		expect(moveHotbarBlock(base, 'profile', 2)).toEqual(['inventory', 'controls', 'profile']);
	});

	it('двигает блок в крайнюю правую позицию', () => {
		expect(moveHotbarBlock(base, 'profile', 5)).toEqual(['inventory', 'controls', 'profile']);
	});
});

describe('autoFitCols', () => {
	it('считает колонки под доступную ширину', () => {
		// Слот 56 px + зазор 6 = 62 px на колонку.
		expect(autoFitCols(62 * 9, 56, 6, 9, 20)).toBe(9);
		expect(autoFitCols(62 * 11 - 1, 56, 6, 9, 20)).toBe(10);
		expect(autoFitCols(62 * 12, 56, 6, 9, 20)).toBe(12);
	});

	it('не опускается ниже minCols', () => {
		expect(autoFitCols(10, 56, 6, 9, 20)).toBe(9);
	});

	it('не поднимается выше maxCols', () => {
		expect(autoFitCols(9999, 56, 6, 9, 20)).toBe(20);
	});

	it('обрабатывает некорректные аргументы', () => {
		expect(autoFitCols(0, 56, 6, 9, 20)).toBe(9);
		expect(autoFitCols(500, 0, 6, 9, 20)).toBe(9);
		expect(autoFitCols(500, 56, 6, 20, 9)).toBe(20);
	});
});

function entry(name: string, quantity?: number): InventoryEntry {
	return { id: `e-${name}`, name, quantity };
}

function categories(): InventoryCategory[] {
	return [
		{ id: 'effects', title: 'Эффекты', entries: [entry('Дейликовое проклятие', 2)] },
		{ id: 'items', title: 'Обычные предметы', entries: [entry('Паук'), entry('Могвай', 3)] },
		{ id: 'specials', title: 'Спецроллы', entries: [entry('Игра от Хоста')] },
	];
}

describe('buildHotbarSlots', () => {
	const icons = (e: InventoryEntry): string | null => `icon:${e.name}`;

	it('по умолчанию строит слоты из непустых категорий в порядке инвентаря', () => {
		const slots = buildHotbarSlots(categories(), [], icons);
		expect(slots.map((s) => s.slot)).toEqual([
			{ kind: 'category', categoryId: 'effects' },
			{ kind: 'category', categoryId: 'items' },
			{ kind: 'category', categoryId: 'specials' },
		]);
		expect(slots.map((s) => s.label)).toEqual(['Эффекты', 'Обычные предметы', 'Спецроллы']);
	});

	it('считает количество как сумму quantities предметов категории', () => {
		const slots = buildHotbarSlots(categories(), [], icons);
		expect(slots[0].count).toBe(2);
		expect(slots[1].count).toBe(4);
		expect(slots[2].count).toBe(1);
	});

	it('для категории использует иконку первого предмета', () => {
		const slots = buildHotbarSlots(categories(), [], icons);
		expect(slots[0].icon).toBe('icon:Дейликовое проклятие');
		expect(slots[1].icon).toBe('icon:Паук');
	});

	it('поддерживает закреплённый предмет на конкретной позиции', () => {
		const configured: (HotbarSlot | null)[] = [
			{ kind: 'category', categoryId: 'effects' },
			{ kind: 'item', itemId: 'e-Могвай', itemName: 'Могвай' },
			{ kind: 'category', categoryId: 'specials' },
		];
		const slots = buildHotbarSlots(categories(), configured, icons);
		expect(slots[1].slot).toEqual({ kind: 'item', itemId: 'e-Могвай', itemName: 'Могвай' });
		expect(slots[1].label).toBe('Могвай');
		expect(slots[1].icon).toBe('icon:Могвай');
		expect(slots[1].count).toBe(1);
	});

	it('сохраняет пустые ячейки как null-слоты', () => {
		const configured: (HotbarSlot | null)[] = [
			{ kind: 'category', categoryId: 'effects' },
			null,
			{ kind: 'category', categoryId: 'specials' },
		];
		const slots = buildHotbarSlots(categories(), configured, icons);
		expect(slots[1].slot).toBeNull();
		expect(slots[1].label).toBe('');
		expect(slots[1].icon).toBeNull();
	});

	it('предмет не из данных: слот пустой, без «призрака»', () => {
		const configured: (HotbarSlot | null)[] = [
			{ kind: 'item', itemId: 'e-ghost', itemName: 'Призрак' },
		];
		const slots = buildHotbarSlots(categories(), configured, icons);
		expect(slots[0].slot).toBeNull();
		expect(slots[0].label).toBe('');
		expect(slots[0].icon).toBeNull();
	});
});

describe('decodeHotbarDrag', () => {
	it('читает закодированный предмет и null для мусора', () => {
		const ok = { getData: () => '{"itemId":"e-x","itemName":"X"}' } as unknown as DataTransfer;
		expect(decodeHotbarDrag(ok)).toEqual({ itemId: 'e-x', itemName: 'X' });
		expect(decodeHotbarDrag(null)).toBeNull();

		const junk = { getData: () => 'not json' } as unknown as DataTransfer;
		expect(decodeHotbarDrag(junk)).toBeNull();
	});
});