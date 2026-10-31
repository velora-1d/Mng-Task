import { env } from '$env/dynamic/private';

const helloBaseUrl = env.NEON_FUNCTION_HELLO_BASE_URL || process.env.NEON_FUNCTION_HELLO_BASE_URL;

export async function callHelloFunction(): Promise<{ ok: boolean; status: number; text: string }> {
	if (!helloBaseUrl) {
		throw new Error('NEON_FUNCTION_HELLO_BASE_URL is not configured');
	}
	const response = await fetch(helloBaseUrl);
	const text = await response.text();
	return {
		ok: response.ok,
		status: response.status,
		text
	};
}
