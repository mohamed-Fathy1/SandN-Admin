import axios from 'axios';

/**
 * Plain Axios instance for S3 presigned-URL uploads.
 * Must NOT carry the admin Authorization header — S3 rejects signed PUTs that have one.
 */
export const s3 = axios.create({
  timeout: 60_000,
});
