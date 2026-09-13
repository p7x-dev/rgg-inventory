import type { SoloCategory } from '@core/models/solo.model';
import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { soloPlatformShortName } from '@core/models/solo.model';
import { SoloStore } from '@core/stores/solo.store';
import { SoloPlatformSlotComponent } from './solo-platform-slot/solo-platform-slot.component';

/** Хотбар Solo RGG: слоты по платформам с иконкой и тремя числами. */
@Component({
	selector: 'app-solo-hotbar',
	imports: [SoloPlatformSlotComponent],
	templateUrl: './solo-hotbar.component.html',
	styleUrl: './solo-hotbar.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SoloHotbarComponent {
	private readonly soloStore = inject(SoloStore);

	/** Открыть попап с играми платформы. */
	readonly platformSelect = output<SoloCategory>();

	protected readonly categories = this.soloStore.categories;

	protected readonly loading = this.soloStore.loading;

	protected readonly error = computed(() => this.soloStore.error()?.split('.')[0] ?? '');

	protected readonly total = computed(() => this.soloStore.total());

	protected readonly shortName = soloPlatformShortName;
}