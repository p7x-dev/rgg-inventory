import type { SoloCategory, SoloPlatform } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { SOLO_PLATFORMS } from '@core/models/solo.model';
import { SettingsStore } from '@core/stores/settings.store';
import { SoloStore } from '@core/stores/solo.store';
import { SoloAddPlatformComponent } from './solo-add-platform/solo-add-platform.component';
import { SoloPlatformSlotComponent } from './solo-platform-slot/solo-platform-slot.component';

/** Максимум слотов в одном ряду соло-хотбара. */
export const SOLO_HOTBAR_COLS = 10;

/**
 * Хотбар Solo RGG: 2 ряда по 10 слотов.
 * Верхний ряд — платформы из таблицы стримера; нижний — дополнительные
 * (свои) платформы, добавляются кнопкой, удаляются крестиком.
 */
@Component({
	selector: 'app-solo-hotbar',
	imports: [SoloPlatformSlotComponent, SoloAddPlatformComponent],
	templateUrl: './solo-hotbar.component.html',
	styleUrl: './solo-hotbar.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoloHotbarComponent {
	private readonly soloStore = inject(SoloStore);
	private readonly settingsStore = inject(SettingsStore);

	/** Открыть попап с играми платформы. */
	readonly platformSelect = output<SoloCategory>();

	/** Верхний ряд: ВЫБРАННЫЕ в настройках платформы (до 10), данные из таблицы. */
	protected readonly tableCategories = computed<SoloCategory[]>(() => {
		const byPlatform = new Map<SoloPlatform, SoloCategory>(
			this.soloStore.categories().map((category) => [category.platform, category]),
		);
		const selected = this.settingsStore.settings().sources.solo.platforms.slice(0, SOLO_HOTBAR_COLS);
		return selected.map((platform) => {
			const existing = byPlatform.get(platform as SoloPlatform);
			if (existing) {
				return existing;
			}
			return {
				platform: platform as SoloPlatform,
				current: null,
				rows: [],
				stats: { completed: 0, reroll: 0, skip: 0 },
			};
		});
	});

	/** Доп. (свои) платформы из настроек (до 10). */
	protected readonly customPlatforms = computed(() =>
		this.settingsStore.settings().sources.solo.customPlatforms.slice(0, SOLO_HOTBAR_COLS),
	);

	/** Нижний ряд: категории доп. платформ (пустой слот, если данных нет). */
	protected readonly customCategories = computed<SoloCategory[]>(() => {
		const byPlatform = new Map<SoloPlatform, SoloCategory>(
			this.soloStore.categories().map((category) => [category.platform, category]),
		);
		return this.customPlatforms().map((platform) => {
			const existing = byPlatform.get(platform as SoloPlatform);
			if (existing) {
				return existing;
			}
			return {
				platform: platform as SoloPlatform,
				current: null,
				rows: [],
				stats: { completed: 0, reroll: 0, skip: 0 },
			};
		});
	});

	protected readonly loading = this.soloStore.loading;

	protected readonly error = computed(() => this.soloStore.error()?.split('.')[0] ?? '');

	protected readonly addOptions = SOLO_PLATFORMS;

	protected addCustomPlatform(platform: SoloPlatform): void {
		const current = this.customPlatforms();
		if (current.includes(platform)) {
			return;
		}
		this.settingsStore.updateWith((state) => ({
			...state,
			sources: {
				...state.sources,
				solo: { ...state.sources.solo, customPlatforms: [...current, platform] },
			},
		}));
	}

	protected removeCustomPlatform(platform: SoloPlatform): void {
		const next = this.customPlatforms().filter((item) => item !== platform);
		this.settingsStore.updateWith((state) => ({
			...state,
			sources: {
				...state.sources,
				solo: { ...state.sources.solo, customPlatforms: next },
			},
		}));
	}
}