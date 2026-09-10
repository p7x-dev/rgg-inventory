import type { OverlaySettings } from '@core/models/settings.model';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	signal,
} from '@angular/core';
import { SettingsStore } from '@core/stores/settings.store';
import { TuiButton } from '@taiga-ui/core';

interface TutorialStep {
	/** CSS-селектор подсвечиваемого элемента в основном окне. */
	selector: string;
	title: string;
	text: string;
	/** Дополнительный вертикальный отступ карточки над блоком, px. */
	offsetY?: number;
}

const TUTORIAL_STEPS: TutorialStep[] = [
	{
		selector: '.bar-profile',
		title: 'Имя и валюта',
		text: 'Здесь виден ник и ресурсы (монетки, слёзы). Подтягиваются из сайта автоматически.',
	},
	{
		selector: '.bar-inventory-block',
		title: 'Предметы',
		text:
			'Это инвентарь. Наведи на квадратик — увидишь название и подсказку. '
			+ 'Сколько их в ряду и какого размера — настрой в «Настройках».',
	},
	{
		selector: '.bar-controls',
		title: 'Управление',
		offsetY: 120,
		text:
			'Кнопки: открыть полный список предметов, таймер, ссылку для OBS и настройки. '
			+ 'Если OBS не нужен — скрой в настройках («Поверх всех окон»).',
	},
];

/** Первичное знакомство с оверлеем: шаги с подсветкой элементов интерфейса. */
@Component({
	selector: 'app-tutorial',
	imports: [TuiButton],
	templateUrl: './tutorial.component.html',
	styleUrl: './tutorial.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialComponent {
	private readonly settingsStore = inject(SettingsStore);

	protected readonly stepIndex = signal(0);

	/** Позиция подсвечиваемого элемента: left/top/width/height в viewport-координатах. */
	protected readonly box = signal<{ left: number; top: number; width: number; height: number } | null>(
		null,
	);

	protected readonly step = computed<TutorialStep | null>(() => {
		const enabled = this.settingsStore.overlay().tutorialEnabled;
		if (!enabled) {
			return null;
		}
		return TUTORIAL_STEPS[this.stepIndex()] ?? null;
	});

	protected readonly isLast = computed(
		() => this.stepIndex() === TUTORIAL_STEPS.length - 1,
	);

	/** Индексы шагов для отрисовки точек прогресса. */
	protected readonly stepTrack = Array.from(
		{ length: TUTORIAL_STEPS.length },
		(_, index) => index,
	);

	protected readonly position = computed(() => {
		const b = this.box();
		const s = this.step();
		if (!b || !s) {
			return { card: {}, hole: { display: 'none' }, placement: 'down' };
		}
		const card = computeCardPosition(b, s);
		return {
			card: card.position,
			hole: {
				left: `${b.left}px`,
				top: `${b.top}px`,
				width: `${b.width}px`,
				height: `${b.height}px`,
			},
			placement: card.placement,
		};
	});

	private resizeHandler = (): void => {
		this.remeasureBox();
	};

	constructor() {
		window.addEventListener('resize', this.resizeHandler);

		// При появлении/смене шага позиционируем подсказку после отрисовки.
		effect(() => {
			const active = this.step();
			if (active) {
				queueMicrotask(() => this.remeasureBox());
			}
		});
	}

	ngOnDestroy(): void {
		window.removeEventListener('resize', this.resizeHandler);
	}

	protected next(): void {
		if (this.isLast()) {
			this.finish();
			return;
		}
		this.stepIndex.update((index) => index + 1);
		queueMicrotask(() => this.remeasureBox());
	}

	protected finish(): void {
		const current: OverlaySettings = this.settingsStore.overlay();
		this.settingsStore.update({ overlay: { ...current, tutorialEnabled: false } });
	}

	private remeasureBox(): void {
		const selector = this.step()?.selector ?? '';
		const element = selector ? document.querySelector<HTMLElement>(selector) : null;
		if (!element) {
			this.box.set(null);
			return;
		}
		const rect = element.getBoundingClientRect();
		this.box.set({
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height,
		});
	}
}

function computeCardPosition(
	b: { left: number; top: number; width: number; height: number },
	step: TutorialStep,
): { position: Record<string, string>; placement: 'up' | 'down' } {
	const vw = window.innerWidth;
	const vh = window.innerHeight;

	// Мобильные экраны: карточка тянется почти на всю ширину, типографика меньше.
	const cardWidth = Math.min(300, vw - 24);
	const cardHeight = vw < 480 ? 190 : 170;

	// Отступ от блока: на небольших экранах уменьшаем, чтобы карточка не вылезала.
	const baseGap = 48 + (step.offsetY ?? 0);
	const minGap = 16;
	const gap = Math.max(minGap, Math.min(baseGap, Math.floor(vh * 0.15)));

	const marginX = 12;
	let left = b.left + b.width / 2 - cardWidth / 2;
	left = Math.max(marginX, Math.min(vw - cardWidth - marginX, left));

	const spaceBelow = vh - (b.top + b.height);
	const spaceAbove = b.top;
	let top: number;
	let placement: 'up' | 'down';
	if (spaceAbove >= cardHeight + gap) {
		// Блок внизу — карточка над ним, стрелка вниз.
		top = b.top - cardHeight - gap;
		placement = 'down';
	} else if (spaceBelow >= cardHeight + gap) {
		// Блок у верха — карточка под ним, стрелка вверх.
		top = b.top + b.height + gap;
		placement = 'up';
	} else if (spaceAbove >= cardHeight + minGap) {
		// Малый запас сверху — прижимаем к блоку плотнее.
		top = b.top - cardHeight - minGap;
		placement = 'down';
	} else {
		top = Math.max(minGap, vh - cardHeight - minGap);
		placement = 'down';
	}
	return { position: { left: `${left}px`, top: `${top}px` }, placement };
}