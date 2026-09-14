import type { SoloCategory } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SOLO_PLATFORM_ICONS } from '@core/data/solo-platform-icons';
import { soloPlatformShortName } from '@core/models/solo.model';

/** Максимум символов в подписи платформы на слоте. */
const PLATFORM_LABEL_MAX = 4;

/** Слот платформы Solo RGG: иконка + короткое название + бейдж пройденных игр. */
@Component({
	selector: 'app-solo-platform-slot',
	templateUrl: './solo-platform-slot.component.html',
	styleUrl: './solo-platform-slot.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoloPlatformSlotComponent {
	readonly category = input.required<SoloCategory>();

	/** Доп. платформа: показать крестик удаления. */
	readonly removable = input(false);

	readonly activate = output<void>();

	readonly remove = output<void>();

	protected readonly shortName = computed(() =>
		soloPlatformShortName(this.category().platform).slice(0, PLATFORM_LABEL_MAX),
	);

	protected readonly iconSrc = computed(() => SOLO_PLATFORM_ICONS[this.category().platform] ?? null);

	/** Сколько игр пройдено на платформе (бейдж ×N). */
	protected readonly completedCount = computed(() => this.category().stats.completed);

	protected readonly label = computed(() => this.category().platform);

	protected readonly tooltip = computed(() => {
		const cat = this.category();
		const game = cat.current?.game ?? '—';
		const stats = `Пройдено: ${cat.stats.completed} · Рероллы: ${cat.stats.reroll} · Пропуски: ${cat.stats.skip}`;
		return `${game}\n${stats}`;
	});

	protected onClick(): void {
		this.activate.emit();
	}

	protected onRemove(event: MouseEvent): void {
		event.stopPropagation();
		this.remove.emit();
	}
}