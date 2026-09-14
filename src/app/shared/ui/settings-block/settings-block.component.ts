import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Под-блок внутри секции настроек: необязательный заголовок + содержимое. */
@Component({
	selector: 'app-settings-block',
	imports: [],
	templateUrl: './settings-block.component.html',
	styleUrl: './settings-block.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBlockComponent {
	readonly title = input('');
}