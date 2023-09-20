export class SubscribeManager {
	events: Function[] = [];

	subscribe(func: Function) {
		this.events.push(func);
	}

	unsubscribe() {
		this.events.forEach(function (sub) {
			sub();
		});
	}
}
