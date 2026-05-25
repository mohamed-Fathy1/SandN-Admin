import { http, HttpResponse } from 'msw';
import type { ApiSocialReview } from '@/shared/types/api';

const API = 'https://api.test.local';

const sample: ApiSocialReview[] = [
  {
    _id: 'rev-1',
    image: { mediaUrl: 'https://cdn.test/rev1.jpg', mediaId: 'SocialReview/rev1' },
  },
];

export const socialReviewHandlers = [
  http.get(`${API}/social-review`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { reviews: sample },
      message: 'OK',
      success: true,
    })
  ),
];
