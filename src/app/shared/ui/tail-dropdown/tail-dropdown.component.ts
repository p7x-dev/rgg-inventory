import {
	afterNextRender,
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	ElementRef,
	inject,
	signal,
	viewChild,
} from '@angular/core';
import { TuiActiveZone } from '@taiga-ui/cdk/directives/active-zone';
import { TuiAnimated } from '@taiga-ui/cdk/directives/animated';
import { TuiScrollbar } from '@taiga-ui/core/components/scrollbar';
import {
	TUI_DROPDOWN_OPTIONS,
	TuiDropdownAnchor,
	TuiDropdownDirective,
} from '@taiga-ui/core/portals/dropdown';
import { TUI_DARK_MODE } from '@taiga-ui/core/tokens';
import { PolymorpheusOutlet } from '@taiga-ui/polymorpheus';

/** Ширина стрелки, px. */
const TAIL_SIZE = 12;

/** Высота (выступ) стрелки за край ящика, px. */
const TAIL_HEIGHT = 9;

/** Насколько стрелка «утоплена» в ящик по горизонтали, px. */
const TAIL_INSET = 8;

type TailSide = 'top' | 'bottom';

/**
 * Кастомная замена `TuiDropdownComponent` — тот же поведенческий каркас
 * (позиционирование якоря, зона активности, анимации) + хвост-стрелка,
 * которая автоматически указывает на якорь открывшего её элемента.
 *
 * Подключается глобально через токен `TUI_DROPDOWN_COMPONENT`, поэтому
 * заменяет встроенный дропдаун во всём приложении.
 */
@Component({
	selector: 'app-tail-dropdown',
	imports: [PolymorpheusOutlet, TuiScrollbar],
	templateUrl: './tail-dropdown.component.html',
	styleUrl: './tail-dropdown.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	hostDirectives: [TuiActiveZone, TuiAnimated, TuiDropdownAnchor],
	host: {
		'[attr.data-appearance]': 'options.appearance',
		'[attr.tuiTheme]': 'theme()',
	},
})
export class TailDropdownComponent {
	protected readonly options = inject(TUI_DROPDOWN_OPTIONS);

	protected readonly directive = inject(TuiDropdownDirective);

	protected readonly darkMode = inject(TUI_DARK_MODE);

	protected readonly theme = computed((_ = this.darkMode()) =>
		this.directive.el.closest('[tuiTheme]')?.getAttribute('tuiTheme'),
	);

	protected readonly close = (): void => {
		this.directive.toggle(false);
	};

	/**
	 * Сторона хвоста относительно ящика: 'top' — якорь выше (дропдаун открыт вниз),
	 * 'bottom' — якорь ниже (дропдаун открыт вверх).
	 */
	protected readonly tailSide = signal<TailSide>('top');

	/** Горизонтальный сдвиг хвоста от левого края ящика, чтобы он указывал на якорь. */
	protected readonly tailOffset = signal(0);

	/** Выступ кончика хвоста за пределы ящика — хвост целиком выглядывает из края. */
	protected readonly tailProtrude = TAIL_HEIGHT;

	private readonly hostElement = inject(ElementRef<HTMLElement>);

	private readonly boxElement = viewChild<ElementRef<HTMLElement>>('box');

	private readonly destroyRef = inject(DestroyRef);

	/** Замеряет геометрию якоря и ящика и выставляет хвост поверх центра якоря. */
	private readonly measure = (): void => {
		const geometry = this.readTailGeometry();
		if (!geometry) {
			return;
		}
		this.tailSide.set(geometry.side);
		this.tailOffset.set(geometry.offset);
	};

	private readTailGeometry(): { side: TailSide; offset: number } | null {
		const box = this.boxElement()?.nativeElement;
		const anchor = this.directive.getClientRect();
		if (!box || !anchor.width || !anchor.height) {
			return null;
		}
		const rect = box.getBoundingClientRect();
		if (!rect.width || !rect.height) {
			return null;
		}
		const openedBelow = rect.top - this.options.offset >= anchor.bottom;
		const anchorCenter = anchor.left + anchor.width / 2;
		const max = Math.max(TAIL_INSET, rect.width - TAIL_SIZE - TAIL_INSET);
		const offset = Math.round(Math.min(Math.max(anchorCenter - rect.left - TAIL_SIZE / 2, TAIL_INSET), max));
		return { side: openedBelow ? 'top' : 'bottom', offset };
	}

	constructor() {
		afterNextRender(() => {
			// Якорь позиционирует ящик асинхронно — перезамеряем несколько кадров подряд.
			const retry = (times: number): void => {
				this.measure();
				if (times > 0) {
					requestAnimationFrame(() => retry(times - 1));
				}
			};
			retry(3);

			// Появление/смена размеров ящика (загрузка контента) — перезамер.
			const observer = new ResizeObserver(() => this.measure());
			observer.observe(this.hostElement.nativeElement);
			this.destroyRef.onDestroy(() => observer.disconnect());
		});

		// Репозиционирование якоря (скролл страницы, изменение вьюпорта) меняет top/left без CD.
		const onReposition = (): void => this.measure();
		window.addEventListener('scroll', onReposition, { capture: true, passive: true });
		window.addEventListener('resize', onReposition, { passive: true });
		this.destroyRef.onDestroy(() => {
			window.removeEventListener('scroll', onReposition as EventListener, { capture: true });
			window.removeEventListener('resize', onReposition as EventListener);
		});
	}
}