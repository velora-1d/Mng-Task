import { env } from '$env/dynamic/private';

const authBaseUrl = env.NEON_AUTH_BASE_URL || process.env.NEON_AUTH_BASE_URL;
const authJwksUrl = env.NEON_AUTH_JWKS_URL || process.env.NEON_AUTH_JWKS_URL;

export function getNeonAuthConfig() {
	return {
		authBaseUrl,
		authJwksUrl
	};
}

export async function fetchNeonAuthJwks() {
	if (!authJwksUrl) {
		throw new Error('NEON_AUTH_JWKS_URL is not configured');
	}
	const res = await fetch(authJwksUrl);
	if (!res.ok) {
		throw new Error(`Failed to fetch JWKS: ${res.status} ${res.statusText}`);
	}
	return await res.json();
}
