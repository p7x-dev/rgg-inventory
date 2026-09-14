import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TuiIcon } from '@taiga-ui/core';

/** Профиль: ник + валюты (dumb). Используется на баре и как отдельный виджет. */
@Component({
	selector: 'app-profile-widget',
	imports: [TuiIcon],
	templateUrl: './profile-widget.component.html',
	styleUrl: './profile-widget.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileWidgetComponent {
	readonly title = input.required<string>();

	readonly coins = input(0);

	readonly tears = input(0);

	readonly showCurrencies = input(true);

	readonly coinIcon = input<string | null>(null);

	readonly tearIcon = input<string | null>(null);
}