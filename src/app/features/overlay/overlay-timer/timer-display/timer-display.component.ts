import type { TimerDisplayParts } from '@core/models/settings.model';
import type { TimerSnapshot } from '@core/models/timer.model';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DEFAULT_TIMER_DISPLAY } from '@core/models/settings.model';
import { formatElapsed } from '@core/timer/timer-format';
import { TuiIcon } from '@taiga-ui/core';

/**
 * Цифровой дисплей таймера. Состояние (идёт/пауза) передаётся цветом цифр
 * через css-переменные темы, а не текстом.
 */
@Component({
	selector: 'app-timer-display',
	imports: [TuiIcon],
	templateUrl: './timer-display.component.html',
	styleUrl: './timer-display.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerDisplayComponent {
	readonly snapshot = input.required<TimerSnapshot>();

	readonly parts = input<TimerDisplayParts>(DEFAULT_TIMER_DISPLAY);

	/** Отображаемое время (для countdown — остаток, иначе — прошедшее). */
	readonly displayMs = input(0);

	protected readonly formatted = computed(() => formatElapsed(this.displayMs(), this.parts()));

	protected readonly isBot = computed(() => this.snapshot().source === 'bot');
}