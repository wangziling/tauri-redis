export function invokeErrorHandle(err: Error) {
	console.error(err);

	throw err;
}
