import type { BotTimerWidget, BotWsEvent, TimerSnapshot } from '@core/models/timer.model';
import type { Subscription } from 'rxjs';
import { computed, DestroyRef, effect, inject } from '@angular/core';
import { httpGetText, rggBotOrigin, rggBotWsUrl } from '@core/connectors/http.util';
import { DEFAULT_TIMER_MODE } from '@core/models/settings.model';
import { SettingsStore } from '@core/stores/settings.store';
import { formatElapsed, hmsToMs, timerDisplayMs } from '@core/timer/timer-format';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { catchError, defer, from, lastValueFrom, map, merge, Observable, shareReplay } from 'rxjs';

// Повторный экспорт для обратной совместимости: старый API импортировал formatElapsed из store.
export { formatElapsed };

/**
 * Разбирает HTML-виджет таймера бота RGG (server-rendered) в `BotTimerWidget`.
 * Внутри контейнера ожидается <p id="timer"> с data-атрибутами:
 * - data-nick — ник стримера;
 * - data-name — имя таймера;
 * - data-time — прошедшее время в секундах (дробное);
 * - data-status — 1, если отсчёт идёт, иначе 0.
 *
 * @throws Error, если разметка виджета не найдена.
 */
export function parseBotTimerWidget(html: string, fallbackName: string): BotTimerWidget {
	const timerMatch = /<p[^>]*id="timer"[^>]*>[\s\S]*?<\/p>/i.exec(html);
	if (!timerMatch) {
		throw new Error('Виджет таймера не найден (проверьте ник и имя таймера)');
	}
	const tag = timerMatch[0];
	const nick = /data-nick="([^"]*)"/.exec(tag)?.[1] ?? '';
	const name = /data-name="([^"]*)"/.exec(tag)?.[1] ?? fallbackName;
	const timeRaw = /data-time="([^"]*)"/.exec(tag)?.[1] ?? '0';
	const statusRaw = /data-status="([^"]*)"/.exec(tag)?.[1] ?? '0';

	const elapsedSeconds = Number.parseFloat(timeRaw);
	const elapsedMs = Number.isFinite(elapsedSeconds) ? elapsedSeconds * 1000 : 0;

	return {
		name,
		nick,
		elapsedMs,
		running: statusRaw === '1',
	};
}

/**
 * Нормализует JSON-сообщение WebSocket бота RGG в `BotWsEvent`.
 * Принимается только объект с полем `action`; числовые/булевы поля
 * `nick`, `name`, `watch`, `status` копируются, если имеют верный тип.
 * Возвращает null для не-валидных сообщений.
 */
export function parseBotEvent(value: unknown): BotWsEvent | null {
	if (typeof value !== 'object' || value === null) {
		return null;
	}
	const record = value as Record<string, unknown>;
	if (typeof record['action'] !== 'string') {
		return null;
	}
	const event: BotWsEvent = { action: record['action'] };
	if (typeof record['nick'] === 'string') {
		event.nick = record['nick'];
	}
	if (typeof record['name'] === 'string') {
		event.name = record['name'];
	}
	if (typeof record['watch'] === 'number') {
		event.watch = record['watch'];
	}
	if (typeof record['status'] === 'boolean') {
		event.status = record['status'];
	}
	return event;
}

function widgetToSnapshot(widget: BotTimerWidget, name: string): TimerSnapshot {
	return {
		name: widget.name || name,
		elapsedMs: widget.elapsedMs,
		running: widget.running,
		source: 'bot',
	};
}

const INITIAL_SNAPSHOT: TimerSnapshot = {
	name: 'main',
	elapsedMs: 0,
	running: false,
	source: 'local',
};

interface TimerState {
	snapshot: TimerSnapshot;
	/** Unix-ms, с которого идёт отсчёт (когда таймер идёт). */
	startedAtMs: number | null;
	/** Подписка на live-режим бота (для отмены при смене настроек). */
	botSubscription: Subscription | null;
	/** Handle тика таймера. */
	tickHandle: ReturnType<typeof setInterval> | null;
	/** Режим отсчёта: обычный (elapsed) или обратный (countdown). */
	mode: 'elapsed' | 'countdown';
	/** Полная длительность обратного отсчёта в мс. */
	countdownMs: number;
}

/**
 * Таймер оверлея. Состояние — `snapshot` (name/elapsedMs/running/source).
 * Локальный тик через setInterval, пока идёт. Режим бота RGG включается/
 * выключается автоматически по настройкам и пишет snapshot'ы из виджета + live
 * из WebSocket.
 */
