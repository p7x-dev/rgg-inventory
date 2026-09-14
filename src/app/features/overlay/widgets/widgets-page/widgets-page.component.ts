import type { WidgetId } from '@core/models/settings.model';
import type { SoloCategory } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rggCoinIcon, rggTearIcon } from '@core/icons/rgg-icons';
import { IconStore } from '@core/stores/icon.store';
import { InventoryStore } from '@core/stores/inventory.store';
import { SettingsStore } from '@core/stores/settings.store';
import { SoloStore } from '@core/stores/solo.store';
import { buildOverlayView } from '@core/utils/overlay-view';
import { WidgetShellComponent } from '../widget-shell/widget-shell.component';

/** Страница отдельного виджета (#/widget/<id>): собирает данные из сторов. */
@Component({
	selector: 'app-widgets-page',
	imports: [WidgetShellComponent],
	templateUrl: './widgets-page.component.html',
	styleUrl: './widgets-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetsPageComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly inventoryStore = inject(InventoryStore);
	private readonly iconStore = inject(IconStore);
	private readonly soloStore = inject(SoloStore);

	private readonly view = buildOverlayView(this.settingsStore, this.inventoryStore, this.iconStore);

	readonly widget = input.required<WidgetId>();

	protected readonly soloMode = computed(() => this.settingsStore.mode() === 'solo');

	protected readonly items = this.view.items;

	protected readonly designMode = this.view.designMode;

	protected readonly design = this.view.design;

	protected readonly cols = computed(() => this.settingsStore.overlay().cols);

	protected readonly visibleRows = this.view.visibleRows;

	/** Активная платформа соло: первая непустая (с текущей игрой). */
	protected readonly soloCategory = computed<SoloCategory | null>(() => {
		if (!this.soloMode()) {
			return null;
		}
		return (
			this.soloStore.categories().find((category) => category.current !== null) ??
			this.soloStore.categories()[0] ??
			null
		);
	});

	/** Суммарная статистика по всем платформам соло. */
	protected readonly totalStats = computed(() => {
		const totals = { completed: 0, reroll: 0, skip: 0 };
		for (const category of this.soloStore.categories()) {
			totals.completed += category.stats.completed;
			totals.reroll += category.stats.reroll;
			totals.skip += category.stats.skip;
		}
		return totals;
	});

	protected readonly profileTitle = computed(() =>
		this.soloMode() ? this.soloStore.data()?.player || 'Solo RGG' : this.view.playerName(),
	);

	protected readonly coins = this.view.coins;

	protected readonly tears = this.view.tears;

	protected readonly showCurrencies = computed(
		() => this.settingsStore.overlay().showCurrencies && !this.soloMode(),
	);

	protected readonly coinIcon = computed(() => (this.soloMode() ? null : rggCoinIcon()));

	protected readonly tearIcon = computed(() => (this.soloMode() ? null : rggTearIcon()));

	constructor() {
		void this.inventoryStore.refresh();
		void this.soloStore.refresh();
	}
}