import type { HotbarBlockId } from '@app/core/models/settings.model';

/** Чистая логика раскладки хотбара: порядок блоков и авто-подгонка колонок. */

/**
 * Переставляет блок в новое место. Блок, который занимал это место,
 * «сдвигается» к освободившейся позиции (drag&drop вдоль ряда).
 */
export function moveHotbarBlock(
	order: HotbarBlockId[],
	block: HotbarBlockId,
	to: number,
): HotbarBlockId[] {
	const from = order.indexOf(block);
	if (from < 0 || from === to) {
		return [...order];
	}
	const next = [...order];
	const [moved] = next.splice(from, 1);
	next.splice(to, 0, moved);
	return next;
}

/**
 * Колонки инвентаря под доступную ширину блока.
 * От количества колонок растёт ширина блока: чем шире блок (больше свободного
 * места), тем автоматически добавляется 1–2 слота в обеих полосах.
 */
export function autoFitCols(
	availableWidth: number,
	slotSize: number,
	slotGap: number,
	minCols: number,
	maxCols: number,
): number {
	if (availableWidth <= 0 || slotSize <= 0 || minCols >= maxCols) {
		return minCols;
	}
	const perSlot = slotSize + slotGap;
	const cols = Math.floor(availableWidth / perSlot);
	return clampInt(cols, minCols, maxCols);
}

function clampInt(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(Math.floor(value), max));
}