/** Состояние таймера в любой момент времени. */
export interface TimerSnapshot {
	name: string;
	elapsedMs: number;
	running: boolean;
	source: 'local' | 'bot';
}

/** Ответ бота RGG для виджета таймера (server-rendered HTML). */
export interface BotTimerWidget {
	name: string;
	nick: string;
	elapsedMs: number;
	running: boolean;
}

/** Событие WebSocket бота RGG. */
export interface BotWsEvent {
	action: 'start' | 'stop' | 'update' | 'reset' | 'delete' | 'restart' | string;
	nick?: string;
	name?: string;
	watch?: number;
	status?: boolean;
}
