import type { SavedThemePreset } from '@core/models/settings.model';
import type { ThemePresetId } from '@core/models/theme.model';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SettingsStore } from '@core/stores/settings.store';
import { ThemeStore } from '@core/stores/theme.store';
import { TuiButton, TuiTextfield } from '@taiga-ui/core';

const PRESET_OPTIONS: readonly { id: ThemePresetId; label: string }[] = [
	{ id: 'rgg-retro', label: 'RGG Retro' },
	{ id: 'minecraft', label: 'Minecraft' },
	{ id: 'glass', label: 'Glass' },
];

/** Пресеты темы: встроенные + сохранённые пользователем (с именем). */
@Component({
	selector: 'app-theme-presets',
	imports: [TuiButton, TuiTextfield],
	templateUrl: './theme-presets.component.html',
	styleUrl: './theme-presets.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemePresetsComponent {
	private readonly settingsStore = inject(SettingsStore);
	private readonly themeStore = inject(ThemeStore);

	protected readonly presets = PRESET_OPTIONS;

	protected readonly themePreset = this.settingsStore.themePreset;

	protected readonly customDesign = this.settingsStore.customDesign;

	protected readonly savedPresets = computed(() => this.settingsStore.savedPresets() ?? []);

	protected readonly activeSavedPresetId = this.settingsStore.activeSavedPresetId;

	protected readonly isCustomTheme = computed(() => this.themePreset() === 'custom');

	protected readonly presetName = signal('');

	protected readonly presetMessage = signal<string | null>(null);

	protected readonly tokens = this.themeStore.tokens;

	protected selectPreset(preset: { id: ThemePresetId; label: string }): void {
		this.settingsStore.update({ themePreset: preset.id });
	}

	protected saveCurrentAsPreset(): void {
		const name = this.presetName().trim();
		if (!name) {
			this.presetMessage.set('Введите название пресета');
			return;
		}
		const id = `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
		const tokens = { ...this.tokens() };
		const list = [...this.savedPresets(), { id, name, tokens }];
		this.settingsStore.update({
			themePreset: 'custom',
			themeTokens: tokens,
			savedPresets: list,
			activeSavedPresetId: id,
		});
		this.presetMessage.set(`Пресет «${name}» сохранён в браузере`);
	}

	protected applySavedPreset(preset: SavedThemePreset): void {
		this.themeStore.applyTokens(preset.tokens);
		this.settingsStore.update({
			themePreset: 'custom',
			themeTokens: preset.tokens,
			activeSavedPresetId: preset.id,
		});
		this.presetMessage.set(`Применён пресет «${preset.name}»`);
	}

	protected deleteActivePreset(): void {
		const id = this.activeSavedPresetId();
		if (!id) {
			return;
		}
		const rest = this.savedPresets().filter((preset) => preset.id !== id);
		this.settingsStore.update({ savedPresets: rest, activeSavedPresetId: null });
		this.presetMessage.set('Пресет удалён');
	}

	protected setPresetName(value: string): void {
		this.presetName.set(value);
		this.presetMessage.set(null);
	}
}