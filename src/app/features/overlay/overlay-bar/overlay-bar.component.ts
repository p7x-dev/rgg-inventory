import type { TemplateRef } from '@angular/core';
import type { SlotItem } from '@core/models/overlay.model';
import type { SoloCategory } from '@core/models/solo.model';
import type { DesignLayout } from '@core/models/theme.model';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	effect,
	inject,
	signal,
	viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HotbarComponent } from '@app/features/overlay/hotbar/hotbar.component';
import { InventoryBoardComponent } from '@app/features/overlay/inventory-board/inventory-board.component';
import { InventoryPopoverComponent } from '@app/features/overlay/inventory-popover/inventory-popover.component';
import { BarControlsComponent } from '@app/features/overlay/overlay-bar/bar-controls/bar-controls.component';
import { OverlayHeaderComponent } from '@app/features/overlay/overlay-header/overlay-header.component';
import { SoloHotbarComponent } from '@app/features/overlay/solo/solo-hotbar/solo-hotbar.component';
import { SoloPopoverComponent } from '@app/features/overlay/solo/solo-popover/solo-popover.component';
import { SettingsPopoverComponent } from '@app/features/settings/settings-popover/settings-popover.component';
import { rggCoinIcon, rggTearIcon } from '@core/icons/rgg-icons';
import { SettingsNavigationService } from '@core/services/settings-navigation.service';
import { HotkeyStore } from '@core/stores/hotkey.store';
import { IconStore } from '@core/stores/icon.store';
import { InventoryStore } from '@core/stores/inventory.store';
import { SettingsStore } from '@core/stores/settings.store';
import { SoloStore } from '@core/stores/solo.store';
import { overlayUrl } from '@core/utils/overlay';
import { TuiButton, TuiDialogService, TuiDropdown, TuiDropdownOpen } from '@taiga-ui/core';
import { finalize } from 'rxjs';

@Component({
	selector: 'app-overlay-bar',
	imports: [
		BarControlsComponent,
		HotbarComponent,
		InventoryBoardComponent,
		InventoryPopoverComponent,
		SoloHotbarComponent,
		SoloPopoverComponent,
		OverlayHeaderComponent,
		SettingsPopoverComponent,
		TuiButton,
		TuiDropdown,
		TuiDropdownOpen,
	],
	templateUrl: './overlay-bar.component.html',
	styleUrl: './overlay-bar.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayBarComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly inventoryStore = inject(InventoryStore);
	private readonly soloStore = inject(SoloStore);
	private readonly iconStore = inject(IconStore);
	private readonly hotkeyStore = inject(HotkeyStore);
	private readonly dialogService = inject(TuiDialogService);
	private readonly settingsNavigation = inject(SettingsNavigationService);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly settingsOpen = signal(false);

	protected readonly inventoryOpen = signal(false);

	protected readonly settingsPopup = viewChild.required<TemplateRef<unknown>>('settingsPopup');

	protected readonly inventoryDialog = viewChild.required<TemplateRef<unknown>>('inventoryDialog');

	/** Выбранная платформа Solo для попапа. */
	protected readonly soloDialog = viewChild.required<TemplateRef<unknown>>('soloDialog');

	/** Данные платформы, чей попап открыт (передаём через ng-template контекст). */
	protected readonly activeSoloCategory = signal<SoloCategory | null>(null);

	protected readonly selectedSlot = signal<number | null>(null);

	protected readonly soloMode = computed(() => this.settingsStore.mode() === 'solo');

	protected readonly items = computed<SlotItem[]>(() => {
		return this.inventoryStore.entries().flatMap((category) =>
			category.entries.map((entry) => ({
				entry,
				icon: this.iconStore.resolveIcon(entry),
				categoryId: category.id,
			})),
		);
	});

	protected readonly data = this.inventoryStore.data;
	protected readonly error = this.inventoryStore.error;

	protected readonly overlaySettings = this.settingsStore.overlay;

	protected readonly designMode = computed(
		() => this.settingsStore.themePreset() === 'custom' && this.settingsStore.customDesign() !== null,
	);

	protected readonly design = computed<DesignLayout | null>(() =>
		this.designMode() ? this.settingsStore.customDesign() : null,
	);

	protected readonly playerName = computed(() => {
		if (this.soloMode()) {
			return this.soloStore.data()?.player || 'Solo RGG';
		}
		return (
			(this.inventoryStore.data()?.player ?? this.settingsStore.settings().sources.rggland.nick) ||
			'Инвентарь'
		);
	});

	protected readonly coins = computed(() => this.inventoryStore.data()?.coins ?? 0);

	protected readonly tears = computed(() => this.inventoryStore.data()?.tears ?? 0);

	protected readonly visibleRows = computed(() => 2);

	protected readonly showCurrencies = computed(() => this.overlaySettings().showCurrencies);

	protected readonly coinIcon = computed(() => (this.soloMode() ? null : rggCoinIcon()));

	protected readonly tearIcon = computed(() => (this.soloMode() ? null : rggTearIcon()));

	protected readonly showTimer = computed(() => this.overlaySettings().showTimer && this.hotkeyStore.timerOn());

	protected readonly pipEnabled = computed(() => this.overlaySettings().pipEnabled);

	// Фон бара — тайговский тёмный #222 (как у страницы): блоки внутри выделяются тенями.
	protected readonly overlayBackground = computed(() => 'var(--inv-bar-bg, #222)');

	protected readonly barHidden = computed(() => !this.hotkeyStore.barOn());

	private readonly lastHotkeyToggle = signal(false);

	constructor() {
		void this.inventoryStore.refresh();
		void this.soloStore.refresh();
		void this.hotkeyStore.init();

		// Внешний запрос (баннер «Доступно скачивание») открывает настройки.
		effect(() => {
			if (this.settingsNavigation.appSectionVersion() > 0) {
				this.settingsOpen.set(true);
			}
		});

		// Глобальный/клавиатурный хоткей открывает диалог инвентаря.
		effect(() => {
			const current = this.hotkeyStore.toggle();
			if (current !== this.lastHotkeyToggle()) {
				this.lastHotkeyToggle.set(current);
				if (!this.inventoryOpen()) {
					this.openInventory();
				}
			}
		});

		// Если данные дают «выбранный» слот — показываем его постоянной подсветкой (в т.ч. в OBS).
		effect(() => {
			const fromData = this.inventoryStore.data()?.selectedSlot;
			if (typeof fromData === 'number' && fromData >= 0) {
				this.selectedSlot.set(fromData);
			}
		});
	}

	protected setSelectedSlot(index: number): void {
		this.selectedSlot.set(index);
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

	/** Открывает попап платформы Solo RGG. */
	protected openSoloPlatform(category: SoloCategory): void {
		this.activeSoloCategory.set(category);
		this.dialogService
			.open(this.soloDialog(), { size: 's', closable: false, dismissible: true })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe();
	}

	/** Открывает OBS-виджет (#/overlay) в новом окне вкладке. */
	protected openObsOverlay(): void {
		window.open(overlayUrl(), '_blank', 'noopener,noreferrer');
	}
}
