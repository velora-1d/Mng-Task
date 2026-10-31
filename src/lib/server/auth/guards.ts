import { error, redirect } from '@sveltejs/kit';
import type { SessionUser } from './session';

/** Hanya izinkan redirect internal (cegah open redirect). */
export function safeNext(raw: string | null | undefined, fallback = '/dashboard'): string {
	if (!raw) return fallback;
	if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
	if (raw.startsWith('/login')) return fallback;
	return raw;
}

export function requireUser(locals: App.Locals, url?: URL): SessionUser {
	const user = locals.user;
	if (!user) {
		const next = url ? `?next=${encodeURIComponent(url.pathname + url.search)}` : '';
		redirect(303, `/login${next}`);
	}
	return user;
}

export function requireOwner(locals: App.Locals, url?: URL): SessionUser {
	const user = requireUser(locals, url);
	if (user.role !== 'OWNER') {
		error(403, 'Halaman ini hanya untuk Owner.');
	}
	return user;
}
