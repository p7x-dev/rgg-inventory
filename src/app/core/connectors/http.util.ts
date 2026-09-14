/**
 * Базовая логика HTTP. В dev-режиме (http://localhost / 127.0.0.1) внешние
 * https-хосты недоступны из-за CORS, поэтому запросы идут через dev-прокси
 * Angular (proxy.conf.json) на относительный префикс /rgg-api и /rgg-bot.
 * На развёрнутом сайте — через nginx-прокси того же сервера (/rgg-land,
 * /rgg-bot). В Tauri (протокол tauri://) fetch подменён на нативный HTTP-
 * клиент плагина (src/main.ts) — ходим напрямую по https.
 */
import { isTauri } from '@core/utils/platform';

function isLocalDevOrigin(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	const { protocol, hostname } = window.location;
	if (protocol !== 'http:' && protocol !== 'https:') {
		return false;
	}
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/** `true` для развёрнутого веб-приложения (https, не Tauri): CORS обходим nginx-прокси. */
function isWebDeploy(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	return window.location.protocol === 'https:' && !isLocalDevOrigin() && !isTauri();
}

/** Базовый URL rgg.land: dev-прокси / prod-прокси сервера / напрямую (Tauri). */
export function rggLandOrigin(): string {
	if (isLocalDevOrigin()) {
		return '/rgg-api';
	}
	if (isWebDeploy()) {
		return '/rgg-land';
	}
	return 'https://rgg.land';
}

/** Базовый URL bot.rgg.land: dev-прокси / prod-прокси сервера / напрямую (Tauri). */
export function rggBotOrigin(): string {
	if (isLocalDevOrigin()) {
		return '/rgg-bot';
	}
	if (isWebDeploy()) {
		return '/rgg-bot';
	}
	return 'https://bot.rgg.land';
}

/** URL WebSocket бота RGG с учётом dev-прокси (ws проксируется dev-сервером). */
export function rggBotWsUrl(): string {
	if (isLocalDevOrigin()) {
		return 'ws://localhost:4200/rgg-bot/ws';
	}
	if (isWebDeploy()) {
		return `wss://${window.location.host}/rgg-bot/ws`;
	}
	return 'wss://bot.rgg.land/ws';
}

/** Тонкая обёртка над fetch с понятной ошибкой. */
export async function httpGetText(url: string): Promise<string> {
	const response = await fetch(url, {
		headers: {
			Accept: 'text/html,text/plain,text/csv,*/*',
		},
	});
	if (!response.ok) {
		throw new Error(`HTTP ${response.status} для ${url}`);
	}
	return response.text();
}

export async function httpGetJson(url: string): Promise<unknown> {
	const response = await fetch(url, { cache: 'no-store' });
	if (!response.ok) {
		throw new Error(`HTTP ${response.status} для ${url}`);
	}
	return response.json();
}