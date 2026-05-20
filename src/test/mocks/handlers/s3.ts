import { http, HttpResponse } from 'msw';

const API = 'https://api.test.local';
const PRESIGNED_PUT = 'https://s3.test.local/upload/test-key';
const PUBLIC_URL = 'https://cdn.test.local/test-key';

export const s3PresignedPutUrl = PRESIGNED_PUT;
export const s3PublicUrl = PUBLIC_URL;

export const s3Handlers = [
  http.post(`${API}/aws/get-presigned-url`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: {
        files: [{ uploadUrl: PRESIGNED_PUT, fileUrl: PUBLIC_URL }],
      },
      message: 'OK',
      success: true,
    })
  ),
  http.put(PRESIGNED_PUT, ({ request }) => {
    // Assert the S3 PUT does NOT carry our admin Authorization header.
    if (request.headers.get('authorization')) {
      return new HttpResponse('Auth header leaked to S3', { status: 400 });
    }
    return new HttpResponse(null, { status: 200 });
  }),
];
