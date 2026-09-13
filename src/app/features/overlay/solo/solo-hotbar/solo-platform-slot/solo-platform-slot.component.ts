import type { SoloCategory, SoloStats } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SOLO_PLATFORM_ICONS } from '@core/data/solo-platform-icons';
import { soloPlatformShortName } from '@core/models/solo.model';

/** Слот платформы Solo RGG: иконка/аббревиатура + 3 числа. */
@Component({
	selector: 'app-solo-platform-slot',
	templateUrl: './solo-platform-slot.component.html',
	styleUrl: './solo-platform-slot.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoloPlatformSlotComponent {
	readonly category = input.required<SoloCategory>();

	readonly activate = output<void>();

	protected readonly shortName = computed(() => soloPlatformShortName(this.category().platform));

	protected readonly iconSrc = computed(() => SOLO_PLATFORM_ICONS[this.category().platform] ?? null);

	protected readonly stats = computed<SoloStats>(() => this.category().stats);

	protected readonly currentGame = computed(() => this.category().current?.game ?? null);

	protected readonly label = computed(() => this.category().platform);

	protected readonly tooltip = computed(() => {
		const cat = this.category();
		const game = cat.current?.game ?? '—';
		const line = `Текущая: ${game}`;
		const stats = `Пройдено: ${cat.stats.completed} · Рероллы: ${cat.stats.reroll} · Пропуски: ${cat.stats.skip}`;
		return `${line}\n${stats}`;
	});

	protected onClick(): void {
		this.activate.emit();
	}
}