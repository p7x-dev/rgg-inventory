import type { WidgetId } from '@core/models/settings.model';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TuiButton, TuiIcon } from '@taiga-ui/core';

const WIDGET_LABELS: Record<WidgetId, string> = {
	inventory: 'Инвентарь',
	gameInfo: 'Информация об игре',
	gameTitle: 'Название игры',
	stats: 'Статистика',
	timer: 'Таймер',
	profile: 'Профиль',
};

/** Перетаскиваемый список виджетов бара (dumb): reorder + сброс. */
@Component({
	selector: 'app-widget-drag-list',
	imports: [TuiButton, TuiIcon],
	templateUrl: './widget-drag-list.component.html',
	styleUrl: './widget-drag-list.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetDragListComponent {
	readonly order = input.required<WidgetId[]>();

	readonly orderChange = output<WidgetId[]>();

	readonly reset = output<void>();

	protected readonly items = computed(() =>
		this.order().map((id) => ({ id, label: WIDGET_LABELS[id] })),
	);

	protected onDragStart(event: DragEvent, index: number): void {
		event.dataTransfer?.setData('application/x-rgg-widget', String(index));
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	protected onDragOver(event: DragEvent): void {
		if (event.dataTransfer?.types.includes('application/x-rgg-widget')) {
			event.preventDefault();
		}
	}

	protected onDrop(event: DragEvent, targetIndex: number): void {
		const raw = event.dataTransfer?.getData('application/x-rgg-widget');
		if (raw === undefined || raw === '') {
			return;
		}
		const sourceIndex = Number.parseInt(raw, 10);
		if (!Number.isFinite(sourceIndex) || sourceIndex === targetIndex) {
			return;
		}
		const list = [...this.order()];
		const [moved] = list.splice(sourceIndex, 1);
		if (!moved) {
			return;
		}
		list.splice(targetIndex, 0, moved);
		this.orderChange.emit(list);
	}
}