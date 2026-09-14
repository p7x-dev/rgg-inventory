import type { TemplateRef } from '@angular/core';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InventoryBoardComponent } from '@app/features/overlay/inventory-board/inventory-board.component';
import { InventoryPopoverComponent } from '@app/features/overlay/inventory-popover/inventory-popover.component';
import { BarControlsComponent } from '@app/features/overlay/overlay-bar/bar-controls/bar-controls.component';
import { OverlayHeaderComponent } from '@app/features/overlay/overlay-header/overlay-header.component';
import { SettingsPopoverComponent } from '@app/features/settings/settings-popover/settings-popover.component';
import { HotkeyStore } from '@core/stores/hotkey.store';
import { IconStore } from '@core/stores/icon.store';
import { InventoryStore } from '@core/stores/inventory.store';
import { SettingsStore } from '@core/stores/settings.store';
import { overlayUrl } from '@core/utils/overlay';
import { buildOverlayView } from '@core/utils/overlay-view';
import { TuiButton, TuiDialogService, TuiDropdown, TuiDropdownOpen } from '@taiga-ui/core';
import { finalize } from 'rxjs';

@Component({
	selector: 'app-overlay-page',
	imports: [
		BarControlsComponent,
		InventoryBoardComponent,
		InventoryPopoverComponent,
		OverlayHeaderComponent,
		SettingsPopoverComponent,
		TuiButton,
		TuiDropdown,
		TuiDropdownOpen,
	],
	templateUrl: './overlay-page.component.html',
	styleUrl: './overlay-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[style.background]': 'overlayBackground()',
	},
})
export class OverlayPageComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly inventoryStore = inject(InventoryStore);
	private readonly iconStore = inject(IconStore);
	private readonly hotkeyStore = inject(HotkeyStore);
	private readonly dialogService = inject(TuiDialogService);
	private readonly destroyRef = inject(DestroyRef);

	private readonly view = buildOverlayView(this.settingsStore, this.inventoryStore, this.iconStore);

	protected readonly items = this.view.items;

	protected readonly data = this.inventoryStore.data;
	protected readonly error = this.inventoryStore.error;

	protected readonly overlaySettings = this.settingsStore.overlay;

	protected readonly designMode = this.view.designMode;

	protected readonly design = this.view.design;

	protected readonly playerName = this.view.playerName;

	protected readonly coins = this.view.coins;

	protected readonly tears = this.view.tears;

	protected readonly visibleRows = this.view.visibleRows;

	protected readonly showTimer = computed(() => this.overlaySettings().showTimer);

	protected readonly showCurrencies = computed(() => this.overlaySettings().showCurrencies);

	protected readonly pipEnabled = computed(() => this.overlaySettings().pipEnabled);

	protected readonly overlayBackground = computed(() =>
		this.overlaySettings().transparentBg ? 'transparent' : 'var(--inv-background)',
	);

	protected readonly settingsOpen = signal(false);

	protected readonly inventoryOpen = signal(false);

	protected readonly settingsPopup = viewChild.required<TemplateRef<unknown>>('settingsPopup');

	protected readonly inventoryDialog = viewChild.required<TemplateRef<unknown>>('inventoryDialog');

	constructor() {
		void this.inventoryStore.refresh();
		void this.hotkeyStore.init();
	}

	protected openInventory(): void {
		if (this.inventoryOpen()) {
			return;
		}
		this.inventoryOpen.set(true);
		this.dialogService
			.open(this.inventoryDialog(), { size: 'm', closable: false, dismissible: true })
			.pipe(
				takeUntilDestroyed(this.destroyRef),
				finalize(() => this.inventoryOpen.set(false)),
			)
			.subscribe();
	}

	/** Открывает OBS-виджет (#/overlay) в новом окне вкладке. */
	protected openObsOverlay(): void {
		window.open(overlayUrl(), '_blank', 'noopener,noreferrer');
	}
}
