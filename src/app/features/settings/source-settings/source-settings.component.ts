import type { InventoryLoadResult, InventorySourceId } from '@core/models/inventory.model';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SOLO_PLATFORMS, type SoloPlatform } from '@core/models/solo.model';
import { InventoryStore } from '@core/stores/inventory.store';
import { SettingsStore } from '@core/stores/settings.store';
import { SoloStore } from '@core/stores/solo.store';
import { SettingsHintComponent } from '@shared/ui/settings-hint/settings-hint.component';
import { SettingsPanelComponent } from '@shared/ui/settings-panel/settings-panel.component';
import { SettingsPresetRowComponent } from '@shared/ui/settings-preset-row/settings-preset-row.component';
import { SettingsStatusComponent } from '@shared/ui/settings-status/settings-status.component';
import { SettingsSwitchComponent } from '@shared/ui/settings-switch/settings-switch.component';
import {
	TuiButton,
	TuiDataList,
	TuiDropdown,
	TuiDropdownOpen,
	TuiIcon,
	TuiInput,
	TuiOption,
	TuiTextfield,
} from '@taiga-ui/core';
import { TuiTextarea } from '@taiga-ui/kit';

const SOURCE_OPTIONS = [
	{ id: 'rggland', label: 'RGG Land' },
	{ id: 'sheets', label: 'Google Sheets' },
	{ id: 'local', label: 'Локальный JSON' },
] as const;

type SourceOption = (typeof SOURCE_OPTIONS)[number];

