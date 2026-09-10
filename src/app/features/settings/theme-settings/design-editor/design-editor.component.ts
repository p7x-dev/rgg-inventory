import type { DragMode, PercentRect } from '@core/design/rect-editor';
import { ChangeDetectionStrategy, Component, computed, input, output, signal, viewChild } from '@angular/core';
import { hitTest, moveRect, resizeRect } from '@core/design/rect-editor';

/**
 * Drag&drop редактор дизайна: двигает и ресайзит прямоугольники слотов
 * на превью картинки. Работает в процентах — не зависит от реальных пикселей.
 * Чистая геометрия вынесена в rect-editor.ts и покрыта тестами.
 */
@Component({
	selector: 'app-design-editor',
	templateUrl: './design-editor.component.html',
	styleUrl: './design-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignEditorComponent {
	/** dataURL картинки-дизайна (фон для раскладки). */
	readonly image = input.required<string>();

	readonly width = input.required<number>();

	readonly height = input.required<number>();

	/** Прямоугольники слотов в процентах. */
	readonly rects = input.required<PercentRect[]>();

	/** Сообщает об изменении прямоугольников (после каждого drag-события). */
	readonly rectsChange = output<PercentRect[]>();

	protected readonly editor = viewChild.required<HTMLElement>('editor');

	protected readonly dragging = signal<{
		index: number;
		mode: DragMode;
		startX: number;
		startY: number;
		origin: PercentRect;
	} | null>(null);

	protected readonly aspectRatio = computed(() => `${this.width()} / ${this.height()}`);

	/** Выбранный слот для визуальной подсветки. */
	protected readonly activeIndex = signal<number | null>(null);

	protected onPointerDown(event: PointerEvent, index: number): void {
		const editorEl = this.editor();
		if (!editorEl) {
			return;
		}
		const bounds = editorEl.getBoundingClientRect();
		if (bounds.width === 0 || bounds.height === 0) {
			return;
		}
		const rect = this.rects()[index];
		const mode = hitTest(
			event.clientX - bounds.left,
			event.clientY - bounds.top,
			this.toPx(rect, bounds),
			6,
		);
		if (!mode) {
			return;
		}
		this.activeIndex.set(index);
		this.dragging.set({ index, mode, startX: event.clientX, startY: event.clientY, origin: rect });
		// Продолжаем получать события даже вне контейнера.
		editorEl.setPointerCapture(event.pointerId);
		event.preventDefault();
	}

	protected onPointerMove(event: PointerEvent): void {
		const drag = this.dragging();
		if (!drag) {
			return;
		}
		const editorEl = this.editor();
		if (!editorEl) {
			return;
		}
		const bounds = editorEl.getBoundingClientRect();
		const dx = ((event.clientX - drag.startX) / bounds.width) * 100;
		const dy = ((event.clientY - drag.startY) / bounds.height) * 100;

		const next =
			drag.mode === 'move'
				? moveRect(drag.origin, dx, dy, this.width(), this.height())
				: resizeRect(drag.origin, drag.mode, dx, dy, this.width(), this.height());

		const rects = this.rects();
		this.rectsChange.emit(rects.map((rect, i) => (i === drag.index ? next : rect)));
	}

	protected onPointerUp(event: PointerEvent): void {
		this.onPointerMove(event);
		this.dragging.set(null);
	}

	private toPx(rect: PercentRect, bounds: DOMRect): { left: number; top: number; width: number; height: number } {
		return {
			left: (rect.left / 100) * bounds.width,
			top: (rect.top / 100) * bounds.height,
			width: (rect.width / 100) * bounds.width,
			height: (rect.height / 100) * bounds.height,
		};
	}
}