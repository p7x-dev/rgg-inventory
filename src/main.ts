import { bootstrapApplication } from '@angular/platform-browser';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { isTauri } from './app/core/utils/platform';

// Внутри Tauri-оболочки подменяем глобальный fetch на нативный HTTP-клиент,
// чтобы обходить CORS при запросах к rgg.land / Google Sheets.
if (isTauri()) {
	(globalThis as unknown as Record<string, unknown>)['fetch'] = tauriFetch;
}

bootstrapApplication(App, appConfig).catch((err: unknown) => console.error(err));
