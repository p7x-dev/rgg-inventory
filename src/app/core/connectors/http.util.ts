/**
 * Базовая логика HTTP. В dev-режиме (http://localhost / 127.0.0.1) внешние
 * https-хосты недоступны из-за CORS, поэтому запросы идут через dev-прокси
 * Angular (proxy.conf.json) на относительный префикс /rgg-api и /rgg-bot.
 * В проде (Tauri с протоколом tauri://, либо развёрнутый https) — напрямую.
 */

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

/** Базовый URL rgg.land с учётом dev-прокси. */
export function rggLandOrigin(): string {
	return isLocalDevOrigin() ? '/rgg-api' : 'https://rgg.land';
}

/** Базовый URL bot.rgg.land с учётом dev-прокси. */
export function rggBotOrigin(): string {
	return isLocalDevOrigin() ? '/rgg-bot' : 'https://bot.rgg.land';
}

/** URL WebSocket бота RGG с учётом dev-прокси (ws проксируется dev-сервером). */
export function rggBotWsUrl(): string {
	return isLocalDevOrigin() ? 'ws://localhost:4200/rgg-bot/ws' : 'wss://bot.rgg.land/ws';
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