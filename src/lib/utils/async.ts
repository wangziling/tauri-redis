export function generateOperablePromise<T>(invoker?: Function) {
	let resolve: Parameters<ConstructorParameters<typeof Promise<T>>[0]>[0] | undefined = undefined,
		reject: Parameters<ConstructorParameters<typeof Promise<T>>[0]>[1] | undefined = undefined;
	const p = new Promise<T>(function (_resolve, _reject) {
		typeof invoker === 'function' && invoker();

		resolve = _resolve;
		reject = _reject;
	});

	return {
		p,
		resolve: resolve!,
		reject: reject!
	};
}