export const TimerStore = signalStore(
	{ providedIn: 'root' },
	withState<TimerState>({
		snapshot: INITIAL_SNAPSHOT,
		startedAtMs: null,
		botSubscription: null,
		tickHandle: null,
		mode: DEFAULT_TIMER_MODE,
		countdownMs: 5 * 60_000,
	}),
	withComputed((store) => ({
		/** Отображаемое время: для countdown это остаток до нуля. */
		displayMs: computed(() => timerDisplayMs(store.mode(), store.snapshot().elapsedMs, store.countdownMs())),
	})),
	withMethods((store) => {
		const snapshot = (): TimerSnapshot => store.snapshot();

		const currentElapsed = (): number =>
			store.snapshot().running && store.startedAtMs() !== null
				? Date.now() - (store.startedAtMs() as number)
				: store.snapshot().elapsedMs;

		const stopTicking = (): void => {
			const handle = store.tickHandle();
			if (handle !== null) {
				clearInterval(handle);
				patchState(store, { tickHandle: null });
			}
		};

		const startTicking = (): void => {
			if (store.tickHandle() !== null) {
				return;
			}
			const handle = setInterval(() => {
				const started = store.startedAtMs();
				const elapsed = started !== null ? Date.now() - started : store.snapshot().elapsedMs;
				const next = { ...store.snapshot(), elapsedMs: elapsed };
				// Обратный отсчёт закончился — останавливаемся на нуле.
				if (store.mode() === 'countdown' && elapsed >= store.countdownMs()) {
					patchState(store, {
						snapshot: { ...next, elapsedMs: store.countdownMs(), running: false },
						startedAtMs: null,
					});
					stopTicking();
					return;
				}
				patchState(store, { snapshot: next });
			}, 100);
			patchState(store, { tickHandle: handle });
		};

		const stopBot = (): void => {
			if (store.botSubscription() === null && store.snapshot().source !== 'bot') {
				return;
			}
			const sub = store.botSubscription();
			if (sub !== null) {
				sub.unsubscribe();
			}
			patchState(store, { botSubscription: null });
			if (store.snapshot().source === 'bot') {
				patchState(store, { snapshot: { ...store.snapshot(), source: 'local', running: false } });
			}
		};

		const beginRunning = (elapsedMs: number): void => {
			patchState(store, {
				startedAtMs: Date.now() - elapsedMs,
				snapshot: { ...store.snapshot(), elapsedMs, running: true },
			});
			startTicking();
		};

		const stopRunning = (): void => {
			stopTicking();
			patchState(store, {
				startedAtMs: null,
				snapshot: { ...store.snapshot(), elapsedMs: currentElapsed(), running: false },
			});
		};

		const setSnapshot = (s: TimerSnapshot): void => {
			stopTicking();
			patchState(store, { snapshot: s, startedAtMs: null });
			if (s.running) {
				patchState(store, { startedAtMs: Date.now() - s.elapsedMs });
				startTicking();
			}
		};

		const start = (): void => {
			if (store.snapshot().running) {
				return;
			}
			beginRunning(store.snapshot().elapsedMs);
		};

		const stop = (): void => {
			if (!store.snapshot().running) {
				return;
			}
			stopRunning();
		};

		return {
			start,
			stop,
			toggle(): void {
				if (store.snapshot().running) {
					stop();
				} else {
					start();
				}
			},
			reset(): void {
				stopTicking();
				const next = { ...store.snapshot(), elapsedMs: 0, running: false };
				patchState(store, { startedAtMs: null, snapshot: next });
			},
			setElapsed(hours: number, minutes: number, seconds: number): void {
				const elapsedMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
				if (store.snapshot().running) {
					patchState(store, { startedAtMs: Date.now() - elapsedMs });
				}
				patchState(store, { snapshot: { ...store.snapshot(), elapsedMs } });
			},
			setName(name: string): void {
				if (store.snapshot().name === name) {
					return;
				}
				patchState(store, { snapshot: { ...store.snapshot(), name } });
			},
			setMode(mode: 'elapsed' | 'countdown'): void {
				if (store.mode() === mode) {
					return;
				}
				patchState(store, { mode });
			},
			setCountdown(countdownMs: number): void {
				const clamped = Math.max(1000, Math.floor(countdownMs));
				patchState(store, { countdownMs: clamped });
			},
			resetCountdown(): void {
				stopTicking();
				patchState(store, {
					startedAtMs: null,
					snapshot: { ...store.snapshot(), elapsedMs: 0, running: false },
				});
			},
			/** Внешнее обновление состояния (например, из бота RGG). */
			setSnapshot,
			/** Подписка на live-режим бота; старую подписку отменяет. */
			watchBot(nick: string, timerName: string): void {
				stopBot();
				const sub = botWatch(nick, timerName, snapshot).subscribe((s) => setSnapshot(s));
				patchState(store, { botSubscription: sub });
			},
			stopBot,
			/** Одноразовая синхронизация с виджетом бота RGG. */
			async syncBot(nick: string, timerName: string): Promise<void> {
				const normalizedNick = nick.trim().toLowerCase();
				const normalizedName = timerName.trim().toLowerCase() || 'main';
				if (!normalizedNick) {
					throw new Error('Укажите ник для таймера бота RGG');
				}
				const widget = await lastValueFrom(botWidget$(normalizedNick, normalizedName));
				setSnapshot(widgetToSnapshot(widget, normalizedName));
			},
		};
	}),
	withHooks({
		onInit(store) {
			const settingsStore = inject(SettingsStore);
			const destroyRef = inject(DestroyRef);

			let lastBotConfig: string | null = null;
			const botEffect = effect(() => {
				const { localName, bot, mode, countdown } = settingsStore.settings().timer;
				const config = `${localName}\u0000${bot.enabled}\u0000${bot.nick}\u0000${bot.timerName}`;
				store.setMode(mode);
				store.setCountdown(hmsToMs(countdown.hours, countdown.minutes, countdown.seconds));
				if (config === lastBotConfig) {
					return;
				}
				lastBotConfig = config;
				store.setName(localName);
				if (bot.enabled && bot.nick.trim()) {
					store.watchBot(bot.nick, bot.timerName);
				} else {
					store.stopBot();
				}
			});

			destroyRef.onDestroy(() => {
				botEffect.destroy();
				store.stopBot();
				const handle = store.tickHandle();
				if (handle !== null) {
					clearInterval(handle);
				}
			});
		},
	}),
);

