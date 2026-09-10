import { formatElapsed, parseBotTimerWidget } from '@core/stores/timer.store';
import { describe, expect, it } from 'vitest';

describe('formatElapsed', () => {
	it('форматирует HH:MM:SS с ведущими нулями', () => {
		expect(formatElapsed(0)).toBe('00:00:00');
		expect(formatElapsed(1000)).toBe('00:00:01');
		expect(formatElapsed(59 * 1000)).toBe('00:00:59');
		expect(formatElapsed(60 * 1000)).toBe('00:01:00');
		expect(formatElapsed((8 * 3600 + 2 * 60 + 3) * 1000)).toBe('08:02:03');
	});

	it('не уходит в минус и обрезает миллисекунды', () => {
		expect(formatElapsed(-5000)).toBe('00:00:00');
		expect(formatElapsed(1500)).toBe('00:00:01');
	});
});

describe('parseBotTimerWidget', () => {
	it('читает data-атрибуты виджета бота', () => {
		const widget = parseBotTimerWidget(
			'<html><body><p id="timer" data-nick="bradhi" data-name="main" '
			+ 'data-time="28809.08" data-status="1">00:00:00</p></body></html>',
			'main',
		);
		expect(widget.nick).toBe('bradhi');
		expect(widget.name).toBe('main');
		expect(widget.running).toBe(true);
		expect(widget.elapsedMs).toBeCloseTo(28809.08 * 1000);
	});

	it('кидает ошибку, если виджета нет', () => {
		expect(() => parseBotTimerWidget('<html><body>404</body></html>', 'main')).toThrow('не найден');
	});
});