@Component({
	selector: 'app-source-settings',
	imports: [
		FormsModule,
		TuiButton,
		TuiIcon,
		TuiInput,
		TuiTextfield,
		TuiTextarea,
		TuiDataList,
		TuiDropdown,
		TuiDropdownOpen,
		TuiOption,
		SettingsSwitchComponent,
		SettingsPanelComponent,
		SettingsHintComponent,
		SettingsStatusComponent,
		SettingsPresetRowComponent,
	],
	templateUrl: './source-settings.component.html',
	styleUrl: './source-settings.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceSettingsComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly inventoryStore = inject(InventoryStore);
	private readonly soloStore = inject(SoloStore);

	protected readonly mode = computed(() => this.settingsStore.mode());

	protected readonly activeSource = this.settingsStore.activeSource;

	protected readonly sources = this.settingsStore.settings;

	protected readonly options = SOURCE_OPTIONS;

	protected readonly dropdownOpen = signal(false);

	protected readonly loadStatus = signal<'idle' | 'loading' | 'ok' | 'error'>('idle');

	protected readonly loadMessage = signal('');

	protected readonly localJson = signal(this.settingsStore.settings().sources.local.json);

	protected readonly selectedLabel = computed(() => {
		return SOURCE_OPTIONS.find((option) => option.id === this.activeSource())?.label ?? '';
	});

	protected selectSource(source: SourceOption): void {
		this.settingsStore.update({ activeSource: source.id });
		this.loadStatus.set('idle');
	}

	protected async loadNow(): Promise<void> {
		this.loadStatus.set('loading');
		if (this.mode() === 'solo') {
			const result = await this.soloStore.refresh();
			if (result.ok) {
				this.loadStatus.set('ok');
				const total = result.data.categories.reduce((sum, category) => sum + category.rows.length, 0);
				this.loadMessage.set(`Загружено: платформ ${result.data.categories.length}, игр: ${total}`);
			} else {
				this.loadStatus.set('error');
				this.loadMessage.set(result.error);
			}
			return;
		}
		const result: InventoryLoadResult = await this.inventoryStore.refresh();
		if (result.ok) {
			this.loadStatus.set('ok');
			const total = result.data.categories.reduce((sum, category) => sum + category.entries.length, 0);
			this.loadMessage.set(`Загружено: ${result.data.player}, записей: ${total}`);
		} else {
			this.loadStatus.set('error');
			this.loadMessage.set(result.error);
		}
	}

	protected updateRgglandNick(value: string): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			sources: { ...current.sources, rggland: { ...current.sources.rggland, nick: value } },
		}));
	}

	protected toggleRgglandFlag(flag: 'showItemTypes' | 'showNotes'): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			sources: {
				...current.sources,
				rggland: { ...current.sources.rggland, [flag]: !current.sources.rggland[flag] },
			},
		}));
	}

	protected updateSheets(config: Partial<{ spreadsheetId: string; gid: string }>): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			sources: {
				...current.sources,
				sheets: { ...current.sources.sheets, ...config },
			},
		}));
	}

	protected updateSolo(config: Partial<{ spreadsheetId: string; gid: string }>): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			sources: {
				...current.sources,
				solo: { ...current.sources.solo, ...config },
			},
		}));
	}

	protected updateSheetColumn(column: 'name' | 'category' | 'note' | 'description', value: string): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			sources: {
				...current.sources,
				sheets: {
					...current.sources.sheets,
					columns: { ...current.sources.sheets.columns, [column]: value },
				},
			},
		}));
	}

	protected updateLocalJson(value: string): void {
		this.settingsStore.updateWith((current) => ({
			...current,
			sources: { ...current.sources, local: { json: value } },
		}));
	}

	protected readonly sourceId = (source: SourceOption): InventorySourceId => source.id;

	/** Все платформы Solo-хотбара для выбора в настройках. */
	protected readonly soloPlatforms = SOLO_PLATFORMS;

	/** Текст поля «Своя платформа». */
	protected readonly customPlatformValue = signal('');

	protected readonly selectedSoloPlatforms = computed(() => this.settingsStore.settings().sources.solo.platforms);

	protected readonly customSoloPlatforms = computed(
		() => this.settingsStore.settings().sources.solo.customPlatforms,
	);

	protected readonly allSoloPlatforms = computed(() => [
		...SOLO_PLATFORMS,
		...this.customSoloPlatforms().filter((platform) => !SOLO_PLATFORMS.includes(platform)),
	]);

	protected isSoloPlatformSelected(platform: SoloPlatform): boolean {
		return this.selectedSoloPlatforms().includes(platform);
	}

	protected toggleSoloPlatform(platform: SoloPlatform): void {
		const current = this.selectedSoloPlatforms();
		const next = current.includes(platform)
			? current.filter((item) => item !== platform)
			: [...current, platform];
		this.settingsStore.updateWith((state) => ({
			...state,
			sources: {
				...state.sources,
				solo: { ...state.sources.solo, platforms: next },
			},
		}));
	}

	/** Добавляет свою платформу (в customPlatforms и сразу в выбранные). */
	protected addCustomPlatform(value: string): void {
		const name = value.trim();
		if (!name) {
			return;
		}
		const currentCustom = this.customSoloPlatforms();
		if (currentCustom.includes(name)) {
			return;
		}
		const nextCustom = [...currentCustom, name];
		const currentSelected = this.selectedSoloPlatforms();
		const nextSelected = currentSelected.includes(name) ? currentSelected : [...currentSelected, name];
		this.settingsStore.updateWith((state) => ({
			...state,
			sources: {
				...state.sources,
				solo: { ...state.sources.solo, customPlatforms: nextCustom, platforms: nextSelected },
			},
		}));
	}

	/** Удаляет свою платформу вместе с выбором. */
	protected removeCustomPlatform(platform: SoloPlatform): void {
		const nextCustom = this.customSoloPlatforms().filter((item) => item !== platform);
		const nextSelected = this.selectedSoloPlatforms().filter((item) => item !== platform);
		this.settingsStore.updateWith((state) => ({
			...state,
			sources: {
				...state.sources,
				solo: { ...state.sources.solo, customPlatforms: nextCustom, platforms: nextSelected },
			},
		}));
	}
}
