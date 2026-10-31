/**
 * Password hashing menggunakan Web Crypto API (PBKDF2 SHA-256).
 * 100% kompatibel di Cloudflare Workers, Node.js, dan browser tanpa native addon C++.
 */
const ITERATIONS = 100_000;

export const DUMMY_HASH =
	'$pbkdf2$100000$e2c3fbf4a837b58df64b8cae5a7716c7$a2b45d538234c2ef16551cae9d67fcc54e5ea6909541826b40b1b06b54a4dee9';

function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const enc = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		enc.encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt,
			iterations: ITERATIONS,
			hash: 'SHA-256'
		},
		keyMaterial,
		256
	);

	const saltHex = bytesToHex(salt);
	const hashHex = bytesToHex(new Uint8Array(derivedBits));
	return `$pbkdf2$${ITERATIONS}$${saltHex}$${hashHex}`;
}

export async function verifyPassword(digest: string, password: string): Promise<boolean> {
	try {
		if (digest.startsWith('$pbkdf2$')) {
			const parts = digest.split('$');
			// Format: ["", "pbkdf2", "100000", "saltHex", "hashHex"]
			if (parts.length !== 5) return false;
			const iterations = parseInt(parts[2], 10);
			const salt = hexToBytes(parts[3]);
			const expectedHashHex = parts[4];

			const enc = new TextEncoder();
			const keyMaterial = await crypto.subtle.importKey(
				'raw',
				enc.encode(password),
				{ name: 'PBKDF2' },
				false,
				['deriveBits']
			);
			const derivedBits = await crypto.subtle.deriveBits(
				{
					name: 'PBKDF2',
					salt,
					iterations,
					hash: 'SHA-256'
				},
				keyMaterial,
				256
			);

			const actualHashHex = bytesToHex(new Uint8Array(derivedBits));
			return timingSafeEqual(actualHashHex, expectedHashHex);
		}

		// Fallback untuk legacy Argon2 jika modul tersedia
		try {
			const argon2 = await import('@node-rs/argon2');
			return await argon2.verify(digest, password);
		} catch {
			return false;
		}
	} catch (err) {
		console.error('[verifyPassword error]', err);
		return false;
	}
}
