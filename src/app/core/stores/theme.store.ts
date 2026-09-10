import type { AppSettings } from '@core/models/settings.model';
import type { ThemePresetId, ThemeTokens } from '@core/models/theme.model';
import { DestroyRef, effect, inject } from '@angular/core';
import { deriveDesignTokens } from '@core/design/design-image.service';
import { SettingsStore } from '@core/stores/settings.store';
import { FontFaceService } from '@core/theme/font-face.service';
import { THEME_PRESETS } from '@core/theme/theme.service';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';

const INITIAL = THEME_PRESETS['rgg-retro'];

interface ThemeState {
	tokens: ThemeTokens;
}

/** Кастомные поля, которые переопределяют токены, выведенные из дизайна. */
const DESIGN_OVERRIDE_KEYS: ReadonlyArray<keyof ThemeTokens> = ['coinIcon', 'tearIcon', 'fontFace'];

/**
 * Сливает ручные переопределения поверх токенов дизайна:
 * пользователь всегда может заменить иконки валют или шрифт поверх картинки.
 */
function mergeDesignOverrides(designTokens: ThemeTokens, overrides: ThemeTokens | null): ThemeTokens {
	if (!overrides) {
		return designTokens;
	}
	const merged = { ...designTokens };
	for (const key of DESIGN_OVERRIDE_KEYS) {
		const value = overrides[key];
		if (value !== null && value !== undefined) {
			(merged as Record<string, unknown>)[key] = value;
		}
	}
	return merged;
}

/** Полностью выводит токены из настроек (пресет + размер слота или кастомный дизайн). */
function tokensFromSettings(settings: AppSettings): ThemeTokens | null {
	const { themePreset, customDesign, themeTokens, overlay } = settings;
	if (themePreset === 'custom') {
		// Кастомные токены (цвета/импорт) хранятся в настройках и сохраняются в браузере.
		// Без дизайна используем их; при наличие дизайна — токены из картинки.
		if (customDesign !== null) {
			return mergeDesignOverrides(deriveDesignTokens(customDesign), themeTokens);
		}
		return themeTokens ? { ...themeTokens, slotSize: overlay.slotSize } : null;
	}
	return { ...THEME_PRESETS[themePreset], slotSize: overlay.slotSize };
}

/**
 * Активные токены темы. Питается из настроек: пресет (+ размер слота) или кастомный
 * дизайн через deriveDesignTokens. При изменении настроек токены применяются
 * автоматически. Хост-директива пишет токены в CSS-переменные.
 */
export const ThemeStore = signalStore(
	{ providedIn: 'root' },
	withState<ThemeState>({ tokens: INITIAL }),
	withMethods((store) => ({
		applyPreset(preset: Exclude<ThemePresetId, 'custom'>): void {
			patchState(store, { tokens: THEME_PRESETS[preset] });
		},
		applyTokens(tokens: ThemeTokens): void {
			patchState(store, { tokens });
		},
		applyFromSettings(settings: AppSettings): void {
			const tokens = tokensFromSettings(settings);
			if (tokens) {
				patchState(store, { tokens });
			}
		},
	})),
	withHooks({
		onInit(store) {
			const settingsStore = inject(SettingsStore);
			const fontFaceService = inject(FontFaceService);
			const destroyRef = inject(DestroyRef);
			const settingsEffect = effect(() => {
				store.applyFromSettings(settingsStore.settings());
			});
			const fontEffect = effect(() => {
				fontFaceService.apply(store.tokens().fontFace ?? null);
			});
			destroyRef.onDestroy(() => {
				settingsEffect.destroy();
				fontEffect.destroy();
				fontFaceService.remove();
			});
		},
	}),
);
