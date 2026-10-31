import { env } from '$env/dynamic/private';
import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	DeleteObjectCommand
} from '@aws-sdk/client-s3';

const endpoint = env.AWS_ENDPOINT_URL_S3 || process.env.AWS_ENDPOINT_URL_S3;
const region = env.AWS_REGION || process.env.AWS_REGION || 'ap-southeast-1';
const accessKeyId = env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

export const s3 = new S3Client({
	endpoint,
	region,
	credentials:
		accessKeyId && secretAccessKey
			? {
					accessKeyId,
					secretAccessKey
				}
			: undefined,
	forcePathStyle: true
});

export const DEFAULT_BUCKET = 'assets';

export async function putAsset(key: string, body: string | Uint8Array | Buffer, contentType?: string) {
	return await s3.send(
		new PutObjectCommand({
			Bucket: DEFAULT_BUCKET,
			Key: key,
			Body: body,
			ContentType: contentType
		})
	);
}

export async function listAssets(prefix?: string) {
	const res = await s3.send(
		new ListObjectsV2Command({
			Bucket: DEFAULT_BUCKET,
			Prefix: prefix
		})
	);
	return res.Contents ?? [];
}

export async function getAsset(key: string) {
	return await s3.send(
		new GetObjectCommand({
			Bucket: DEFAULT_BUCKET,
			Key: key
		})
	);
}

export async function deleteAsset(key: string) {
	return await s3.send(
		new DeleteObjectCommand({
			Bucket: DEFAULT_BUCKET,
			Key: key
		})
	);
}
