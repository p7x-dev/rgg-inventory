import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, signal } from '@angular/core';

/**
 * Название текущей игры (dumb). Если текст не помещается в контейнер —
 * бегущая строка (CSS-анимация), иначе статичный текст.
 */
@Component({
	selector: 'app-game-title-widget',
	imports: [],
	templateUrl: './game-title-widget.component.html',
	styleUrl: './game-title-widget.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameTitleWidgetComponent {
	private readonly elementRef = inject(ElementRef<HTMLElement>);

	readonly platform = input<string | null>(null);

	readonly game = input.required<string>();

	/** Длительность пробега (мс на символ) — скорость бегущей строки. */
	readonly durationPerChar = input(180);

	/** Переполнение текста: бегущая строка вместо статики. */
	protected readonly overflow = signal(false);

	protected readonly scrollDuration = computed(() => {
		const chars = (this.game() + (this.platform() ?? '')).length;
		return `${Math.max(4, chars * this.durationPerChar())}ms`;
	});

	protected readonly full = computed(() =>
		this.platform() ? `${this.platform()} — ${this.game()}` : this.game(),
	);

	constructor() {
		const resizeObserver = new ResizeObserver(() => this.updateOverflow());
		resizeObserver.observe(this.elementRef.nativeElement);
		queueMicrotask(() => this.updateOverflow());
		this.elementRef.nativeElement.addEventListener('animationiteration', () => {
			this.updateOverflow();
		});
	}

	private updateOverflow(): void {
		const host: HTMLElement = this.elementRef.nativeElement;
		const track = host.querySelector<HTMLElement>('.track');
		if (!track) {
			return;
		}
		const overflow = track.scrollWidth > host.clientWidth + 1;
		if (overflow !== this.overflow()) {
			this.overflow.set(overflow);
		}
	}
}