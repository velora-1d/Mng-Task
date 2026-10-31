/** Toast sederhana. Dipakai lewat `toast.success('...')`. */
export type ToastTone = 'success' | 'error' | 'info';

export type ToastItem = {
	id: number;
	message: string;
	tone: ToastTone;
};

const DURATION = 3000;

class ToastStore {
	items = $state<ToastItem[]>([]);
	#nextId = 0;

	#push(message: string, tone: ToastTone) {
		const id = ++this.#nextId;
		this.items = [...this.items, { id, message, tone }];
		if (typeof window !== 'undefined') {
			setTimeout(() => this.dismiss(id), DURATION);
		}
	}

	success(message: string) {
		this.#push(message, 'success');
	}

	error(message: string) {
		this.#push(message, 'error');
	}

	info(message: string) {
		this.#push(message, 'info');
	}

	dismiss(id: number) {
		this.items = this.items.filter((item) => item.id !== id);
	}
}

export const toast = new ToastStore();
