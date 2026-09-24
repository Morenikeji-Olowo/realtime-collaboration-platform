import { Storage } from '@google-cloud/storage';
import { env } from './env.js';

const storage = new Storage();
const bucket = storage.bucket(env.GCS_BUCKET_NAME);

export default bucket;