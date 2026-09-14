import type { SoloStats } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Статистика по играм (dumb): пройдено/реролльнуто/пропущено. */
@Component({
	selector: 'app-stats-widget',
	imports: [],
	templateUrl: './stats-widget.component.html',
	styleUrl: './stats-widget.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsWidgetComponent {
	readonly stats = input.required<SoloStats>();

	/** Заголовок (платформа или «Всего»); необязателен. */
	readonly title = input<string | null>(null);
}