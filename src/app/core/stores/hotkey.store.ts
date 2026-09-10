import { computed } from '@angular/core';
import { isTauri } from '@core/utils/platform';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

/** Формат сокращения Tauri global-shortcut, напр. 'CmdOrCtrl+Shift+I'. */
export type Hotkey = string;

/** Идентификаторы действий оверлея, которые переключаются хоткеем. */
export const HOTKEY_ACTION = {
	inventory: 'inventory',
	timer: 'timer',
	bar: 'bar',
} as const;

export type HotkeyAction = (typeof HOTKEY_ACTION)[keyof typeof HOTKEY_ACTION];

/** Дефолтные сочетания: инвентарь, таймер, показ/скрытие бара. */
export const DEFAULT_HOTKEYS: Record<HotkeyAction, Hotkey> = {
	inventory: 'CmdOrCtrl+Shift+I',
	timer: 'CmdOrCtrl+Shift+T',
	bar: 'CmdOrCtrl+Shift+O',
};

export const DEFAULT_HOTKEY: Hotkey = DEFAULT_HOTKEYS.inventory;

interface ShortcutApi {
	register: (hotkey: Hotkey, handler: () => void) => Promise<void>;
	unregister: (hotkey: Hotkey) => Promise<void>;
}

interface HotkeyState {
	toggle: boolean;
	timerOn: boolean;
	barOn: boolean;
	api: ShortcutApi | null;
	hotkeys: Record<HotkeyAction, Hotkey>;
	registered: boolean;
}

/**
 * Горячие клавиши оверлея.
 *
 * Внутри Tauri — глобальные хоткеи (плагин global-shortcut): срабатывают из любого
 * окна и игры. В браузере (OBS-виджет или dev-режим) — слушатель keydown на документе.
 * Плагин подгружается лениво, поэтому десктопная сборка и OBS-виджет используют общий код.
 */
export const HotkeyStore = signalStore(
	{ providedIn: 'root' },
	withState<HotkeyState>({
		toggle: false,
		timerOn: true,
		barOn: true,
		api: null,
		hotkeys: { ...DEFAULT_HOTKEYS },
		registered: false,
	}),
	withMethods((store) => {
		const flip = (action: HotkeyAction): void => {
			if (action === HOTKEY_ACTION.inventory) {
				patchState(store, { toggle: !store.toggle() });
			} else if (action === HOTKEY_ACTION.timer) {
				patchState(store, { timerOn: !store.timerOn() });
			} else {
				patchState(store, { barOn: !store.barOn() });
			}
		};

		const bindings = computed(() => {
			const hotkeys = store.hotkeys();
			return (Object.keys(hotkeys) as HotkeyAction[]).map((action) => ({
				hotkey: hotkeys[action],
				action,
			}));
		});

		const registerFromState = async (): Promise<void> => {
			const api = store.api();
			if (!api || store.registered()) {
				return;
			}
			for (const { hotkey, action } of bindings()) {
				await api.register(hotkey, () => flip(action));
			}
			patchState(store, { registered: true });
		};

		const unregisterFromState = async (): Promise<void> => {
			const api = store.api();
			if (!api || !store.registered()) {
				return;
			}
			for (const { hotkey } of bindings()) {
				await api.unregister(hotkey);
			}
			patchState(store, { registered: false });
		};

		const bindBrowserKeys = (): void => {
			window.addEventListener('keydown', (event: KeyboardEvent) => {
				const binding = bindings().find(({ hotkey }) => matches(hotkey, event));
				if (!binding) {
					return;
				}
				event.preventDefault();
				flip(binding.action);
			});
		};

		const loadApi = async (): Promise<void> => {
			try {
				const mod = (await import('@tauri-apps/plugin-global-shortcut')) as ShortcutApi;
				patchState(store, { api: mod });
				await registerFromState();
			} catch {
				bindBrowserKeys();
			}
		};

		return {
			/** Инициализация при старте приложения. */
			async init(hotkeys: Partial<Record<HotkeyAction, Hotkey>> = {}): Promise<void> {
				patchState(store, { hotkeys: { ...DEFAULT_HOTKEYS, ...hotkeys } });
				if (isTauri()) {
					await loadApi();
				} else {
					bindBrowserKeys();
				}
			},
			/** Перерегистрировать хоткеи (например, после смены в настройках). */
			async setHotkeys(hotkeys: Partial<Record<HotkeyAction, Hotkey>>): Promise<void> {
				await unregisterFromState();
				patchState(store, { hotkeys: { ...store.hotkeys(), ...hotkeys } });
				if (isTauri()) {
					await registerFromState();
				}
			},
			/** Ручное переключение (например, клик по инвентарю в баре). */
			notifyToggle(): void {
				flip(HOTKEY_ACTION.inventory);
			},
		};
	}),
);

function matches(hotkey: Hotkey, event: KeyboardEvent): boolean {
	const keys = hotkey.toLowerCase().split('+').map((part) => part.trim());
	const modifiers = ['ctrl', 'alt', 'shift', 'meta', 'cmd', 'cmdorctrl', 'command', 'control'];
	const isCtrl = keys.includes('ctrl') || keys.includes('cmdorctrl');
	const isAlt = keys.includes('alt');
	const isShift = keys.includes('shift');
	const isMeta = keys.includes('meta') || keys.includes('cmd') || keys.includes('cmdorctrl');
	const key = keys.find((part) => !modifiers.includes(part));

	if (isCtrl !== event.ctrlKey && !isMeta) {
		return false;
	}
	if (isAlt !== event.altKey) {
		return false;
	}
	if (isShift !== event.shiftKey) {
		return false;
	}
	return Boolean(key) && event.key.toLowerCase() === key;
}