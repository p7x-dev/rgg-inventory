import { Injectable } from '@angular/core';

/** Иконки RGG с rgg.land: токены игроков и эмодзи. */
export interface RggCatalogItem {
	name: string;
	url: string;
	source: 'token' | 'emote';
}

const RGG_LAND_BASE = 'https://rgg.land';

/** URL токена-аватарки игрока на rgg.land. */
export function playerTokenUrl(nick: string): string {
	return `${RGG_LAND_BASE}/images/tokens/players/${encodeURIComponent(nick.toLowerCase())}.webp`;
}

/** Извлекает имена эмодзи из главной страницы rgg.land. */
export function extractEmotes(html: string): string[] {
	const names = new Set<string>();
	const re = /\/images\/emotes\/([\w-]+)\//g;
	for (const match of html.matchAll(re)) {
		names.add(match[1]);
	}
	return [...names].sort();
}

/** Каталог иконок, доступных для взятия с rgg.land. */
@Injectable({ providedIn: 'root' })
export class RggIconService {
	async fetchCatalog(streamerNick: string): Promise<RggCatalogItem[]> {
		const catalog: RggCatalogItem[] = [];

		const nick = streamerNick.trim().toLowerCase();
		if (nick) {
			catalog.push({ name: nick, url: playerTokenUrl(nick), source: 'token' });
		}

		try {
			const response = await fetch(RGG_LAND_BASE);
			if (response.ok) {
				const html = await response.text();
				for (const emote of extractEmotes(html)) {
					catalog.push({
						name: emote,
						url: `${RGG_LAND_BASE}/images/emotes/${emote}/4x.avif`,
						source: 'emote',
					});
				}
			}
		} catch {
			// каталог эмодзи недоступен — используем только токен стримера
		}
		return catalog;
	}
}
