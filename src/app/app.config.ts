import type { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { TailDropdownComponent } from '@shared/ui/tail-dropdown/tail-dropdown.component';
import { provideTaiga } from '@taiga-ui/core';
import { TUI_DROPDOWN_COMPONENT, tuiDropdownOptionsProvider } from '@taiga-ui/core/portals/dropdown';

export const appConfig: ApplicationConfig = {
	providers: [
		{
			provide: ErrorHandler,
			useClass: ErrorHandler,
		},
		provideBrowserGlobalErrorListeners(),
		provideHttpClient(),
		provideTaiga(),
		// Вместо встроенного дропдауна Taiga используем свой — с хвостом-стрелкой к якорю.
		{ provide: TUI_DROPDOWN_COMPONENT, useValue: TailDropdownComponent },
		// «Воздух» между якорем и ящиком чуть больше дефолтных 4px — чтобы хвост
		// (его выступающая часть) целиком помещался в зазор и не уходил под кнопку.
		tuiDropdownOptionsProvider({ offset: 8 }),
	],
};
