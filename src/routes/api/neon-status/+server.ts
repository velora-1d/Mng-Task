import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/client';
import { users } from '#lib/server/db/schema';
import { fetchNeonAuthJwks, getNeonAuthConfig } from '#lib/server/auth/neon';
import { putAsset, listAssets, deleteAsset, DEFAULT_BUCKET } from '#lib/server/storage/client';
import { callHelloFunction } from '#lib/server/functions/client';
import { sealTasksLiveQuery, getRealtimeConfig } from '#lib/server/realtime/client';

export const GET: RequestHandler = async () => {
	const results: Record<string, any> = {};

	// 1. Test Postgres
	try {
		const userList = await db.select({ id: users.id, email: users.email }).from(users).limit(2);
		results.postgres = {
			success: true,
			userCountSample: userList.length,
			users: userList
		};
	} catch (err: any) {
		results.postgres = { success: false, error: err.message };
	}

	// 2. Test Neon Auth
	try {
		const jwks = await fetchNeonAuthJwks();
		results.auth = {
			success: true,
			config: getNeonAuthConfig(),
			keyCount: jwks.keys?.length ?? 0
		};
	} catch (err: any) {
		results.auth = { success: false, error: err.message };
	}

	// 3. Test Object Storage
	try {
		const testKey = `health-check-${Date.now()}.txt`;
		await putAsset(testKey, 'Neon Object Storage Test OK', 'text/plain');
		const files = await listAssets();
		await deleteAsset(testKey);
		results.objectStorage = {
			success: true,
			bucket: DEFAULT_BUCKET,
			objectsFound: files.length,
			testedKey: testKey
		};
	} catch (err: any) {
		results.objectStorage = { success: false, error: err.message };
	}

	// 4. Test Functions
	try {
		const fnRes = await callHelloFunction();
		results.functions = {
			success: fnRes.ok,
			status: fnRes.status,
			response: fnRes.text
		};
	} catch (err: any) {
		results.functions = { success: false, error: err.message };
	}

	// 5. Test Realtime
	try {
		const sealed = await sealTasksLiveQuery();
		results.realtime = {
			success: true,
			config: getRealtimeConfig(),
			isSealed: Boolean(sealed)
		};
	} catch (err: any) {
		results.realtime = { success: false, error: err.message };
	}

	const allOk = Object.values(results).every((r) => r.success === true);

	return json({
		status: allOk ? 'healthy' : 'degraded',
		services: results
	}, {
		status: allOk ? 200 : 500
	});
};
