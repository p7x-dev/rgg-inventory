import type { RggCatalogItem } from '@core/services/rgg-icon.service';
import type { IconImportReport } from '@core/stores/icon.store';
import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RggIconService } from '@core/services/rgg-icon.service';
import { IconStore, normalizeIconName } from '@core/stores/icon.store';
import { InventoryStore } from '@core/stores/inventory.store';
import { SettingsStore } from '@core/stores/settings.store';
import { selectedFile } from '@core/utils/file.util';
import { SettingsActionsComponent } from '@shared/ui/settings-actions/settings-actions.component';
import { SettingsBlockComponent } from '@shared/ui/settings-block/settings-block.component';
import { SettingsHintComponent } from '@shared/ui/settings-hint/settings-hint.component';
import { SettingsPanelComponent } from '@shared/ui/settings-panel/settings-panel.component';
import { SettingsStatusComponent } from '@shared/ui/settings-status/settings-status.component';
import { TuiButton, TuiDataList, TuiDropdown, TuiDropdownOpen, TuiIcon, TuiOption, TuiTextfield } from '@taiga-ui/core';

@Component({
	selector: 'app-icon-settings',
	imports: [
		TuiButton,
		TuiIcon,
		TuiTextfield,
		TuiDataList,
		TuiDropdown,
		TuiDropdownOpen,
		TuiOption,
		KeyValuePipe,
		SettingsPanelComponent,
		SettingsBlockComponent,
		SettingsHintComponent,
		SettingsActionsComponent,
		SettingsStatusComponent,
	],
	templateUrl: './icon-settings.component.html',
	styleUrl: './icon-settings.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconSettingsComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly inventoryStore = inject(InventoryStore);
	private readonly iconStore = inject(IconStore);
	private readonly rggIconService = inject(RggIconService);

	protected readonly icons = this.settingsStore.icons;
	protected readonly hasIcons = computed(() => Object.keys(this.icons()).length > 0);

	protected readonly itemNames = computed(() =>
		this.inventoryStore.entries().flatMap((category) => category.entries.map((entry) => entry.name)),
	);

	protected readonly selectedItem = signal('');

	protected readonly selectedItemOpen = signal(false);

	protected readonly catalog = signal<RggCatalogItem[]>([]);

	protected readonly catalogLoading = signal(false);

	protected readonly catalogError = signal<string | null>(null);

	protected readonly importReport = signal<IconImportReport | null>(null);

	protected readonly importError = signal<string | null>(null);

	protected readonly itemNamesForZip = computed(() => this.itemNames());

	protected selectItem(name: string): void {
		this.selectedItem.set(name);
	}

	protected async loadCatalog(): Promise<void> {
		const nick = this.settingsStore.settings().sources.rggland.nick;
		this.catalogLoading.set(true);
		this.catalogError.set(null);
		try {
			this.catalog.set(await this.rggIconService.fetchCatalog(nick));
		} catch (error) {
			this.catalogError.set(error instanceof Error ? error.message : 'Каталог недоступен');
		} finally {
			this.catalogLoading.set(false);
		}
	}

	protected autoAssignFromCatalog(): void {
		const itemByName = new Map(this.itemNames().map((name) => [normalizeIconName(name), name]));
		for (const item of this.catalog()) {
			const matched = itemByName.get(normalizeIconName(item.name));
			if (matched) {
				this.iconStore.setIcon(matched, item.url);
			}
		}
	}

	protected assignCatalogItem(item: RggCatalogItem): void {
		const target = this.selectedItem().trim();
		if (target) {
			this.iconStore.setIcon(target, item.url);
			return;
		}
		const matched = this.itemNames().find((name) => normalizeIconName(name) === normalizeIconName(item.name));
		if (matched) {
			this.iconStore.setIcon(matched, item.url);
		}
	}

	protected async onZipSelected(event: Event): Promise<void> {
		const file = selectedFile(event);
		if (!file) {
			return;
		}
		this.importReport.set(null);
		this.importError.set(null);
		try {
			this.importReport.set(await this.iconStore.importZipPack(file, this.itemNamesForZip()));
		} catch (error) {
			this.importError.set(error instanceof Error ? error.message : 'Не удалось импортировать пак');
		}
	}

	protected async onSingleIconSelected(event: Event): Promise<void> {
		const file = selectedFile(event);
		if (!file) {
			return;
		}
		const target = this.selectedItem().trim();
		if (!target) {
			this.importError.set('Сначала выберите предмет из списка');
			return;
		}
		this.importError.set(null);
		try {
			await this.iconStore.importSingleIcon(file, target);
			this.importReport.set({ matched: [target], unknown: [] });
		} catch (error) {
			this.importError.set(error instanceof Error ? error.message : 'Не удалось загрузить иконку');
		}
	}

	protected removeIcon(itemName: string): void {
		this.iconStore.clearIcon(itemName);
	}
}
