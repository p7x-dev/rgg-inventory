import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Сворачиваемая секция настроек (accessibility: native <details>). */
@Component({
	selector: 'app-settings-section',
	imports: [],
	templateUrl: './settings-section.component.html',
	styleUrl: './settings-section.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSectionComponent {
	readonly title = input.required<string>();

	readonly open = input(false);

	/** DOM-идентификатор `<details>`, чтобы можно было прокрутить к секции. */
	readonly anchor = input<string>('');
}