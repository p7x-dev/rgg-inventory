import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { releaseOsLabel } from '@core/models/release.model';
import { ReleaseStore } from '@core/stores/release.store';
import { TuiButton } from '@taiga-ui/core';

@Component({
	selector: 'app-app-settings',
	imports: [TuiButton],
	templateUrl: './app-settings.component.html',
	styleUrl: './app-settings.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSettingsComponent {
	private readonly releaseStore = inject(ReleaseStore);

	protected readonly loading = this.releaseStore.loading;

	protected readonly error = this.releaseStore.error;

	protected readonly downloadUrl = this.releaseStore.downloadUrl;

	protected readonly hasArtifact = this.releaseStore.hasArtifact;

	protected readonly latestVersion = this.releaseStore.latest;

	protected readonly os = this.releaseStore.os;

	protected readonly osLabel = (): string => releaseOsLabel(this.os());

	protected onCheck(): void {
		void this.releaseStore.check();
	}

	protected onDownload(): void {
		const url = this.downloadUrl();
		if (!url) {
			return;
		}
		window.open(url, '_blank', 'noopener');
	}
}