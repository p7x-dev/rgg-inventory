import { Component, inject } from '@angular/core';
import { OverlayBarComponent } from '@app/features/overlay/overlay-bar/overlay-bar.component';
import { OverlayPageComponent } from '@app/features/overlay/overlay-page/overlay-page.component';
import { TutorialComponent } from '@app/features/tutorial/tutorial.component';
import { AppShellService } from '@core/services/app-shell.service';
import { ThemeHostDirective } from '@shared/ui/theme-host/theme-host.directive';
import { TuiRoot } from '@taiga-ui/core';

@Component({
	selector: 'app-root',
	imports: [TuiRoot, ThemeHostDirective, OverlayBarComponent, OverlayPageComponent, TutorialComponent],
	templateUrl: './app.html',
	styleUrl: './app.scss',
})
export class App {
	readonly shell = inject(AppShellService);
}