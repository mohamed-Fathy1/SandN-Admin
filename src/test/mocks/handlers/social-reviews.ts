import { http, HttpResponse } from 'msw';
import type { ApiSocialReview } from '@/shared/types/api';

const API = 'https://api.test.local';

const sample: ApiSocialReview[] = [
  { _id: 'rev-1', imageUrl: 'https://cdn.test/rev1.jpg' },
];

export const socialReviewHandlers = [
  http.get(`${API}/social-review`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: { socialReviews: sample },
      message: 'OK',
      success: true,
    })
  ),
];
