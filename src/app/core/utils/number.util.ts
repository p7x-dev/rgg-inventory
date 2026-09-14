/** Хелперы работы с числами. */

/** Парсит целое число из input-события; нечисло → 0. */
export function parseNumericInput(event: Event): number {
	const input = event.target;
	if (!(input instanceof HTMLInputElement)) {
		return 0;
	}
	const parsed = Number.parseInt(input.value, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

/** Ограничивает значение диапазоном [min, max]. */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** Последовательность индексов [0..count). */
export function range(count: number): number[] {
	return Array.from({ length: Math.max(0, count) }, (_, index) => index);
}