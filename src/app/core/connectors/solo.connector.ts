import type { SoloSourceConfig } from '@core/models/settings.model';
import type { SoloData, SoloLoadResult } from '@core/models/solo.model';
import { httpGetText } from '@core/connectors/http.util';
import { parseSoloCsv } from '@core/connectors/sheets.parser';

/** Загрузчик Solo-таблицы из Google Sheets (публичный CSV-экспорт). */
export class SoloConnector {
	readonly id = 'solo' as const;

	constructor(private readonly config: SoloSourceConfig) {}

	async load(player = 'стример'): Promise<SoloData> {
		const spreadsheetId = this.config.spreadsheetId.trim();
		if (!spreadsheetId) {
			throw new Error('Укажите ID Google-таблицы Solo RGG');
		}
		let url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/export?format=csv`;
		if (this.config.gid.trim()) {
			url += `&gid=${encodeURIComponent(this.config.gid.trim())}`;
		}
		const csv = await httpGetText(url);
		return parseSoloCsv(csv, {}, player);
	}
}

/** Реестр коннекторов Solo-режима. */
export class SoloConnectorFactory {
	create(config: SoloSourceConfig): SoloConnector {
		return new SoloConnector(config);
	}
}

export type { SoloLoadResult };