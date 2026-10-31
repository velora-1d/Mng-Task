import { hash, verify } from '@node-rs/argon2';

// Parameter mengikuti rekomendasi OWASP (Argon2id, 19 MiB, 2 iterasi).
// @node-rs/argon2 memakai Argon2id sebagai algoritma default.
const OPTIONS = {
	memoryCost: 19456,
	timeCost: 2,
	parallelism: 1
} as const;

/** Hash valid untuk verifikasi palsu saat email tidak ditemukan (anti timing leak). */
export const DUMMY_HASH =
	'$argon2id$v=19$m=19456,t=2,p=1$ruU6jQ0T+nI8yrogPbP6Zg$wITaX2pDb3G9IVRNECh7xpBa/Ijr57DLteLlAaGUKYg';

export async function hashPassword(password: string): Promise<string> {
	const digest = await hash(password, OPTIONS);
	if (!digest.startsWith('$argon2id$')) {
		throw new Error('Algoritma hash tidak sesuai — wajib Argon2id');
	}
	return digest;
}

export async function verifyPassword(digest: string, password: string): Promise<boolean> {
	try {
		return await verify(digest, password);
	} catch {
		return false;
	}
}
