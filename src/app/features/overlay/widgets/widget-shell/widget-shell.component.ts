import type { SlotItem } from '@core/models/overlay.model';
import type { WidgetId } from '@core/models/settings.model';
import type { SoloCategory } from '@core/models/solo.model';
import type { DesignLayout } from '@core/models/theme.model';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HotbarComponent } from '@app/features/overlay/hotbar/hotbar.component';
import { OverlayTimerComponent } from '@app/features/overlay/overlay-timer/overlay-timer.component';
import { SoloHotbarComponent } from '@app/features/overlay/solo/solo-hotbar/solo-hotbar.component';
import { GameInfoWidgetComponent } from '../game-info-widget/game-info-widget.component';
import { GameTitleWidgetComponent } from '../game-title-widget/game-title-widget.component';
import { ProfileWidgetComponent } from '../profile-widget/profile-widget.component';
import { StatsWidgetComponent } from '../stats-widget/stats-widget.component';

/**
 * Рендер отдельного виджета оверлея по id (dumb-контейнер).
 * Данные приходят сверху (widgets-page), здесь только разметка.
 */
@Component({
	selector: 'app-widget-shell',
	imports: [
		HotbarComponent,
		SoloHotbarComponent,
		OverlayTimerComponent,
		GameInfoWidgetComponent,
		GameTitleWidgetComponent,
		ProfileWidgetComponent,
		StatsWidgetComponent,
	],
	templateUrl: './widget-shell.component.html',
	styleUrl: './widget-shell.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetShellComponent {
	readonly widget = input.required<WidgetId>();

	readonly soloMode = input(false);

	readonly items = input<SlotItem[]>([]);

	readonly designMode = input(false);

	readonly design = input<DesignLayout | null>(null);

	readonly cols = input(9);

	readonly visibleRows = input(2);

	readonly selectedIndex = input<number | null>(null);

	readonly category = input<SoloCategory | null>(null);

	readonly totalStats = input<{ completed: number; reroll: number; skip: number }>({
		completed: 0,
		reroll: 0,
		skip: 0,
	});

	readonly profileTitle = input('');

	readonly coins = input(0);

	readonly tears = input(0);

	readonly showCurrencies = input(true);

	readonly coinIcon = input<string | null>(null);

	readonly tearIcon = input<string | null>(null);
}