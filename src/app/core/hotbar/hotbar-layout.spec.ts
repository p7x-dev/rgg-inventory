import type { HotbarBlockId } from '@app/core/models/settings.model';
import { describe, expect, it } from 'vitest';
import { autoFitCols, moveHotbarBlock } from './hotbar-layout';

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