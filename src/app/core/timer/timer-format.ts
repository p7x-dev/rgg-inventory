import type { TimerDisplayParts } from '@core/models/settings.model';
import { DEFAULT_TIMER_DISPLAY } from '@core/models/settings.model';

/**
 * Форматирует миллисекунды в строку по включённым единицам дисплея.
 * Показываются только включённые единицы, например при выключенных часах
 * выводится ММ:СС[.МММ]. Отрицательные значения срезаются до нуля.
 */
export function formatElapsed(elapsedMs: number, parts: TimerDisplayParts = DEFAULT_TIMER_DISPLAY): string {
	const totalMs = Math.max(0, elapsedMs);
	const hours = Math.floor(totalMs / 3_600_000);
	const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
	const seconds = Math.floor((totalMs % 60_000) / 1000);
	const mills = Math.floor(totalMs % 1000);
	const pad = (value: number): string => String(value).padStart(2, '0');

	const segments: string[] = [];
	if (parts.hours) {
		segments.push(pad(hours));
	}
	if (parts.minutes) {
		segments.push(pad(minutes));
	}
	if (parts.seconds) {
		segments.push(pad(seconds));
	}
	const time = segments.join(':');
	if (parts.mills) {
		const millis = String(mills).padStart(3, '0');
		return time ? `${time}.${millis}` : millis;
	}
	return time;
}

/** Преобразует чч:мм:сс в суммарное количество миллисекунд. */
export function hmsToMs(hours: number, minutes: number, seconds: number): number {
	const h = Number.isFinite(hours) ? Math.max(0, Math.floor(hours)) : 0;
	const m = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0;
	const s = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
	return (h * 3600 + m * 60 + s) * 1000;
}

/** Разворачивает миллисекунды в чч:мм:сс (положительные компоненты). */
export function msToHms(ms: number): { hours: number; minutes: number; seconds: number } {
	const totalSec = Math.max(0, Math.floor(ms / 1000));
	return {
		hours: Math.floor(totalSec / 3600),
		minutes: Math.floor((totalSec % 3600) / 60),
		seconds: totalSec % 60,
	};
}

/**
 * Отображаемое время таймера в зависимости от режима:
 * обычный отсчёт (elapsed) — просто прошедшее время;
 * обратный (countdown) — оставшееся до нуля (срезается в 0).
 */
export function timerDisplayMs(mode: 'elapsed' | 'countdown', elapsedMs: number, countdownMs: number): number {
	if (mode === 'countdown') {
		return Math.max(0, countdownMs - Math.max(0, elapsedMs));
	}
	return Math.max(0, elapsedMs);
}