/** Холодный поток виджета таймера бота (HTTP). */
export function botWidget$(nick: string, timerName: string): Observable<BotTimerWidget> {
	return defer(() => {
		const encodedNick = encodeURIComponent(nick);
		const namedUrl = `${rggBotOrigin()}/${encodedNick}/timers/${encodeURIComponent(timerName)}`;
		const defaultUrl = `${rggBotOrigin()}/${encodedNick}`;
		return from(httpGetText(namedUrl)).pipe(
			catchError(() => from(httpGetText(defaultUrl))),
			map((html) => parseBotTimerWidget(html, timerName)),
		);
	});
}

/** Live-поток snapshot'ов таймера бота: виджет → события WebSocket. */
function botWatch(
	nick: string,
	timerName: string,
	getCurrent: () => TimerSnapshot,
): Observable<TimerSnapshot> {
	const normalizedNick = nick.trim().toLowerCase();
	const normalizedName = timerName.trim().toLowerCase() || 'main';

	const wsEvents$: Observable<BotWsEvent> = new Observable<BotWsEvent>((subscriber) => {
		let ws: WebSocket | null = null;
		let retryDelayMs = 1000;
		let retryTimer: ReturnType<typeof setTimeout> | null = null;
		let scheduled = false;

		const connect = (): void => {
			if (subscriber.closed || scheduled) {
				return;
			}
			scheduled = true;
			ws = new WebSocket(rggBotWsUrl());
			ws.onmessage = (event: MessageEvent) => {
				let payload: unknown;
				try {
					payload = JSON.parse(String(event.data));
				} catch {
					return;
				}
				const botEvent = parseBotEvent(payload);
				if (botEvent) {
					subscriber.next(botEvent);
				}
			};
			ws.onopen = () => {
				retryDelayMs = 1000;
			};
			ws.onclose = () => {
				ws = null;
				if (subscriber.closed) {
					return;
				}
				retryTimer = setTimeout(() => {
					retryTimer = null;
					scheduled = false;
					connect();
				}, retryDelayMs);
				retryDelayMs = Math.min(30_000, retryDelayMs * 2);
			};
			ws.onerror = () => {
				ws?.close();
			};
		};

		connect();
		return () => {
			scheduled = false;
			if (retryTimer !== null) {
				clearTimeout(retryTimer);
				retryTimer = null;
			}
			if (ws !== null) {
				ws.onclose = null;
				ws.close();
				ws = null;
			}
		};
	}).pipe(shareReplay({ bufferSize: 1, refCount: true }));

	const initial = botWidget$(normalizedNick, normalizedName).pipe(
		map((widget) => widgetToSnapshot(widget, normalizedName)),
	);
	const live = wsEvents$.pipe(
		map((event): TimerSnapshot => {
			const current = getCurrent();
			return {
				name: normalizedName,
				elapsedMs: typeof event.watch === 'number' ? event.watch * 1000 : current.elapsedMs,
				running: typeof event.status === 'boolean' ? event.status : current.running,
				source: 'bot',
			};
		}),
	);

	return merge(initial, live);
}