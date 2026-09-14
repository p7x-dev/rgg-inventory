import type { OverlaySettings, OverlayWidgets, WidgetId } from '@core/models/settings.model';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WIDGET_IDS } from '@core/models/settings.model';
import { SettingsStore } from '@core/stores/settings.store';
import { SettingsBlockComponent } from '@shared/ui/settings-block/settings-block.component';
import { SettingsColorComponent } from '@shared/ui/settings-color/settings-color.component';
import { SettingsHintComponent } from '@shared/ui/settings-hint/settings-hint.component';
import { SettingsPanelComponent } from '@shared/ui/settings-panel/settings-panel.component';
import { SettingsSliderComponent } from '@shared/ui/settings-slider/settings-slider.component';
import { SettingsSwitchComponent } from '@shared/ui/settings-switch/settings-switch.component';
import { TuiButton } from '@taiga-ui/core';
import { WidgetDragListComponent } from './widget-drag-list/widget-drag-list.component';
import { WidgetsSettingsComponent } from './widgets-settings/widgets-settings.component';

@Component({
	selector: 'app-overlay-settings',
	imports: [
		SettingsSwitchComponent,
		SettingsSliderComponent,
		SettingsColorComponent,
		SettingsPanelComponent,
		SettingsBlockComponent,
		SettingsHintComponent,
		WidgetsSettingsComponent,
		WidgetDragListComponent,
		TuiButton,
	],
	templateUrl: './overlay-settings.component.html',
	styleUrl: './overlay-settings.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlaySettingsComponent {
	private readonly settingsStore = inject(SettingsStore);

	protected readonly overlay = this.settingsStore.overlay;

	protected updateOverlay(patch: Partial<OverlaySettings>): void {
		this.settingsStore.update({ overlay: { ...this.overlay(), ...patch } });
	}

	protected setCols(value: number): void {
		this.updateOverlay({ cols: value });
	}

	protected setRows(value: number): void {
		this.updateOverlay({ rows: value });
	}

	protected setSlotSize(value: number): void {
		this.updateOverlay({ slotSize: value });
	}

	protected setRefreshInterval(value: number): void {
		this.updateOverlay({ refreshIntervalSec: value });
	}

	protected setTransparentBg(value: boolean): void {
		this.updateOverlay({ transparentBg: value });
	}

	protected setOverlayColor(value: string): void {
		this.updateOverlay({ overlayColor: value });
	}

	protected setShowTimer(value: boolean): void {
		this.updateOverlay({ showTimer: value });
	}

	protected setShowCurrencies(value: boolean): void {
		this.updateOverlay({ showCurrencies: value });
	}

	protected setPipEnabled(value: boolean): void {
		this.updateOverlay({ pipEnabled: value });
	}

	protected setTutorialEnabled(value: boolean): void {
		this.updateOverlay({ tutorialEnabled: value });
	}

	protected setWidgets(patch: Partial<OverlayWidgets>): void {
		this.updateOverlay({ widgets: { ...this.overlay().widgets, ...patch } });
	}

	protected setWidgetOrder(order: WidgetId[]): void {
		this.updateOverlay({ widgetOrder: order });
	}

	protected resetWidgetOrder(): void {
		this.updateOverlay({ widgetOrder: [...WIDGET_IDS] });
	}
}
