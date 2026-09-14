import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SettingsStatusKind = 'ok' | 'error' | 'warn' | 'neutral';

/** Строка статуса настройки (успех/ошибка/предупреждение/нейтрально). */
@Component({
	selector: 'app-settings-status',
	imports: [],
	templateUrl: './settings-status.component.html',
	styleUrl: './settings-status.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsStatusComponent {
	readonly kind = input<SettingsStatusKind>('neutral');
}