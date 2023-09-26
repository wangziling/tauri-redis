import type { ComponentsManualRenderingBaseEventsGenerateSlotParams } from '$lib/types';
import { randomString } from '$lib/utils/calculators';

export class ComponentsManualRenderingBaseEvents {
	generateSlot(params?: Partial<ComponentsManualRenderingBaseEventsGenerateSlotParams>) {
		const id = randomString(10);

		const slot = document.createElement('div');
		slot.id = id;

		if (params?.placeholder) {
			slot.innerText = params?.placeholder;
		}

		let target = params?.target;
		if (typeof target === 'string') {
			target = document.querySelector(target);
		}

		if (!target) {
			target = document.body;
		}

		target.append(slot);

		return {
			slot,
			id,
			target
		};
	}
}
