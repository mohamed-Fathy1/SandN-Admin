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
  http.get(`${API}/social-review/:id`, ({ params }) => {
    const found = sample.find((r) => r._id === params.id) ?? sample[0];
    return HttpResponse.json({
      statusCode: 200,
      data: { review: { ...found, _id: String(params.id) } },
      message: 'OK',
      success: true,
    });
  }),
  http.post(`${API}/social-review`, async ({ request }) => {
    const body = (await request.json()) as { imageUrl: string };
    const review: ApiSocialReview = {
      _id: `rev-${Date.now()}`,
      image: { mediaUrl: body.imageUrl, mediaId: `SocialReview/${Date.now()}` },
    };
    return HttpResponse.json({
      statusCode: 201,
      data: { review },
      message: 'Created',
      success: true,
    });
  }),
  http.patch(`${API}/social-review/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { imageUrl: string };
    const review: ApiSocialReview = {
      _id: String(params.id),
      image: { mediaUrl: body.imageUrl, mediaId: `SocialReview/${params.id}` },
    };
    return HttpResponse.json({
      statusCode: 200,
      data: { review },
      message: 'Updated',
      success: true,
    });
  }),
  http.delete(`${API}/social-review/:id`, () =>
    HttpResponse.json({
      statusCode: 200,
      data: null,
      message: 'Deleted',
      success: true,
    })
  ),
];
