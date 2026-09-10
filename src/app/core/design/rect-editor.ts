/** Проценты от ширины/высоты картинки (0..100), чтобы редактор не зависел от пикселей. */
export interface PercentRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

/** Где пользователь схватился за прямоугольник. */
export type DragMode =
	| 'move'
	| 'resize-e'
	| 'resize-w'
	| 'resize-n'
	| 'resize-s'
	| 'resize-ne'
	| 'resize-nw'
	| 'resize-se'
	| 'resize-sw';

export const MIN_RECT_PERCENT = 1;

/** Сдвигает прямоугольник, не давая выйти за границы холста (0..100). */
export function moveRect(
	rect: PercentRect,
	dx: number,
	dy: number,
	canvasWidth: number,
	canvasHeight: number,
): PercentRect {
	const right = clamp(rect.left + rect.width + dx, 0, canvasWidth);
	const bottom = clamp(rect.top + rect.height + dy, 0, canvasHeight);
	const nextLeft = clamp(right - rect.width, 0, canvasWidth);
	const nextTop = clamp(bottom - rect.height, 0, canvasHeight);
	return { ...rect, left: nextLeft, top: nextTop };
}

/** Ресайзит прямоугольник из заданного угла/ребра с сохранением позиции противоположной стороны. */
export function resizeRect(
	rect: PercentRect,
	mode: Exclude<DragMode, 'move'>,
	dx: number,
	dy: number,
	canvasWidth: number,
	canvasHeight: number,
): PercentRect {
	const min = MIN_RECT_PERCENT;
	const dragLeft = mode === 'resize-w' || mode === 'resize-nw' || mode === 'resize-sw';
	const dragRight = mode === 'resize-e' || mode === 'resize-ne' || mode === 'resize-se';
	const dragTop = mode === 'resize-n' || mode === 'resize-ne' || mode === 'resize-nw';
	const dragBottom = mode === 'resize-s' || mode === 'resize-se' || mode === 'resize-sw';

	const nextLeft = dragLeft
		? clampShrinking(rect.left + rect.width, rect.left + dx, min)
		: rect.left;
	const nextRight = dragRight
		? clampGrowing(rect.left, rect.left + rect.width + dx, min, canvasWidth)
		: rect.left + rect.width;
	const nextTop = dragTop
		? clampShrinking(rect.top + rect.height, rect.top + dy, min)
		: rect.top;
	const nextBottom = dragBottom
		? clampGrowing(rect.top, rect.top + rect.height + dy, min, canvasHeight)
		: rect.top + rect.height;

	return {
		left: nextLeft,
		top: nextTop,
		width: nextRight - nextLeft,
		height: nextBottom - nextTop,
	};
}

/** Минимальный наклон ребра для срабатывания ресайза (в px, приведено к процентам при масштабировании). */
export const RESIZE_HIT_DISTANCE = 6;

/**
 * Определяет режим по точке (в px внутри контейнера) с учётом масштаба.
 * Возвращает 'move', либо один из углов/ребёр, либо null — мимо.
 */
export function hitTest(
	x: number,
	y: number,
	rectPx: { left: number; top: number; width: number; height: number },
	hitDistance: number,
): DragMode | null {
	const nearLeft = Math.abs(x - rectPx.left) <= hitDistance;
	const nearRight = Math.abs(x - (rectPx.left + rectPx.width)) <= hitDistance;
	const nearTop = Math.abs(y - rectPx.top) <= hitDistance;
	const nearBottom = Math.abs(y - (rectPx.top + rectPx.height)) <= hitDistance;
	const insideX = x >= rectPx.left && x <= rectPx.left + rectPx.width;
	const insideY = y >= rectPx.top && y <= rectPx.top + rectPx.height;

	if (nearLeft && nearTop) return 'resize-nw';
	if (nearRight && nearTop) return 'resize-ne';
	if (nearLeft && nearBottom) return 'resize-sw';
	if (nearRight && nearBottom) return 'resize-se';
	if (nearLeft && insideY) return 'resize-w';
	if (nearRight && insideY) return 'resize-e';
	if (nearTop && insideX) return 'resize-n';
	if (nearBottom && insideX) return 'resize-s';
	if (insideX && insideY) return 'move';
	return null;
}

/** Нейтральный режим ресайза из 'move' (для стрелок) — по умолчанию se. */
export function asResize(mode: DragMode): Exclude<DragMode, 'move'> {
	return mode === 'move' ? 'resize-se' : mode;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/** Ребро растёт от anchor: не может пересечь его, но может достичь правого края. */
function clampGrowing(anchor: number, proposed: number, min: number, canvasSize: number): number {
	const minAllowed = Math.min(anchor + min, canvasSize);
	return clamp(proposed, minAllowed, canvasSize);
}

/** Ребро сжимается к anchor: не может пересечь его, но может достичь левого края. */
function clampShrinking(anchor: number, proposed: number, min: number): number {
	const maxAllowed = Math.max(0, anchor - min);
	return clamp(proposed, 0, maxAllowed);
}

/** Ограничивает прямоугольник холстом и минимальным размером. */
export function clampRect(
	rect: PercentRect,
	canvasWidth: number,
	canvasHeight: number,
	min = MIN_RECT_PERCENT,
): PercentRect {
	const left = clamp(rect.left, 0, Math.max(0, canvasWidth - min));
	const top = clamp(rect.top, 0, Math.max(0, canvasHeight - min));
	const width = clamp(rect.width, min, canvasWidth - Math.max(0, left));
	const height = clamp(rect.height, min, canvasHeight - Math.max(0, top));
	return { left, top, width, height };
}