import { env } from '$env/dynamic/private';
import { createRealtime } from '@neon/realtime/server';
import { drizzleAdapter } from '@neon/realtime-drizzle';
import { db } from '../db/client';
import { tasks } from '../db/schema';
import { desc } from 'drizzle-orm';

const secret = env.NEON_REALTIME_SECRET || process.env.NEON_REALTIME_SECRET;
const realtimeUrl = env.NEON_REALTIME_URL || process.env.NEON_REALTIME_URL;

export const realtime = secret
	? createRealtime({
			secret,
			db: 'neondb',
			adapter: drizzleAdapter()
		})
	: null;

export function getRealtimeConfig() {
	return {
		realtimeUrl,
		hasSecret: Boolean(secret)
	};
}

export function tasksLiveQuery() {
	return db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(50);
}

export async function sealTasksLiveQuery() {
	if (!realtime) {
		throw new Error('NEON_REALTIME_SECRET is not configured');
	}
	return await realtime.seal({ query: tasksLiveQuery() });
}
